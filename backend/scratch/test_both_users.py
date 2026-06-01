import asyncio
import dns.resolver
from pymongo import MongoClient
import httpx

async def test_both():
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    for username in ["TeamDynamo", "BinodPerera"]:
        user_data = db.users.find_one({"login": username})
        if not user_data:
            print(f"User {username} not found!")
            continue
            
        github_access_token = user_data.get("github_access_token")
        if not github_access_token:
            print(f"No access token for {username}!")
            continue
            
        print(f"\n--- Testing for user: {username} ---")
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {github_access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "per_page": 100,
                    "sort": "updated",
                    "direction": "desc",
                    "affiliation": "owner,collaborator,organization_member"
                }
            )
            print(f"Response status: {response.status_code}")
            if response.status_code == 200:
                repos = response.json()
                print(f"Total repos: {len(repos)}")
                collabs = [r.get("full_name") for r in repos if username not in r.get("full_name")]
                print(f"Collaborated repos: {collabs}")
            else:
                print(f"Error: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_both())
