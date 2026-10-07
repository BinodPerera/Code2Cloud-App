import os
import io
import json
import uuid
import zipfile
import boto3
import cloudinary
import cloudinary.uploader
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.modules.generation.repository import GenerationRepository

class CodeGenerator:
    @staticmethod
    async def generate(
        owner: str,
        repo: str,
        service_id: str,
        cloud: str,
        tech_stack: Optional[Dict[str, Any]],
        current_user_login: str,
        generation_repo: GenerationRepository,
        registry_type: str = "native",
        region: Optional[str] = None,
        environment: str = "production",
        storage_size_gb: int = 20,
        storage_type: str = "gp3",
        db_enabled: bool = False,
        db_engine: str = "postgres",
        db_instance_class: str = "db.t3.micro",
        db_allocated_storage: int = 20,
        swap_enabled: bool = False,
        swap_size_gb: int = 2,
        aws_compute_choice: str = "ec2",
        aws_instance_type: str = "t3.micro",
        aws_use_eip: bool = True,
        gcp_compute_choice: str = "cloudrun",
        gcp_machine_type: str = "e2-micro",
        gcp_use_static_ip: bool = False,
        component_configs: Optional[Dict[str, Dict[str, Any]]] = None,
        env_vars: Optional[Dict[str, List[Dict[str, Any]]]] = None
    ) -> Dict[str, Any]:
        components_list = []
        if tech_stack and "components" in tech_stack and tech_stack["components"]:
            components_list = tech_stack["components"]
        else:
            components_list = [{
                "name": "app",
                "path": ".",
                "type": "NodeJS / Javascript",
                "libraries": []
            }]
            
        # Clean paths of all components to be directories instead of manifest files
        for comp in components_list:
            comp_path = comp.get("path", ".")
            had_manifest_in_path = False
            for suffix in ["/package.json", "/pom.xml", "/requirements.txt", "/build.gradle", "/build.gradle.kts"]:
                if comp_path.endswith(suffix):
                    had_manifest_in_path = True
                    comp_path = comp_path[:-len(suffix)]
                    break
            if comp_path in ["package.json", "pom.xml", "requirements.txt", "build.gradle", "build.gradle.kts"]:
                had_manifest_in_path = True
                comp_path = "."
            comp["path"] = comp_path
            if "has_manifest" not in comp:
                comp["has_manifest"] = had_manifest_in_path
            
        # Filter out root-level folder component in monorepos to avoid building wrapper package.json
        if len(components_list) > 1:
            components_list = [c for c in components_list if c.get("path") not in (".", "")]
            
        # Load templates from the module templates subdirectory
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        
        generated_code = {}
        generation_id = f"gen_{uuid.uuid4().hex[:8]}"

        cloud_clean = (cloud or "").lower()
        selected_region = region
        if not selected_region:
            selected_region = "us-east-1" if cloud_clean == "aws" else "us-central1"
        
        # Docker Configurations
        if service_id == "docker":
            if len(components_list) == 1:
                comp = components_list[0]
                template_name = "docker/express.jinja"
                port = comp.get("port") or 3000
                if "Python" in comp.get("type", ""):
                    template_name = "docker/fastapi.jinja"
                    port = comp.get("port") or 8000
                elif "Java" in comp.get("type", "") and "Javascript" not in comp.get("type", ""):
                    template_name = "docker/springboot.jinja"
                    port = comp.get("port") or 8080
                    
                try:
                    tmpl = env.get_template(template_name)
                    is_flask = "flask" in [l.lower() for l in comp.get("libraries", [])]
                    is_django = "django" in [l.lower() for l in comp.get("libraries", [])]
                    is_fastapi = "fastapi" in [l.lower() for l in comp.get("libraries", [])]
                    entrypoint = comp.get("entrypoint")
                    generated_code["Dockerfile"] = tmpl.render(
                        port=port,
                        entrypoint=entrypoint,
                        is_flask=is_flask,
                        is_django=is_django,
                        is_fastapi=is_fastapi,
                        project_name=repo
                    )
                except Exception as e:
                    generated_code["Dockerfile"] = f"# Fallback Dockerfile\nFROM node:22-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD [\"npm\", \"start\"]\n# error: {str(e)}"

                # Generate Docker README
                try:
                    comp_details = {
                        "name": comp.get("name", "app"),
                        "path": comp.get("path", "."),
                        "type": comp.get("type", "NodeJS / Javascript"),
                        "port": port
                    }
                    readme_tmpl = env.get_template("docker/readme.jinja")
                    generated_code["README.md"] = readme_tmpl.render(
                        project_name=repo,
                        is_multicomponent=False,
                        components=[comp_details]
                    )
                except Exception as e:
                    generated_code["README.md"] = f"# Error generating Docker README: {str(e)}"
            else:
                compose_components = []
                for comp in components_list:
                    raw_name = comp.get("name", "app")
                    comp_name = raw_name.lower().replace("/", "-").replace("\\", "-")
                    comp_path = comp.get("path", ".")
                    comp_type = comp.get("type", "")
                    
                    comp_cfg = {}
                    if component_configs and isinstance(component_configs, dict):
                        comp_cfg = component_configs.get(comp_name) or component_configs.get(raw_name) or {}
                    if comp_cfg.get("enabled", True) is False:
                        continue
                    
                    template_name = "docker/express.jinja"
                    port = comp.get("port") or 3000
                    if "Python" in comp_type:
                        template_name = "docker/fastapi.jinja"
                        port = comp.get("port") or 8000
                    elif "Java" in comp_type and "Javascript" not in comp_type:
                        template_name = "docker/springboot.jinja"
                        port = comp.get("port") or 8080
                    
                    try:
                        tmpl = env.get_template(template_name)
                        is_flask = "flask" in [l.lower() for l in comp.get("libraries", [])]
                        is_django = "django" in [l.lower() for l in comp.get("libraries", [])]
                        is_fastapi = "fastapi" in [l.lower() for l in comp.get("libraries", [])]
                        entrypoint = comp.get("entrypoint")
                        dockerfile_content = tmpl.render(
                            port=port,
                            entrypoint=entrypoint,
                            is_flask=is_flask,
                            is_django=is_django,
                            is_fastapi=is_fastapi,
                            project_name=repo
                        )
                    except Exception as e:
                        dockerfile_content = f"# Fallback Dockerfile\nFROM node:22-alpine\nWORKDIR /app\n# error: {str(e)}"
                    
                    generated_code[f"{comp_path}/Dockerfile"] = dockerfile_content
                    
                    compose_components.append({
                        "name": comp_name,
                        "path": comp_path,
                        "type": comp_type,
                        "port": port,
                        "depends_on": [] if comp_name == "backend" else ["backend"] if any(c.get("name", "").lower().replace("/", "-").replace("\\", "-") == "backend" for c in components_list) else []
                    })
                
                try:
                    compose_tmpl = env.get_template("docker/docker_compose.jinja")
                    generated_code["docker-compose.yml"] = compose_tmpl.render(components=compose_components)
                except Exception as e:
                    generated_code["docker-compose.yml"] = f"version: '3.8'\nservices:\n# error: {str(e)}"

                # Generate multi-component Docker README
                try:
                    readme_tmpl = env.get_template("docker/readme.jinja")
                    generated_code["README.md"] = readme_tmpl.render(
                        project_name=repo,
                        is_multicomponent=True,
                        components=compose_components
                    )
                except Exception as e:
                    generated_code["README.md"] = f"# Error generating Docker README: {str(e)}"

            # Ensure required manifest files exist for all components (fallback requirements.txt / package.json)
            CodeGenerator._generate_fallback_manifests(components_list, generated_code, repo)

        # Terraform Configurations (Cloud Deployment or Standalone Terraform Script)
        elif service_id in ("terraform", "cloud_deploy", "terraform_script", "terraform_only"):
            is_script_only = service_id in ("terraform_script", "terraform_only")
            tf_components = []
            for comp in components_list:
                raw_name = comp.get("name", "app")
                comp_name = raw_name.lower().replace("/", "-").replace("\\", "-")
                comp_type = comp.get("type", "")
                port = comp.get("port") or 3000
                if "Python" in comp_type:
                    port = comp.get("port") or 8000
                elif "Java" in comp_type and "Javascript" not in comp_type:
                    port = comp.get("port") or 8080
                
                comp_cfg = {}
                if component_configs and isinstance(component_configs, dict):
                    comp_cfg = component_configs.get(comp_name) or component_configs.get(raw_name) or {}

                if comp_cfg.get("enabled", True) is False:
                    continue

                comp_aws_compute = comp_cfg.get("awsComputeChoice", aws_compute_choice)
                comp_aws_instance = comp_cfg.get("awsInstanceType", aws_instance_type)
                comp_aws_use_eip = comp_cfg.get("awsUseEip", aws_use_eip)

                comp_aws_cpu, comp_aws_mem = "256", "512"
                if comp_aws_instance == "0.5 vCPU / 1 GB":
                    comp_aws_cpu, comp_aws_mem = "512", "1024"
                elif comp_aws_instance == "1.0 vCPU / 2 GB":
                    comp_aws_cpu, comp_aws_mem = "1024", "2048"

                comp_gcp_compute = comp_cfg.get("gcpComputeChoice", gcp_compute_choice)
                comp_gcp_machine = comp_cfg.get("gcpMachineType", gcp_machine_type)
                comp_gcp_use_static_ip = comp_cfg.get("gcpUseStaticIp", gcp_use_static_ip)

                comp_gcp_cpu, comp_gcp_mem = "1", "512Mi"
                if comp_gcp_machine == "1 vCPU / 1 GB":
                    comp_gcp_cpu, comp_gcp_mem = "1", "1024Mi"
                elif comp_gcp_machine == "2 vCPU / 2 GB":
                    comp_gcp_cpu, comp_gcp_mem = "2", "2048Mi"

                comp_storage_size = comp_cfg.get("storageSizeGb") or storage_size_gb or 20
                comp_swap_enabled = comp_cfg.get("swapEnabled", swap_enabled if swap_enabled is not None else False)
                comp_swap_size = comp_cfg.get("swapSizeGb", swap_size_gb or 2)

                tf_components.append({
                    "name": comp_name,
                    "port": port,
                    "path": comp.get("path", "."),
                    "type": comp_type,
                    "depends_on": [] if comp_name == "backend" else ["backend"] if any(c.get("name", "").lower().replace("/", "-").replace("\\", "-") == "backend" for c in components_list) else [],
                    "aws_compute_choice": comp_aws_compute,
                    "aws_instance_type": comp_aws_instance,
                    "aws_use_eip": comp_aws_use_eip,
                    "gcp_compute_choice": comp_gcp_compute,
                    "gcp_machine_type": comp_gcp_machine,
                    "gcp_use_static_ip": comp_gcp_use_static_ip,
                    "cpu": comp_aws_cpu if cloud.lower() == "aws" else comp_gcp_cpu,
                    "memory": comp_aws_mem if cloud.lower() == "aws" else comp_gcp_mem,
                    "instance_type": comp_aws_instance,
                    "machine_type": comp_gcp_machine,
                    "use_eip": comp_aws_use_eip,
                    "use_static_ip": comp_gcp_use_static_ip,
                    "storage_size_gb": comp_storage_size,
                    "swap_enabled": comp_swap_enabled,
                    "swap_size_gb": comp_swap_size
                })
                
            cloud_clean = (cloud or "").lower()
            selected_region = region
            if not selected_region:
                selected_region = "us-east-1" if cloud_clean == "aws" else "us-central1"

            db_port = 5432 if (db_engine or "").lower() == "postgres" else 3306
            db_name = repo.lower().replace("-", "_").replace(".", "_") + "_db"
            db_user = "c2c_admin"

            if cloud_clean == "aws":
                try:
                    providers_tmpl = env.get_template("terraform/aws/providers.jinja")
                    variables_tmpl = env.get_template("terraform/aws/variables.jinja")
                    outputs_tmpl = env.get_template("terraform/aws/outputs.jinja")
                    
                    generated_code["terraform/providers.tf"] = providers_tmpl.render(aws_region=selected_region)
                    generated_code["terraform/variables.tf"] = variables_tmpl.render(
                        project_name=repo,
                        aws_region=selected_region,
                        environment=environment,
                        storage_size_gb=storage_size_gb,
                        db_enabled=db_enabled,
                        db_engine=db_engine,
                        swap_enabled=swap_enabled,
                        swap_size_gb=swap_size_gb
                    )
                    
                    is_aws_ec2 = aws_compute_choice == "ec2" or any(c.get("aws_compute_choice") == "ec2" for c in tf_components)
                    if is_aws_ec2:
                        main_tmpl = env.get_template("terraform/aws/main_ec2.jinja")
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components, 
                            project_name=repo,
                            instance_type=aws_instance_type,
                            use_eip=aws_use_eip,
                            aws_region=selected_region,
                            environment=environment,
                            storage_size_gb=storage_size_gb,
                            storage_type=storage_type,
                            db_enabled=db_enabled,
                            db_engine=db_engine,
                            db_name=db_name,
                            db_user=db_user,
                            db_port=db_port,
                            db_instance_class=db_instance_class,
                            db_allocated_storage=db_allocated_storage,
                            swap_enabled=swap_enabled,
                            swap_size_gb=swap_size_gb
                        )
                    else:  # fargate
                        main_tmpl = env.get_template("terraform/aws/main.jinja")
                        cpu_val, mem_val = "256", "512"
                        if aws_instance_type == "0.5 vCPU / 1 GB":
                            cpu_val, mem_val = "512", "1024"
                        elif aws_instance_type == "1.0 vCPU / 2 GB":
                            cpu_val, mem_val = "1024", "2048"
                        
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components, 
                            project_name=repo,
                            cpu=cpu_val,
                            memory=mem_val,
                            aws_region=selected_region,
                            environment=environment,
                            db_enabled=db_enabled,
                            db_engine=db_engine,
                            db_name=db_name,
                            db_user=db_user,
                            db_port=db_port,
                            db_instance_class=db_instance_class,
                            db_allocated_storage=db_allocated_storage
                        )
                    
                    generated_code["terraform/outputs.tf"] = outputs_tmpl.render(
                        components=tf_components,
                        compute_choice=aws_compute_choice,
                        use_eip=aws_use_eip,
                        db_enabled=db_enabled,
                        db_engine=db_engine,
                        environment=environment
                    )

                    if not is_script_only:
                        # Generate AWS GHA workflows (Deploy, Destroy, and CD)
                        deploy_tmpl = env.get_template("workflows/aws_deploy.jinja")
                        generated_code[".github/workflows/deploy.yml"] = deploy_tmpl.render(
                            branch="code2cloud-setup",
                            repo_name=repo,
                            registry_type=registry_type,
                            components=tf_components,
                            compute_choice=aws_compute_choice,
                            aws_region=selected_region,
                            environment=environment
                        )

                        cd_tmpl = env.get_template("workflows/aws_cd.jinja")
                        generated_code[".github/workflows/cd.yml"] = cd_tmpl.render(
                            repo_name=repo,
                            registry_type=registry_type,
                            components=tf_components,
                            compute_choice=aws_compute_choice,
                            aws_region=selected_region,
                            environment=environment
                        )

                        destroy_tmpl = env.get_template("workflows/aws_destroy.jinja")
                        generated_code[".github/workflows/destroy.yml"] = destroy_tmpl.render(
                            repo_name=repo,
                            aws_region=selected_region,
                            components=tf_components
                        )
                except Exception as e:
                    generated_code["terraform/main.tf"] = f"# Error generating AWS Terraform/GHA: {str(e)}"
            elif cloud_clean == "gcp":
                try:
                    providers_tmpl = env.get_template("terraform/gcp/providers.jinja")
                    variables_tmpl = env.get_template("terraform/gcp/variables.jinja")
                    
                    generated_code["terraform/providers.tf"] = providers_tmpl.render(gcp_region=selected_region)
                    generated_code["terraform/variables.tf"] = variables_tmpl.render(
                        project_name=repo,
                        gcp_region=selected_region,
                        environment=environment,
                        storage_size_gb=storage_size_gb,
                        db_enabled=db_enabled,
                        db_engine=db_engine,
                        swap_enabled=swap_enabled,
                        swap_size_gb=swap_size_gb
                    )
                    
                    is_gcp_gce = gcp_compute_choice == "gce" or any(c.get("gcp_compute_choice") == "gce" for c in tf_components)
                    if is_gcp_gce:
                        main_tmpl = env.get_template("terraform/gcp/main_gce.jinja")
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components,
                            project_name=repo,
                            machine_type=gcp_machine_type,
                            use_static_ip=gcp_use_static_ip,
                            gcp_region=selected_region,
                            environment=environment,
                            storage_size_gb=storage_size_gb,
                            storage_type=storage_type,
                            db_enabled=db_enabled,
                            db_engine=db_engine,
                            db_name=db_name,
                            db_user=db_user,
                            db_port=db_port,
                            db_instance_class=db_instance_class,
                            db_allocated_storage=db_allocated_storage,
                            swap_enabled=swap_enabled,
                            swap_size_gb=swap_size_gb
                        )
                    else:  # cloudrun
                        main_tmpl = env.get_template("terraform/gcp/main_cloudrun.jinja")
                        cpu_val, mem_val = "1", "512Mi"
                        if gcp_machine_type == "1 vCPU / 1 GB":
                            cpu_val, mem_val = "1", "1024Mi"
                        elif gcp_machine_type == "2 vCPU / 2 GB":
                            cpu_val, mem_val = "2", "2048Mi"
                            
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components,
                            project_name=repo,
                            cpu=cpu_val,
                            memory=mem_val,
                            gcp_region=selected_region,
                            environment=environment,
                            db_enabled=db_enabled,
                            db_engine=db_engine,
                            db_name=db_name,
                            db_user=db_user,
                            db_port=db_port,
                            db_instance_class=db_instance_class
                        )

                    if not is_script_only:
                        # Generate GCP GHA workflows (Deploy, Destroy, and CD)
                        deploy_tmpl = env.get_template("workflows/gcp_deploy.jinja")
                        generated_code[".github/workflows/deploy.yml"] = deploy_tmpl.render(
                            branch="code2cloud-setup",
                            repo_name=repo,
                            registry_type=registry_type,
                            components=tf_components,
                            compute_choice=gcp_compute_choice,
                            gcp_region=selected_region,
                            environment=environment
                        )

                        cd_tmpl = env.get_template("workflows/gcp_cd.jinja")
                        generated_code[".github/workflows/cd.yml"] = cd_tmpl.render(
                            repo_name=repo,
                            registry_type=registry_type,
                            components=tf_components,
                            compute_choice=gcp_compute_choice,
                            gcp_region=selected_region,
                            environment=environment
                        )

                        destroy_tmpl = env.get_template("workflows/gcp_destroy.jinja")
                        generated_code[".github/workflows/destroy.yml"] = destroy_tmpl.render(
                            repo_name=repo,
                            gcp_region=selected_region
                        )
                    
                    # Generate GCP Terraform Outputs
                    gcp_outputs_tmpl = env.get_template("terraform/gcp/outputs.jinja")
                    generated_code["terraform/outputs.tf"] = gcp_outputs_tmpl.render(
                        components=tf_components,
                        compute_choice=gcp_compute_choice,
                        use_static_ip=gcp_use_static_ip,
                        db_enabled=db_enabled,
                        db_engine=db_engine,
                        environment=environment
                    )
                except Exception as e:
                    generated_code["terraform/main.tf"] = f"# Error generating GCP Terraform/GHA: {str(e)}"
            else:
                generated_code["terraform/providers.tf"] = f"provider \"{cloud_clean}\" {{\n}}"
                generated_code["terraform/main.tf"] = f"# Deployment script for {cloud}\nresource \"{cloud_clean}_instance\" \"app\" {{\n  name = \"{repo}-app\"\n}}"

            # Generate Terraform README
            try:
                readme_tmpl = env.get_template("terraform/readme.jinja")
                generated_code["terraform/README.md"] = readme_tmpl.render(
                    project_name=repo,
                    cloud=cloud,
                    aws_region=selected_region,
                    gcp_region=selected_region,
                    environment=environment,
                    storage_size_gb=storage_size_gb,
                    db_enabled=db_enabled,
                    db_engine=db_engine,
                    swap_enabled=swap_enabled,
                    swap_size_gb=swap_size_gb,
                    registry_type=registry_type,
                    components=tf_components
                )
            except Exception as e:
                generated_code["terraform/README.md"] = f"# Error generating Terraform README: {str(e)}"

            if is_script_only and "terraform/README.md" in generated_code:
                generated_code["README.md"] = generated_code["terraform/README.md"]

            # Ensure required manifest files exist for all components (fallback requirements.txt / package.json)
            CodeGenerator._generate_fallback_manifests(components_list, generated_code, repo)

        else:
            generated_code["finops_budget.json"] = "{\n  \"budget_name\": \"" + repo + "-monthly-budget\",\n  \"limit_amount\": \"100\"\n}"

        # Zip packing
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in generated_code.items():
                zip_file.writestr(filename, content)
        zip_buffer.seek(0)
        
        # Cloudinary upload
        cloudinary_url = ""
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            try:
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                res = cloudinary.uploader.upload(
                    zip_buffer.getvalue(),
                    resource_type="raw",
                    folder="code2cloud/generations",
                    public_id=f"{generation_id}.zip",
                    overwrite=True
                )
                cloudinary_url = res.get("secure_url") or res.get("url") or ""
            except Exception as e:
                print(f"CLOUDINARY UPLOAD FAILURE: {e}")
                
        # Persist MongoDB Hot Tier
        generation_record = {
            "generation_id": generation_id,
            "user_id": current_user_login,
            "project_name": repo,
            "repo_url": f"https://github.com/{owner}/{repo}",
            "repo_branch": "main",
            "timestamp": datetime.utcnow().isoformat(),
            "detected_tech": list(set([comp.get("type", "Generic") for comp in components_list])),
            "generated_code": generated_code,
            "url": cloudinary_url,
            "service_id": service_id,
            "cloud": cloud,
            "registry_type": registry_type,
            "region": selected_region,
            "environment": environment,
            "storage_size_gb": storage_size_gb,
            "storage_type": storage_type,
            "db_enabled": db_enabled,
            "db_engine": db_engine,
            "db_instance_class": db_instance_class,
            "db_allocated_storage": db_allocated_storage,
            "swap_enabled": swap_enabled,
            "swap_size_gb": swap_size_gb,
            "aws_compute_choice": aws_compute_choice,
            "aws_instance_type": aws_instance_type,
            "aws_use_eip": aws_use_eip,
            "gcp_compute_choice": gcp_compute_choice,
            "gcp_machine_type": gcp_machine_type,
            "gcp_use_static_ip": gcp_use_static_ip,
            "component_configs": component_configs,
            "env_vars": env_vars,
            "committed": False
        }
        
        if generation_repo is not None:
            await generation_repo.insert_generation(generation_record)
            
        return {
            "generation_id": generation_id,
            "generated_code": generated_code,
            "url": cloudinary_url,
            "project_name": repo
        }

    @staticmethod
    def _generate_fallback_manifests(
        components_list: List[Dict[str, Any]], 
        generated_code: Dict[str, str], 
        repo: str
    ):
        """
        If a component was detected without an existing manifest file (e.g. no requirements.txt for Python,
        or no package.json for Node.js), generate a minimal, valid fallback manifest so Docker build steps
        (e.g. COPY requirements.txt .) succeed unconditionally.
        """
        for comp in components_list:
            comp_path = comp.get("path", ".")
            comp_type = comp.get("type", "")
            has_manifest = comp.get("has_manifest", False)
            
            # If the component already had a manifest in the repo, skip
            if has_manifest:
                continue

            prefix = f"{comp_path}/" if comp_path not in (".", "", "app") else ""
            libs = comp.get("libraries", [])
            
            # 1. Python fallback requirements.txt
            if "Python" in comp_type:
                req_key = f"{prefix}requirements.txt"
                if req_key not in generated_code:
                    dep_lines = []
                    lower_libs = [l.lower() for l in libs]
                    if "fastapi" in lower_libs:
                        dep_lines.extend(["fastapi>=0.100.0", "uvicorn>=0.23.0"])
                    elif "flask" in lower_libs:
                        dep_lines.extend(["flask>=2.3.0", "gunicorn>=21.0.0"])
                    elif "django" in lower_libs:
                        dep_lines.extend(["django>=4.2.0", "gunicorn>=21.0.0"])
                    
                    for lib in libs:
                        if lib.strip() and lib.lower() not in [d.split(">=")[0].lower() for d in dep_lines]:
                            dep_lines.append(lib.strip())

                    if dep_lines:
                        content = "# Minimal requirements generated by Code2Cloud\n" + "\n".join(dep_lines) + "\n"
                    else:
                        content = (
                            "# Minimal requirements generated by Code2Cloud\n"
                            "# Application uses Python standard libraries.\n"
                            "# Add any third-party packages below:\n"
                        )
                    generated_code[req_key] = content

            # 2. Node.js fallback package.json
            elif "NodeJS" in comp_type or "Javascript" in comp_type:
                pkg_key = f"{prefix}package.json"
                if pkg_key not in generated_code:
                    entrypoint = comp.get("entrypoint") or "index.js"
                    pkg_deps = {}
                    for lib in libs:
                        if lib in ("express", "koa", "fastify", "cors", "dotenv"):
                            pkg_deps[lib] = "latest"
                    
                    app_name = (comp.get("name") or repo or "app").lower().replace(" ", "-").replace("/", "-")
                    pkg_data = {
                        "name": app_name,
                        "version": "1.0.0",
                        "description": "Auto-generated by Code2Cloud",
                        "main": entrypoint,
                        "scripts": {
                            "start": f"node {entrypoint}"
                        },
                        "dependencies": pkg_deps
                    }
                    generated_code[pkg_key] = json.dumps(pkg_data, indent=2) + "\n"
        
    @staticmethod
    async def update_code(generation_id: str, new_code: Dict[str, str], generation_repo: GenerationRepository) -> Dict[str, Any]:
        # 1. Re-compile ZIP & Re-upload Cold Cloudinary Tier
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in new_code.items():
                zip_file.writestr(filename, content)
        zip_buffer.seek(0)
        
        cloudinary_url = ""
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            try:
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True
                )
                res = cloudinary.uploader.upload(
                    zip_buffer.getvalue(),
                    resource_type="raw",
                    folder="code2cloud/generations",
                    public_id=f"{generation_id}.zip",
                    overwrite=True
                )
                cloudinary_url = res.get("secure_url") or res.get("url") or ""
            except Exception as e:
                print(f"CLOUDINARY RE-UPLOAD FAILURE: {e}")
                
        # 2. Update Hot Tier DB (and update the Cloudinary url) via Repository
        await generation_repo.update_generation_code(generation_id, new_code, cloudinary_url)
                
        return {"message": "Success", "generated_code": new_code, "url": cloudinary_url}
