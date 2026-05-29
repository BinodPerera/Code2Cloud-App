import pymongo
from pymongo import MongoClient
import json

def check():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    print("Petcare generations:")
    for record in db.generations.find({"project_name": "petcare-spring-api"}).sort("timestamp", -1):
        record["_id"] = str(record["_id"])
        print(f"Gen ID: {record.get('generation_id')}")
        print(f"Detected Tech: {record.get('detected_tech')}")
        print(f"Service ID: {record.get('service_id')}")
        print(f"Generated Keys: {list(record.get('generated_code', {}).keys())}")
        print("Dockerfile Sample:")
        print(record.get('generated_code', {}).get('Dockerfile'))
        print("--------------------\n")

if __name__ == "__main__":
    check()
