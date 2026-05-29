import asyncio
import pymongo
from pymongo import MongoClient
import httpx
import base64
import json

def get_tech_stack():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    # Get user token
    user = db.users.find_one({"login": "BinodPerera"})
    token = user.get("github_access_token")
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # Check recursive tree
    res_tree = httpx.get("https://api.github.com/repos/BinodPerera/petcare-spring-api/git/trees/main?recursive=1", headers=headers)
    print(f"Status Code Tree: {res_tree.status_code}")
    if res_tree.status_code == 200:
        manifests = []
        for item in res_tree.json().get("tree", []):
            path = item.get("path", "")
            if any(path.endswith(x) for x in ["package.json", "requirements.txt", "pom.xml", "build.gradle"]):
                manifests.append(path)
        print(f"Manifest files detected: {manifests}")

    # Now let's call the actual TechStackAnalyzer
    from app.services.analyzer import TechStackAnalyzer
    
    async def run_analysis():
        res = await TechStackAnalyzer.analyze("BinodPerera", "petcare-spring-api", token)
        print("--- TECH STACK RESULTS ---")
        print(json.dumps(res, indent=2))
        
    asyncio.run(run_analysis())

if __name__ == "__main__":
    get_tech_stack()
