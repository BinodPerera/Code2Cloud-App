import pymongo
from pymongo import MongoClient
import json

def check():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    for record in db.generations.find({"generation_id": "gen_a09780f0"}):
        record["_id"] = str(record["_id"])
        print(json.dumps(record, indent=2))

if __name__ == "__main__":
    check()
