import base64
import json
import re
import httpx
from typing import Dict, Any, List, Optional

def parse_spring_port(content: str, filename: str) -> Optional[int]:
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
                                
                                component_name = path.rsplit("/", 1)[0] if "/" in path else "app"
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
                    
                    # If standard manifests yields nothing, trigger the Deep Analyzer fallback
                    if not components:
                        deep_components = await TechStackAnalyzer.deep_analyze(client, tree_items, owner, repo, headers)
                        if deep_components:
                            components.extend(deep_components)
            except Exception:
                pass

        return {
            "languages": languages,
            "components": components
        }

    @staticmethod
    async def deep_analyze(
        client: httpx.AsyncClient,
        tree_items: List[Dict[str, Any]],
        owner: str,
        repo: str,
        headers: Dict[str, str]
    ) -> List[Dict[str, Any]]:
        """
        Fallback deep analyzer that scans alternative files, file extensions, and entrypoint source imports
        to identify components, libraries, and ports when requirements.txt or package.json are missing.
        """
        # 1. Scan for alternative configuration/lock files
        alt_manifests = {
            "pyproject.toml": "Python",
            "setup.py": "Python",
            "poetry.lock": "Python",
            "Pipfile": "Python",
            "yarn.lock": "NodeJS / Javascript",
            "pnpm-lock.yaml": "NodeJS / Javascript",
            "bun.lockb": "NodeJS / Javascript",
        }

        found_alt_components = []
        for item in tree_items:
            path = item.get("path", "")
            # Skip common ignore directories
            if any(p in path.split("/") for p in ["node_modules", "venv", ".venv", ".git", ".idea", ".vscode"]):
                continue
            
            filename = path.split("/")[-1]
            if filename in alt_manifests:
                component_name = path.rsplit("/", 1)[0] if "/" in path else "Root"
                component_path = path.rsplit("/", 1)[0] if "/" in path else "."
                cmp_type = alt_manifests[filename]
                
                # Assign default ports
                port = 8000 if cmp_type == "Python" else 3000
                
                found_alt_components.append({
                    "name": component_name,
                    "path": component_path,
                    "type": cmp_type,
                    "libraries": [],
                    "port": port
                })
        
        if found_alt_components:
            # Deduplicate by path
            seen_paths = set()
            dedup_components = []
            for comp in found_alt_components:
                if comp["path"] not in seen_paths:
                    seen_paths.add(comp["path"])
                    dedup_components.append(comp)
            return dedup_components

        # 2. Count extensions if no lockfiles found
        extension_counts = {}
        for item in tree_items:
            path = item.get("path", "")
            if any(p in path.split("/") for p in ["node_modules", "venv", ".venv", ".git", ".idea", ".vscode"]):
                continue
            
            filename = path.split("/")[-1]
            if "." in filename:
                ext = filename.split(".")[-1].lower()
                if ext in ["py", "js", "ts", "java"]:
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1
        
        if not extension_counts:
            return []
            
        primary_ext = max(extension_counts, key=extension_counts.get)
        
        # 3. Detect framework and library based on entrypoints
        # For Python:
        if primary_ext == "py":
            python_entrypoints = ["main.py", "app.py", "manage.py", "wsgi.py"]
            entrypoint_item = None
            for item in tree_items:
                path = item.get("path", "")
                if any(p in path.split("/") for p in ["node_modules", "venv", ".venv", ".git"]):
                    continue
                filename = path.split("/")[-1]
                if filename in python_entrypoints:
                    entrypoint_item = item
                    break
            
            libraries = []
            port = 8000
            
            if entrypoint_item:
                try:
                    path = entrypoint_item.get("path")
                    file_res = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
                        headers=headers
                    )
                    if file_res.status_code == 200:
                        content_data = file_res.json()
                        content = base64.b64decode(content_data["content"]).decode("utf-8")
                        
                        # Match FastAPI / Flask / Django
                        if re.search(r'\b(fastapi|FastAPI)\b', content):
                            libraries.append("fastapi")
                        elif re.search(r'\b(flask|Flask)\b', content):
                            libraries.append("flask")
                            port = 5000
                        elif re.search(r'\b(django|DJANGO_SETTINGS_MODULE)\b', content):
                            libraries.append("django")
                except Exception:
                    pass
            
            comp_path = "." if not entrypoint_item or "/" not in entrypoint_item.get("path") else entrypoint_item.get("path").rsplit("/", 1)[0]
            comp_name = "Root" if comp_path == "." else comp_path
            
            return [{
                "name": comp_name,
                "path": comp_path,
                "type": "Python",
                "libraries": libraries,
                "port": port
            }]
            
        # For NodeJS:
        elif primary_ext in ["js", "ts"]:
            node_entrypoints = ["index.js", "server.js", "main.js", "index.ts", "server.ts"]
            entrypoint_item = None
            for item in tree_items:
                path = item.get("path", "")
                if any(p in path.split("/") for p in ["node_modules", "venv", ".venv", ".git"]):
                    continue
                filename = path.split("/")[-1]
                if filename in node_entrypoints:
                    entrypoint_item = item
                    break
            
            libraries = []
            port = 3000
            
            if entrypoint_item:
                try:
                    path = entrypoint_item.get("path")
                    file_res = await client.get(
                        f"https://api.github.com/repos/{owner}/{repo}/contents/{path}",
                        headers=headers
                    )
                    if file_res.status_code == 200:
                        content_data = file_res.json()
                        content = base64.b64decode(content_data["content"]).decode("utf-8")
                        
                        if re.search(r'\bexpress\b', content) or re.search(r'require\(\s*[\'"]express[\'"]\s*\)', content):
                            libraries.append("express")
                        elif re.search(r'\bkoa\b', content) or re.search(r'require\(\s*[\'"]koa[\'"]\s*\)', content):
                            libraries.append("koa")
                        elif re.search(r'\bnestjs\b', content) or re.search(r'@Module', content):
                            libraries.append("nestjs")
                except Exception:
                    pass
            
            comp_path = "." if not entrypoint_item or "/" not in entrypoint_item.get("path") else entrypoint_item.get("path").rsplit("/", 1)[0]
            comp_name = "Root" if comp_path == "." else comp_path
                    
            return [{
                "name": comp_name,
                "path": comp_path,
                "type": "NodeJS / Javascript",
                "libraries": libraries,
                "port": port
            }]

        # For Java:
        elif primary_ext == "java":
            return [{
                "name": "Root",
                "path": ".",
                "type": "Java / Maven",
                "libraries": ["spring-boot"],
                "port": 8080
            }]

        return []
