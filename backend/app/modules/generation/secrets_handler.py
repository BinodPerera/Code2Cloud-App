import httpx
from base64 import b64encode
from nacl import encoding, public
from fastapi import HTTPException

class GitHubSecretsManager:
    @staticmethod
    async def get_public_key(owner: str, repo: str, token: str) -> dict:
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/public-key"
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "GitHub returned 403 (Resource not accessible). Your GitHub App integration lacks secrets "
                        "permissions. Please configure the GitHub App with Repository Permissions > 'Secrets' set to "
                        "'Read & write', and accept the updated permission consent in your repository/organization settings."
                    )
                )
            elif res.status_code != 200:
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Failed to fetch repository public key from GitHub: {res.text}"
                )
            return res.json()

    @staticmethod
    def encrypt_secret(public_key_b64: str, secret_value: str) -> str:
        """
        Encrypt secret value using Libsodium crypto_box_seal.
        """
        public_key = public.PublicKey(public_key_b64.encode("utf-8"), encoding.Base64Encoder())
        sealed_box = public.SealedBox(public_key)
        encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
        return b64encode(encrypted).decode("utf-8")

    @classmethod
    async def push_secret(cls, owner: str, repo: str, secret_name: str, secret_value: str, token: str) -> None:
        """
        Fetch public key, encrypt secret, and push to GitHub repository secrets.
        """
        pub_key_data = await cls.get_public_key(owner, repo, token)
        key_id = pub_key_data["key_id"]
        pub_key = pub_key_data["key"]

        encrypted_val = cls.encrypt_secret(pub_key, secret_value)

        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/{secret_name}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.put(
                url,
                headers=headers,
                json={
                    "encrypted_value": encrypted_val,
                    "key_id": key_id
                }
            )
            if res.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"GitHub returned 403 (Resource not accessible) when writing secret '{secret_name}'. "
                        "Your GitHub App integration lacks secrets permissions. Please configure the GitHub App with "
                        "Repository Permissions > 'Secrets' set to 'Read & write', and accept the updated permission consent."
                    )
                )
            elif res.status_code not in (200, 201, 204):
                raise HTTPException(
                    status_code=res.status_code,
                    detail=f"Failed to write repository secret '{secret_name}' to GitHub: {res.text}"
                )

    @staticmethod
    async def list_secrets(owner: str, repo: str, token: str) -> list:
        """
        Fetch existing secret names from GitHub repository secrets without exposing secret values.
        """
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets"
        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return [s["name"] for s in data.get("secrets", [])]
            return []
