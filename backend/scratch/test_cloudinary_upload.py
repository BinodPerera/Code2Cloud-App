import sys
import os
import io
import zipfile
import uuid

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def test_upload():
    print("Cloudinary Settings:")
    print(f"Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
    print(f"API Key: {settings.CLOUDINARY_API_KEY}")
    print(f"API Secret: {'*' * len(settings.CLOUDINARY_API_SECRET) if settings.CLOUDINARY_API_SECRET else 'None'}")
    
    if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
        print("ERROR: Missing Cloudinary credentials in .env!")
        return

    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    
    # 1. Create a dummy zip file buffer
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("test.txt", "This is a test configuration file for Cloudinary cold tier migration.")
    zip_buffer.seek(0)
    
    generation_id = f"gen_test_{uuid.uuid4().hex[:8]}"
    
    print(f"\nUploading dummy ZIP to Cloudinary under folder 'code2cloud/generations' as '{generation_id}.zip'...")
    
    try:
        res = cloudinary.uploader.upload(
            zip_buffer.getvalue(),
            resource_type="raw",
            folder="code2cloud/generations",
            public_id=f"{generation_id}.zip",
            overwrite=True
        )
        print("Upload successful!")
        print(f"Public ID: {res.get('public_id')}")
        print(f"Secure URL: {res.get('secure_url')}")
        print(f"URL: {res.get('url')}")
    except Exception as e:
        print(f"Cloudinary upload failed: {e}")

if __name__ == "__main__":
    test_upload()
