import base64
import json
import re
import httpx
from typing import Dict, Any, List, Optional

def parse_spring_port(content: str, filename: str) -> Optional[int]:
    import re
    if filename.endswith(".properties"):
        match = re.search(r'server\.port\s*=\s*(\d+)', content)
        if match:
            return int(match.group(1))
    elif filename.endswith(".yml") or filename.endswith(".yaml"):
        lines = content.splitlines()
        in_server = False
        for line in lines:
            if re.match(r'^\s*server\s*:', line):
                in_server = True
                continue
            if in_server:
                if line.strip() and not line.startswith(" ") and not line.startswith("\t"):
                    in_server = False
                else:
                    port_match = re.match(r'^\s*port\s*:\s*(\d+)', line)
                    if port_match:
                        return int(port_match.group(1))
        inline_match = re.search(r'server\.port\s*:\s*(\d+)', content)
        if inline_match:
            return int(inline_match.group(1))
    return None

class TechStackAnalyzer:
    @staticmethod
    async def analyze(owner: str, repo: str, github_access_token: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"token {github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        languages = {}
        components = []
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Get Repo default branch
            default_branch = "main"
            try:
                repo_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
                if repo_res.status_code == 200:
                    default_branch = repo_res.json().get("default_branch", "main")
            except Exception:
                pass

            # 2. Get Languages
            try:
                lang_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
                lang_res = await client.get(lang_url, headers=headers)
                if lang_res.status_code == 200:
                    languages = lang_res.json()
            except Exception:
                pass
                
            # 3. Recursive Git Tree
            try:
                tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
                tree_res = await client.get(tree_url, headers=headers)
                
                if tree_res.status_code == 200:
                    tree_data = tree_res.json()
                    tree_items = tree_data.get("tree", [])
                    
                    manifests = []
                    for item in tree_items:
                        path = item.get("path", "")
                        if "node_modules" in path or "venv" in path or ".venv" in path:
                            continue
                        if path.endswith("package.json") or path.endswith("requirements.txt") or path.endswith("pom.xml") or path.endswith("build.gradle") or path.endswith("build.gradle.kts"):
                            manifests.append(path)
                    
                    for path in manifests:
                        try:
                            file_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/contents/{path}", headers=headers)
                            if file_res.status_code == 200:
                                content_data = file_res.json()
                                content = base64.b64decode(content_data["content"]).decode("utf-8")
                                
                                component_name = path.rsplit("/", 1)[0] if "/" in path else "Root"
                                component_libraries = []
                                
                                if path.endswith("package.json"):
                                    pkg = json.loads(content)
                                    deps = pkg.get("dependencies", {})
                                    dev_deps = pkg.get("devDependencies", {})
                                    component_libraries.extend(list(deps.keys()))
                                    component_libraries.extend(list(dev_deps.keys()))
                                    cmp_type = "NodeJS / Javascript"
                                elif path.endswith("requirements.txt"):
                                    for line in content.splitlines():
                                        if line and not line.startswith("#"):
                                            name = line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                                            if name and not name.startswith("-r"):
                                                component_libraries.append(name)
                                    cmp_type = "Python"
                                elif path.endswith("pom.xml"):
                                    deps = re.findall(r'<dependency>[\s\S]*?<artifactId>([^<]+)</artifactId>[\s\S]*?</dependency>', content)
                                    component_libraries.extend(deps)
                                    cmp_type = "Java / Maven"
                                elif path.endswith("build.gradle") or path.endswith("build.gradle.kts"):
                                    deps = re.findall(r'(?:implementation|api|compileOnly|runtimeOnly|testImplementation|testCompile|compile)\s*\(*\s*[\'\"]([^\'\"]+)[\'\"]\)*', content)
                                    for dep in deps:
                                        parts = dep.split(':')
                                        if len(parts) >= 2:
                                            component_libraries.append(f"{parts[0]}:{parts[1]}")
                                        else:
                                            component_libraries.append(dep)
                                    cmp_type = "Java / Gradle"
                                    
                                if component_libraries:
                                    spring_port = None
                                    if cmp_type.startswith("Java"):
                                        prefix = path.rsplit("/", 1)[0] + "/" if "/" in path else ""
                                        config_files = []
                                        for t_item in tree_items:
                                            t_path = t_item.get("path", "")
                                            if t_path.startswith(prefix) and (t_path.endswith("application.properties") or t_path.endswith("application.yml") or t_path.endswith("application.yaml")):
                                                config_files.append(t_path)
                                                
                                        for cfg_path in config_files:
                                            try:
                                                cfg_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/contents/{cfg_path}", headers=headers)
                                                if cfg_res.status_code == 200:
                                                    cfg_data = cfg_res.json()
                                                    cfg_content = base64.b64decode(cfg_data["content"]).decode("utf-8")
                                                    parsed_port = parse_spring_port(cfg_content, cfg_path)
                                                    if parsed_port:
                                                        spring_port = parsed_port
                                                        break
                                            except Exception:
                                                continue

                                    components.append({
                                        "name": component_name,
                                        "path": path,
                                        "type": cmp_type,
                                        "libraries": list(set(component_libraries)),
                                        "port": spring_port
                                    })
                        except Exception:
                            continue
            except Exception:
                pass

        return {
            "languages": languages,
            "components": components
        }
