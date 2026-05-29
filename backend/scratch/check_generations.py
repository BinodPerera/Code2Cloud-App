import asyncio
import pymongo
from pymongo import MongoClient

def check():
    client = MongoClient("mongodb+srv://code2cloud:8GWP5SNBNJnYDfBn@code2cloud-cluster-2026.bnpsyy4.mongodb.net/?retryWrites=true&w=majority")
    db = client["code2cloud"]
    
    print("Listing last 3 generations:")
    for record in db.generations.find().sort("timestamp", -1).limit(3):
        print("--- RECORD ---")
        print(f"Gen ID: {record.get('generation_id')}")
        print(f"Project Name: {record.get('project_name')}")
        print(f"Service ID: {record.get('service_id')}")
        print(f"Cloud: {record.get('cloud')}")
        print(f"Detected Tech: {record.get('detected_tech')}")
        print(f"Generated Code Files: {list(record.get('generated_code', {}).keys())}")
        print("Dockerfile content sample:")
        print(record.get('generated_code', {}).get('Dockerfile'))
        print("----------------\n")

if __name__ == "__main__":
    check()
