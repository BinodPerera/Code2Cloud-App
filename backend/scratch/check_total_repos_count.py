import asyncio
import dns.resolver
from pymongo import MongoClient
import httpx

async def check_total_repos():
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
        
    print(f"Token length: {len(github_access_token)}")
    
    all_repos = []
    page = 1
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        while True:
            response = await http_client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {github_access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "per_page": 100,
                    "page": page,
                    "sort": "updated",
                    "direction": "desc",
                    "affiliation": "owner,collaborator,organization_member"
                }
            )
            print(f"Page {page} Status: {response.status_code}")
            if response.status_code == 200:
                repos = response.json()
                if not repos:
                    break
                all_repos.extend(repos)
                print(f"Fetched {len(repos)} repos on page {page}.")
                if len(repos) < 100:
                    break
                page += 1
            else:
                print(f"Error page {page}: {response.text}")
                break
                
    print(f"\nTotal repositories across all pages: {len(all_repos)}")
    
    # Analyze by ownership
    by_owner = {}
    for r in all_repos:
        owner = r.get("owner", {}).get("login")
        by_owner[owner] = by_owner.get(owner, 0) + 1
        
    print("\nRepositories by Owner/Namespace:")
    for owner, count in sorted(by_owner.items(), key=lambda x: x[1], reverse=True):
        print(f"- {owner}: {count} repos")

if __name__ == "__main__":
    asyncio.run(check_total_repos())
