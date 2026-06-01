import os
import io
import uuid
import zipfile
import boto3
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from typing import Dict, Any, List, Optional
from app.core.config import settings

class CodeGenerator:
    @staticmethod
    async def generate(
        owner: str,
        repo: str,
        service_id: str,
        cloud: str,
        tech_stack: Optional[Dict[str, Any]],
        current_user_login: str,
        db
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
            
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        template_dir = os.path.join(base_dir, "templates")
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
                        "port": port,
                        "depends_on": [] if comp_name == "backend" else ["backend"] if any(c.get("name", "").lower().replace("/", "-").replace("\\", "-") == "backend" for c in components_list) else []
                    })
                
                try:
                    compose_tmpl = env.get_template("docker/docker_compose.jinja")
                    generated_code["docker-compose.yml"] = compose_tmpl.render(components=compose_components)
                except Exception as e:
                    generated_code["docker-compose.yml"] = f"version: '3.8'\nservices:\n# error: {str(e)}"

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
                    "depends_on": [] if comp_name == "backend" else ["backend"] if any(c.get("name", "").lower().replace("/", "-").replace("\\", "-") == "backend" for c in components_list) else []
                })
                
            if cloud.lower() == "aws":
                try:
                    providers_tmpl = env.get_template("terraform/aws/providers.jinja")
                    variables_tmpl = env.get_template("terraform/aws/variables.jinja")
                    main_tmpl = env.get_template("terraform/aws/main.jinja")
                    outputs_tmpl = env.get_template("terraform/aws/outputs.jinja")
                    
                    generated_code["terraform/providers.tf"] = providers_tmpl.render(aws_region="us-east-1")
                    generated_code["terraform/variables.tf"] = variables_tmpl.render(project_name=repo, aws_region="us-east-1")
                    generated_code["terraform/main.tf"] = main_tmpl.render(components=tf_components, project_name=repo)
                    generated_code["terraform/outputs.tf"] = outputs_tmpl.render(components=tf_components)
                except Exception as e:
                    generated_code["terraform/main.tf"] = f"# Error generating Terraform: {str(e)}"
            else:
                generated_code["terraform/providers.tf"] = f"provider \"{cloud.lower()}\" {{\n}}"
                generated_code["terraform/main.tf"] = f"# Deployment script for {cloud}\nresource \"{cloud.lower()}_instance\" \"app\" {{\n  name = \"{repo}-app\"\n}}"

        else:
            generated_code["finops_budget.json"] = "{\n  \"budget_name\": \"" + repo + "-monthly-budget\",\n  \"limit_amount\": \"100\"\n}"

        # Zip packing
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in generated_code.items():
                zip_file.writestr(filename, content)
        zip_buffer.seek(0)
        
        # S3 upload
        s3_url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/history/{generation_id}.zip" if settings.AWS_S3_BUCKET_NAME else ""
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and settings.AWS_S3_BUCKET_NAME:
            try:
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                s3_client.put_object(
                    Bucket=settings.AWS_S3_BUCKET_NAME,
                    Key=f"history/{generation_id}.zip",
                    Body=zip_buffer.getvalue(),
                    ContentType="application/zip"
                )
            except Exception as e:
                print(f"AWS S3 UPLOAD FAILURE: {e}")
                
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
            "s3_url": s3_url,
            "service_id": service_id,
            "cloud": cloud,
            "committed": False
        }
        
        if db is not None:
            await db.generations.insert_one(generation_record)
            
        return {
            "generation_id": generation_id,
            "generated_code": generated_code,
            "s3_url": s3_url,
            "project_name": repo
        }
        
    @staticmethod
    async def update_code(generation_id: str, new_code: Dict[str, str], db) -> Dict[str, Any]:
        # 1. Update Hot Tier DB
        await db.generations.update_one(
            {"generation_id": generation_id},
            {"$set": {"generated_code": new_code, "timestamp": datetime.utcnow().isoformat()}}
        )
        
        # 2. Re-compile ZIP & Re-upload Cold S3 Tier
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in new_code.items():
                zip_file.writestr(filename, content)
        zip_buffer.seek(0)
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and settings.AWS_S3_BUCKET_NAME:
            try:
                s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                s3_client.put_object(
                    Bucket=settings.AWS_S3_BUCKET_NAME,
                    Key=f"history/{generation_id}.zip",
                    Body=zip_buffer.getvalue(),
                    ContentType="application/zip"
                )
            except Exception as e:
                print(f"AWS S3 RE-UPLOAD FAILURE: {e}")
                
        return {"message": "Success", "generated_code": new_code}
