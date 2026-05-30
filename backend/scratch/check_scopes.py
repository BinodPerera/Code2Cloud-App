from pymongo import MongoClient
import httpx

def check_scopes():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    # Get user token
    user = db.users.find_one({"login": "BinodPerera"})
    if not user:
        print("User BinodPerera not found in database!")
        return
        
    token = user.get("github_access_token")
    if not token:
        print("No github_access_token found for user!")
        return
        
    print(f"Token (masked): {token[:10]}...")
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    res = httpx.get("https://api.github.com/user", headers=headers)
    print(f"GitHub /user status: {res.status_code}")
    print(f"Response: {res.text[:200]}")
    
    scopes = res.headers.get("X-OAuth-Scopes")
    accepted_scopes = res.headers.get("X-Accepted-OAuth-Scopes")
    print(f"Current Token Scopes (X-OAuth-Scopes): {scopes}")
    print(f"Accepted Scopes for endpoint: {accepted_scopes}")

if __name__ == "__main__":
    check_scopes()
