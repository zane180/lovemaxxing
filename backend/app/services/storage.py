"""
Photo/media storage service.
Uses Cloudinary when configured, falls back to local file storage.
"""
import os
import uuid
import aiofiles
from fastapi import UploadFile
from ..config import settings

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def upload_photo(photo: UploadFile) -> str:
    """Upload profile photo and return public URL."""
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        return await _upload_cloudinary(photo)
    return await _upload_local(photo)


async def upload_chat_media(contents: bytes, media_type: str, filename: str = "") -> str:
    """Upload chat image/video bytes and return public URL."""
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY:
        return _upload_cloudinary_bytes(contents, media_type)
    return await _upload_local_bytes(contents, filename, media_type)


def _upload_cloudinary_bytes(contents: bytes, media_type: str) -> str:
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    resource_type = "video" if media_type == "video" else "image"
    result = cloudinary.uploader.upload(
        contents,
        folder="lovemaxxing/chat",
        resource_type=resource_type,
    )
    return result["secure_url"]


async def _upload_local_bytes(contents: bytes, filename: str, media_type: str) -> str:
    default_ext = ".mp4" if media_type == "video" else ".jpg"
    ext = os.path.splitext(filename)[1] or default_ext
    fname = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, fname)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)
    return f"/uploads/{fname}"


async def _upload_cloudinary(photo: UploadFile) -> str:
    import cloudinary
    import cloudinary.uploader

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
    contents = await photo.read()
    result = cloudinary.uploader.upload(
        contents,
        folder="lovemaxxing/profiles",
        transformation=[{"width": 800, "height": 1000, "crop": "fill", "quality": "auto"}],
    )
    return result["secure_url"]


async def _upload_local(photo: UploadFile) -> str:
    ext = os.path.splitext(photo.filename or "photo.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    contents = await photo.read()
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)
    return f"/uploads/{filename}"
