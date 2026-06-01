import asyncio
import dns.resolver
from pymongo import MongoClient
import httpx

async def check_user_orgs():
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    user_data = db.users.find_one({"login": "BinodPerera"})
    if not user_data:
        print("User BinodPerera not found!")
        return
        
    github_access_token = user_data.get("github_access_token")
    if not github_access_token:
        print("No access token!")
        return
        
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        headers = {
            "Authorization": f"token {github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # 1. Fetch user orgs
        orgs_res = await http_client.get("https://api.github.com/user/orgs", headers=headers)
        print(f"User Orgs status: {orgs_res.status_code}")
        if orgs_res.status_code == 200:
            orgs = orgs_res.json()
            print(f"Found {len(orgs)} organizations:")
            for o in orgs:
                print(f"  - Login: {o.get('login')} | ID: {o.get('id')}")
        else:
            print(f"  Error fetching orgs: {orgs_res.text}")
            
        # 2. Fetch installations
        inst_res = await http_client.get("https://api.github.com/user/installations", headers=headers)
        if inst_res.status_code == 200:
            installations = inst_res.json().get("installations", [])
            print(f"Found {len(installations)} installations:")
            for inst in installations:
                account = inst.get("account", {})
                print(f"  - Account: {account.get('login')} (ID: {account.get('id')}) | Type: {account.get('type')}")
                
if __name__ == "__main__":
    asyncio.run(check_user_orgs())
