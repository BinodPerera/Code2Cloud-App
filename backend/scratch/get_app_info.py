import asyncio
import dns.resolver
from pymongo import MongoClient
import httpx

async def get_app_info():
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    user_data = db.users.find_one({"login": "BinodPerera"})
    if not user_data:
        print("User BinodPerera not found!")
        return
        
    github_access_token = user_data.get("github_access_token")
    
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        headers = {
            "Authorization": f"token {github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # 1. Fetch user installations
        res = await http_client.get("https://api.github.com/user/installations", headers=headers)
        if res.status_code == 200:
            installations = res.json().get("installations", [])
            if installations:
                inst = installations[0]
                print(f"App details from Installation:")
                print(f"  App ID: {inst.get('app_id')}")
                print(f"  App Slug/Name: {inst.get('app_slug')}")
                print(f"  Html URL: {inst.get('html_url')}")
                
if __name__ == "__main__":
    asyncio.run(get_app_info())
