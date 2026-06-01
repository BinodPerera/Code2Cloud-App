import asyncio
import dns.resolver
from pymongo import MongoClient
import httpx

async def check_installations():
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
        # Get Installations
        headers = {
            "Authorization": f"token {github_access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        res = await http_client.get("https://api.github.com/user/installations", headers=headers)
        print(f"User Installations status: {res.status_code}")
        if res.status_code != 200:
            print(res.text)
            return
            
        installations = res.json().get("installations", [])
        print(f"Found {len(installations)} installations.")
        
        all_app_repos = []
        for inst in installations:
            inst_id = inst.get("id")
            account = inst.get("account", {})
            print(f"Installation ID: {inst_id} | Account: {account.get('login')} ({account.get('type')})")
            
            # Fetch repositories for this installation
            repos_res = await http_client.get(
                f"https://api.github.com/user/installations/{inst_id}/repositories?per_page=100",
                headers=headers
            )
            print(f"  Repositories status: {repos_res.status_code}")
            if repos_res.status_code == 200:
                repos_data = repos_res.json().get("repositories", [])
                print(f"  Found {len(repos_data)} repositories.")
                for r in repos_data:
                    print(f"    - {r.get('full_name')} (Private: {r.get('private')})")
                    all_app_repos.append(r)
            else:
                print(f"  Error: {repos_res.text}")
                
if __name__ == "__main__":
    asyncio.run(check_installations())
