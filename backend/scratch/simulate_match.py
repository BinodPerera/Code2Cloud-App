import os
import uuid
from jinja2 import Environment, FileSystemLoader

def simulate():
    # Simulate single component
    components_list = [{
        "name": "app",
        "path": ".",
        "type": "NodeJS / Javascript",
        "libraries": []
    }]
    
    base_dir = "/Users/binod/Development/Code2Cloud/backend"
    template_dir = os.path.join(base_dir, "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    
    comp = components_list[0]
    template_name = "docker/express.jinja"
    
    print(f"Initial template_name: {template_name}")
    print(f"comp type: {comp.get('type')}")
    
    if "Python" in comp.get("type", ""):
        template_name = "docker/fastapi.jinja"
    elif "Java" in comp.get("type", ""):
        template_name = "docker/springboot.jinja"
        
    print(f"Selected template_name: {template_name}")
    
    tmpl = env.get_template(template_name)
    content = tmpl.render(port=3000)
    print("--- RENDERED CONTENT ---")
    print(content[:200])

if __name__ == "__main__":
    simulate()
