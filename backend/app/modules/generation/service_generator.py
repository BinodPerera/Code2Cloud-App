import os
import io
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
        aws_compute_choice: str = "fargate",
        aws_instance_type: str = "t3.micro",
        aws_use_eip: bool = False,
        gcp_compute_choice: str = "cloudrun",
        gcp_machine_type: str = "e2-micro",
        gcp_use_static_ip: bool = False
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
            for suffix in ["/package.json", "/pom.xml", "/requirements.txt", "/build.gradle", "/build.gradle.kts"]:
                if comp_path.endswith(suffix):
                    comp_path = comp_path[:-len(suffix)]
                    break
            if comp_path in ["package.json", "pom.xml", "requirements.txt", "build.gradle", "build.gradle.kts"]:
                comp_path = "."
            comp["path"] = comp_path
            
        # Filter out root-level folder component in monorepos to avoid building wrapper package.json
        if len(components_list) > 1:
            components_list = [c for c in components_list if c.get("path") not in (".", "")]
            
        # Load templates from the module templates subdirectory
        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        env = Environment(loader=FileSystemLoader(template_dir))
        
        generated_code = {}
        generation_id = f"gen_{uuid.uuid4().hex[:8]}"
        
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
                    generated_code["Dockerfile"] = tmpl.render(port=port)
                except Exception as e:
                    generated_code["Dockerfile"] = f"# Fallback Dockerfile\nFROM node:18-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD [\"npm\", \"start\"]\n# error: {str(e)}"

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
                        dockerfile_content = tmpl.render(port=port)
                    except Exception as e:
                        dockerfile_content = f"# Fallback Dockerfile\nFROM node:18-alpine\nWORKDIR /app\n# error: {str(e)}"
                    
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

        # Terraform Configurations
        elif service_id == "terraform":
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
                
                tf_components.append({
                    "name": comp_name,
                    "port": port,
                    "path": comp.get("path", "."),
                    "type": comp_type,
                    "depends_on": [] if comp_name == "backend" else ["backend"] if any(c.get("name", "").lower().replace("/", "-").replace("\\", "-") == "backend" for c in components_list) else []
                })
                
            if cloud.lower() == "aws":
                try:
                    providers_tmpl = env.get_template("terraform/aws/providers.jinja")
                    variables_tmpl = env.get_template("terraform/aws/variables.jinja")
                    outputs_tmpl = env.get_template("terraform/aws/outputs.jinja")
                    
                    generated_code["terraform/providers.tf"] = providers_tmpl.render(aws_region="us-east-1")
                    generated_code["terraform/variables.tf"] = variables_tmpl.render(project_name=repo, aws_region="us-east-1")
                    
                    if aws_compute_choice == "ec2":
                        main_tmpl = env.get_template("terraform/aws/main_ec2.jinja")
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components, 
                            project_name=repo,
                            instance_type=aws_instance_type,
                            use_eip=aws_use_eip
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
                            memory=mem_val
                        )
                    
                    generated_code["terraform/outputs.tf"] = outputs_tmpl.render(
                        components=tf_components,
                        compute_choice=aws_compute_choice,
                        use_eip=aws_use_eip
                    )

                    # Generate AWS GHA workflow
                    workflow_tmpl = env.get_template("workflows/aws_deploy.jinja")
                    generated_code[".github/workflows/deploy.yml"] = workflow_tmpl.render(
                        branch="code2cloud-setup",
                        repo_name=repo,
                        registry_type=registry_type,
                        components=tf_components
                    )
                except Exception as e:
                    generated_code["terraform/main.tf"] = f"# Error generating AWS Terraform/GHA: {str(e)}"
            elif cloud.lower() == "gcp":
                try:
                    providers_tmpl = env.get_template("terraform/gcp/providers.jinja")
                    variables_tmpl = env.get_template("terraform/gcp/variables.jinja")
                    
                    generated_code["terraform/providers.tf"] = providers_tmpl.render(gcp_region="us-central1")
                    generated_code["terraform/variables.tf"] = variables_tmpl.render(project_name=repo)
                    
                    if gcp_compute_choice == "gce":
                        main_tmpl = env.get_template("terraform/gcp/main_gce.jinja")
                        generated_code["terraform/main.tf"] = main_tmpl.render(
                            components=tf_components,
                            project_name=repo,
                            machine_type=gcp_machine_type,
                            use_static_ip=gcp_use_static_ip,
                            gcp_region="us-central1"
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
                            gcp_region="us-central1"
                        )

                    # Generate GCP GHA workflow
                    workflow_tmpl = env.get_template("workflows/gcp_deploy.jinja")
                    generated_code[".github/workflows/deploy.yml"] = workflow_tmpl.render(
                        branch="code2cloud-setup",
                        repo_name=repo,
                        registry_type=registry_type,
                        components=tf_components
                    )
                    
                    # Generate GCP Terraform Outputs
                    gcp_outputs_tmpl = env.get_template("terraform/gcp/outputs.jinja")
                    generated_code["terraform/outputs.tf"] = gcp_outputs_tmpl.render(
                        components=tf_components,
                        compute_choice=gcp_compute_choice,
                        use_static_ip=gcp_use_static_ip
                    )
                except Exception as e:
                    generated_code["terraform/main.tf"] = f"# Error generating GCP Terraform/GHA: {str(e)}"
            else:
                generated_code["terraform/providers.tf"] = f"provider \"{cloud.lower()}\" {{\n}}"
                generated_code["terraform/main.tf"] = f"# Deployment script for {cloud}\nresource \"{cloud.lower()}_instance\" \"app\" {{\n  name = \"{repo}-app\"\n}}"

            # Generate Terraform README
            try:
                readme_tmpl = env.get_template("terraform/readme.jinja")
                generated_code["terraform/README.md"] = readme_tmpl.render(
                    project_name=repo,
                    cloud=cloud,
                    aws_region="us-east-1",
                    components=tf_components
                )
            except Exception as e:
                generated_code["terraform/README.md"] = f"# Error generating Terraform README: {str(e)}"

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
            "aws_compute_choice": aws_compute_choice,
            "aws_instance_type": aws_instance_type,
            "aws_use_eip": aws_use_eip,
            "gcp_compute_choice": gcp_compute_choice,
            "gcp_machine_type": gcp_machine_type,
            "gcp_use_static_ip": gcp_use_static_ip,
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
