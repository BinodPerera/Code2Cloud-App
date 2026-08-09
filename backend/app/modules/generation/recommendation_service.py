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

        # Get fallback default for safety
        fallback_option, fallback_reason = DEFAULT_FALLBACKS.get(cloud_upper, {}).get(
            choice_lower, ("t3.micro" if cloud_upper == "AWS" else "e2-micro", "Default baseline resource tier selected.")
        )

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.info("GEMINI_API_KEY not configured. Returning fallback instance recommendation.")
            return {
                "recommended_instance": fallback_option,
                "reasoning": fallback_reason,
                "source": "fallback"
            }

        valid_list = VALID_OPTIONS.get(cloud_upper, {}).get(choice_lower, [fallback_option])

        prompt = f"""You are a Cloud Infrastructure Architect AI. Analyze the project details below and select the SINGLE BEST instance/machine type size for deployment.

Project Information:
- Cloud Provider: {cloud_upper}
- Compute Target: {choice_lower}
- Component Name: {component_name or 'Main Application'}
- Component Type: {component_type or 'Web Service'}
- Tech Stack Analytics: {json.dumps(tech_stack or {})}

Valid Options for this target (Select EXACTLY ONE string from this list):
{json.dumps(valid_list)}

Instructions:
1. Select EXACTLY ONE string from the valid options list above.
2. Provide a clear, concise 1-2 sentence explanation under "reasoning" explaining why this specific sizing was selected based on the tech stack, languages, or framework requirements.

Output strictly valid JSON in the following format:
{{
  "recommended_instance": "<exact string from valid options>",
  "reasoning": "<1-2 sentence explanation>"
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
                            reasoning = parsed.get("reasoning", "")

                            # Ensure recommended instance matches one of valid options
                            if rec in valid_list:
                                return {
                                    "recommended_instance": rec,
                                    "reasoning": reasoning or f"Gemini AI selected {rec} as the optimal sizing for this tech stack.",
                                    "source": "gemini"
                                }
                            else:
                                for opt in valid_list:
                                    if opt.lower() in str(rec).lower():
                                        return {
                                            "recommended_instance": opt,
                                            "reasoning": reasoning or f"Gemini AI matched {opt} for this service workload.",
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
            "reasoning": last_error_reason or fallback_reason,
            "source": "fallback"
        }

