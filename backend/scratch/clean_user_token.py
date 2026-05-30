import dns.resolver
from pymongo import MongoClient

def clean_user():
    # Configure DNS resolver to use standard Google DNS to prevent Atlas SRV resolution timeouts
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']
    
    print("Connecting to MongoDB Atlas...")
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    login = "BinodPerera"
    user = db.users.find_one({"login": login})
    if user:
        print(f"Found existing user record for '{login}'.")
        print(f"Old token prefix: {user.get('github_access_token', '')[:10]}...")
        
        # Delete user record to force clean OAuth re-registration
        res = db.users.delete_one({"login": login})
        print(f"Successfully deleted user record: {res.deleted_count}")
        print("Your cached read-only token has been wiped. Now, please log out and log back in!")
    else:
        print(f"No user record found for '{login}' in the database.")

if __name__ == "__main__":
    clean_user()
