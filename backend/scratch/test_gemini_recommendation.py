import asyncio
from app.modules.generation.recommendation_service import RecommendationService

async def test():
    print("--- Testing AWS EC2 Recommendation ---")
    res1 = await RecommendationService.recommend_instance("AWS", "ec2", {"primary_language": "Python", "framework": "FastAPI"})
    print("AWS EC2 Result:", res1)

    print("\n--- Testing AWS Fargate Recommendation ---")
    res2 = await RecommendationService.recommend_instance("AWS", "fargate", {"primary_language": "Node.js", "framework": "Express"})
    print("AWS Fargate Result:", res2)

    print("\n--- Testing GCP Cloud Run Recommendation ---")
    res3 = await RecommendationService.recommend_instance("GCP", "cloudrun", {"primary_language": "Go"})
    print("GCP Cloud Run Result:", res3)

if __name__ == "__main__":
    asyncio.run(test())
