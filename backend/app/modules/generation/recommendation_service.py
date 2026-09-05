import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

VALID_OPTIONS = {
    "AWS": {
        "ec2": ["t3.micro", "t3.small", "t3.medium", "t3.large"],
        "fargate": ["0.25 vCPU / 512 MB", "0.5 vCPU / 1 GB", "1.0 vCPU / 2 GB", "2.0 vCPU / 4 GB"]
    },
    "GCP": {
        "cloudrun": ["1 vCPU / 512 MB", "1 vCPU / 1 GB", "2 vCPU / 2 GB", "2 vCPU / 4 GB"],
        "gce": ["e2-micro", "e2-small", "e2-medium", "e2-standard-2"]
    }
}

DEFAULT_FALLBACKS = {
    "AWS": {
        "ec2": ("t3.micro", "Default AWS EC2 free-tier t3.micro selected for general-purpose baseline performance."),
        "fargate": ("0.25 vCPU / 512 MB", "Default lightweight ECS Fargate container tier selected for cost efficiency.")
    },
    "GCP": {
        "cloudrun": ("1 vCPU / 512 MB", "Default Cloud Run serverless instance allocated for low-latency request handling."),
        "gce": ("e2-micro", "Default Compute Engine e2-micro instance selected for standard minimal workload requirements.")
    }
}

