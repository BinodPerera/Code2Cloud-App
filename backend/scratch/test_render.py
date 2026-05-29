import os
from jinja2 import Environment, FileSystemLoader

def check():
    __file__ = "/Users/binod/Development/Code2Cloud/backend/app/api/v1/endpoints/repos.py"
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
    template_dir = os.path.join(base_dir, "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    
    print("--- EXPRESS TEMPLATE CONTENT ---")
    with open(os.path.join(template_dir, "docker/express.jinja"), "r") as f:
        print(f.read())
        
    print("\n--- SPRINGBOOT TEMPLATE CONTENT ---")
    with open(os.path.join(template_dir, "docker/springboot.jinja"), "r") as f:
        print(f.read())

    print("\n--- RENDERED EXPRESS ---")
    tmpl = env.get_template("docker/express.jinja")
    print(tmpl.render(port=3000))

if __name__ == "__main__":
    check()
