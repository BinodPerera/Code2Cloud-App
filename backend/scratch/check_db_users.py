import dns.resolver
from pymongo import MongoClient

def check_db_users():
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    print("Users in database:")
    for user in db.users.find():
        print(f"Login: {user.get('login')} | ID: {user.get('id')} | Name: {user.get('name')} | Token Prefix: {user.get('github_access_token', '')[:10]}...")

if __name__ == "__main__":
    check_db_users()
