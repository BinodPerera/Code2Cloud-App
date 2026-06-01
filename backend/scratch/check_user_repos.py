import dns.resolver
from pymongo import MongoClient
import httpx
import json

def check_repos():
    # Use public DNS to prevent Atlas timeouts
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    user = db.users.find_one({"login": "BinodPerera"})
    if not user:
        print("User BinodPerera not found!")
        return
        
    token = user.get("github_access_token")
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    print("Querying GET /user/repos with affiliation=owner,collaborator,organization_member...")
    res = httpx.get(
        "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator,organization_member",
        headers=headers
    )
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        repos = res.json()
        print(f"Total repositories returned: {len(repos)}")
        for idx, repo in enumerate(repos):
            print(f"{idx+1}. Name: {repo.get('full_name')} | Owner: {repo.get('owner', {}).get('login')} | Private: {repo.get('private')} | Permissions: {repo.get('permissions')}")
    else:
        print(f"Error: {res.text}")

if __name__ == "__main__":
    check_repos()