class RecommendationService:
    @staticmethod
    async def recommend_instance(
        cloud: str,
        compute_choice: str,
        tech_stack: Optional[Dict[str, Any]] = None,
        component_name: Optional[str] = None,
        component_type: Optional[str] = None
    ) -> Dict[str, str]:
        cloud_upper = (cloud or "AWS").upper()
        choice_lower = (compute_choice or "ec2").lower()

        # Smart FinOps heuristics for fallback and prompt context
        comp_name_lower = (component_name or "").lower()
        comp_type_lower = (component_type or "").lower()
        is_frontend = any(k in comp_name_lower for k in ["frontend", "client", "ui", "web", "app"]) or any(k in comp_type_lower for k in ["react", "vue", "svelte", "vite", "angular", "static"])
        is_heavy = any(k in comp_type_lower for k in ["java", "spring", "dotnet", "c#", "django", "tensorflow", "pytorch"])

        if is_frontend:
            fallback_option = "t3.micro" if choice_lower == "ec2" else "0.25 vCPU / 512 MB" if choice_lower == "fargate" else "e2-micro" if choice_lower == "gce" else "1 vCPU / 512 MB"
            fallback_storage = 10
            fallback_swap_enabled = True if choice_lower in ["ec2", "gce"] else False
            fallback_swap_size = 1
            fallback_reason = f"Lightweight {fallback_option} with {fallback_storage} GB SSD & {fallback_swap_size} GB Swap selected for frontend SPA to maximize cost efficiency while serving compiled static assets."
        elif not is_heavy:
            fallback_option = "t3.micro" if choice_lower == "ec2" else "0.25 vCPU / 512 MB" if choice_lower == "fargate" else "e2-micro" if choice_lower == "gce" else "1 vCPU / 512 MB"
            fallback_storage = 20
            fallback_swap_enabled = True if choice_lower in ["ec2", "gce"] else False
            fallback_swap_size = 2
            fallback_reason = f"Cost-optimized {fallback_option} with {fallback_storage} GB SSD & {fallback_swap_size} GB Swap selected for lightweight backend; virtual RAM handles burst traffic at $0 compute cost."
        else:
            fallback_option = "t3.small" if choice_lower == "ec2" else "0.5 vCPU / 1 GB" if choice_lower == "fargate" else "e2-small" if choice_lower == "gce" else "1 vCPU / 1 GB"
            fallback_storage = 30
            fallback_swap_enabled = True if choice_lower in ["ec2", "gce"] else False
            fallback_swap_size = 2
            fallback_reason = f"{fallback_option} with {fallback_storage} GB SSD & {fallback_swap_size} GB Swap allocated to support memory requirements of JVM / enterprise application framework."

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.info("GEMINI_API_KEY not configured. Returning fallback instance recommendation.")
            return {
                "recommended_instance": fallback_option,
                "recommended_storage_gb": fallback_storage,
                "recommended_swap_enabled": fallback_swap_enabled,
                "recommended_swap_size_gb": fallback_swap_size,
                "reasoning": fallback_reason,
                "source": "fallback"
            }

        valid_list = VALID_OPTIONS.get(cloud_upper, {}).get(choice_lower, [fallback_option])

        prompt = f"""You are a Cloud Infrastructure Architect and FinOps Optimization AI. Analyze the project details below and select the MOST COST-EFFECTIVE and APPROPRIATE compute sizing, root SSD storage volume size (GB), and Linux swap memory size (GB) for deployment.

Project Information:
- Cloud Provider: {cloud_upper}
- Compute Target: {choice_lower}
- Component Name: {component_name or 'Main Application'}
- Component Type: {component_type or 'Web Service'}
- Tech Stack Analytics: {json.dumps(tech_stack or {})}

Valid Options for compute target (Select EXACTLY ONE string from this list):
{json.dumps(valid_list)}

FinOps Sizing Guidelines:
1. FRONTEND / SPA (React, Vite, Vue, Svelte, Angular, Static Web):
   - recommended_instance: 't3.micro' (EC2), '0.25 vCPU / 512 MB' (Fargate), '1 vCPU / 512 MB' (Cloud Run), 'e2-micro' (GCE).
   - recommended_storage_gb: 10 (Lightweight 10 GB SSD is optimal for static frontends)
   - recommended_swap_enabled: true (for EC2/GCE) or false (for serverless containers)
   - recommended_swap_size_gb: 1 (1 GB Swap is ideal for static web delivery)
2. LIGHTWEIGHT BACKENDS (FastAPI, Express.js, Flask, Go, Node.js, Python, Ruby Sinatra):
   - recommended_instance: 't3.micro' (EC2) or 'e2-micro' (GCE).
   - recommended_storage_gb: 20 (Standard 20 GB SSD for backend dependencies & logs)
   - recommended_swap_enabled: true
   - recommended_swap_size_gb: 2 (2 GB Swap recommended to absorb memory spikes at $0 cost)
3. MEDIUM BACKENDS (NestJS, Django with Celery, small Java Spring Boot):
   - recommended_instance: 't3.small' (EC2) or 'e2-small' (GCE) / '1.0 vCPU / 2 GB' (Fargate) / '1 vCPU / 1 GB' or '2 vCPU / 2 GB' (Cloud Run).
   - recommended_storage_gb: 30 or 50
   - recommended_swap_enabled: true
   - recommended_swap_size_gb: 2 or 3
4. HEAVY ENTERPRISE MONOLITHS (Large Java Spring monoliths, PyTorch/TensorFlow ML inference):
   - recommended_instance: 't3.medium' (EC2) / 'e2-medium' (GCE).
   - recommended_storage_gb: 50 or 100
   - recommended_swap_enabled: true
   - recommended_swap_size_gb: 4

Avoid unnecessary over-provisioning! Prioritize cost-efficiency and Free Tier compatibility whenever suitable.

Output strictly valid JSON in the following format:
{{
  "recommended_instance": "<exact string from valid options>",
  "recommended_storage_gb": <integer: 10, 20, 50, or 100>,
  "recommended_swap_enabled": <true or false>,
  "recommended_swap_size_gb": <integer: 1, 2, 3, or 4>,
  "reasoning": "<1-2 concise sentences explaining why this compute sizing, storage, and swap were chosen>"
}}
"""

        configured_model = getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite") or "gemini-3.5-flash-lite"
        models_to_try = [configured_model]
        for m in ["gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.0-flash"]:
            if m not in models_to_try:
                models_to_try.append(m)
        last_error_reason = None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for model in models_to_try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                    payload = {
                        "contents": [
                            {
                                "parts": [
                                    {"text": prompt}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "responseMimeType": "application/json"
                        }
                    }

                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text_content = candidates[0]["content"]["parts"][0]["text"]
                            parsed = json.loads(text_content)
                            rec = parsed.get("recommended_instance")
                            rec_storage = parsed.get("recommended_storage_gb", fallback_storage)
                            rec_swap_enabled = parsed.get("recommended_swap_enabled", fallback_swap_enabled)
                            rec_swap_size = parsed.get("recommended_swap_size_gb", fallback_swap_size)
                            reasoning = parsed.get("reasoning", "")

                            # Ensure recommended instance matches one of valid options
                            if rec in valid_list:
                                return {
                                    "recommended_instance": rec,
                                    "recommended_storage_gb": int(rec_storage),
                                    "recommended_swap_enabled": bool(rec_swap_enabled),
                                    "recommended_swap_size_gb": int(rec_swap_size),
                                    "reasoning": reasoning or f"Gemini AI selected {rec} with {rec_storage}GB SSD & {rec_swap_size}GB Swap as the optimal sizing.",
                                    "source": "gemini"
                                }
                            else:
                                for opt in valid_list:
                                    if opt.lower() in str(rec).lower():
                                        return {
                                            "recommended_instance": opt,
                                            "recommended_storage_gb": int(rec_storage),
                                            "recommended_swap_enabled": bool(rec_swap_enabled),
                                            "recommended_swap_size_gb": int(rec_swap_size),
                                            "reasoning": reasoning or f"Gemini AI matched {opt} with {rec_storage}GB SSD & {rec_swap_size}GB Swap.",
                                            "source": "gemini"
                                        }
                    elif resp.status_code == 429:
                        if not last_error_reason:
                            last_error_reason = f"Gemini API daily request quota exceeded for this key (HTTP 429 Rate Limit). Using safe baseline default {fallback_option}."
                        logger.warning(f"Gemini API 429 Rate Limit on model {model}")
                    else:
                        logger.warning(f"Gemini API model {model} returned status {resp.status_code}: {resp.text}")

        except Exception as e:
            logger.error(f"Error calling Gemini API for instance recommendation: {e}")

        return {
            "recommended_instance": fallback_option,
            "recommended_storage_gb": fallback_storage,
            "recommended_swap_enabled": fallback_swap_enabled,
            "recommended_swap_size_gb": fallback_swap_size,
            "reasoning": last_error_reason or fallback_reason,
            "source": "fallback"
        }

