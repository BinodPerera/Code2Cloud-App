from pymongo import MongoClient
import httpx

def check_installation():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    # Get user token
    user = db.users.find_one({"login": "BinodPerera"})
    if not user:
        print("User BinodPerera not found!")
        return
        
    token = user.get("github_access_token")
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    owner = "BinodPerera"
    repo = "petcare-spring-api"
    
    # Check if App is installed on target repo
    res = httpx.get(f"https://api.github.com/repos/{owner}/{repo}/installation", headers=headers)
    print(f"GET /repos/{owner}/{repo}/installation Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    check_installation()
