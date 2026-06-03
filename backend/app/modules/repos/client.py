import httpx
from typing import List, Dict, Any
from fastapi import HTTPException, status

class GitHubClient:
    @staticmethod
    async def get_user_repositories(github_access_token: str) -> List[Dict[str, Any]]:
        """
        Fetch all repositories (public and private) for the authenticated user.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
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
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"GitHub API Error: {response.text}"
                    )
                return response.json()
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Connection failure contacting GitHub API: {exc}"
                )
