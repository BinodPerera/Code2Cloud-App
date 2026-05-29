import os
from jinja2 import Environment, FileSystemLoader

def check():
    __file__ = "/Users/binod/Development/Code2Cloud/backend/app/api/v1/endpoints/repos.py"
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    template_dir = os.path.join(base_dir, "templates")
    
    print(f"Computed base_dir: {base_dir}")
    print(f"Computed template_dir: {template_dir}")
    print(f"Exists? {os.path.exists(template_dir)}")
    
    env = Environment(loader=FileSystemLoader(template_dir))
    try:
        templates = env.list_templates()
        print(f"Templates in Computed template_dir: {templates}")
    except Exception as e:
        print(f"Error listing computed templates: {e}")
        
    # Check backend/templates
    backend_templates = "/Users/binod/Development/Code2Cloud/backend/templates"
    print(f"\nChecking backend_templates: {backend_templates}")
    print(f"Exists? {os.path.exists(backend_templates)}")
    env2 = Environment(loader=FileSystemLoader(backend_templates))
    try:
        print(f"Templates in backend_templates: {env2.list_templates()}")
    except Exception as e:
        print(f"Error listing backend templates: {e}")

if __name__ == "__main__":
    check()
