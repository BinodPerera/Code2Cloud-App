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
    if not user:
        print("User BinodPerera not found!")
        return
        
    token = user.get("github_access_token")
    print(f"Token exists: {bool(token)}")
    
    # Query GitHub repository contents directly to see manifest files
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    res = httpx.get("https://api.github.com/repos/BinodPerera/TeamDynamo_WEB/contents/", headers=headers)
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        files = [f.get("name") for f in res.json()]
        print(f"Root files: {files}")
        
    # Also fetch recursive tree
    res_tree = httpx.get("https://api.github.com/repos/BinodPerera/TeamDynamo_WEB/git/trees/main?recursive=1", headers=headers)
    if res_tree.status_code == 200:
        manifests = []
        for item in res_tree.json().get("tree", []):
            path = item.get("path", "")
            if any(path.endswith(x) for x in ["package.json", "requirements.txt", "pom.xml", "build.gradle"]):
                manifests.append(path)
        print(f"Manifest files detected in tree: {manifests}")

if __name__ == "__main__":
    get_tech_stack()
