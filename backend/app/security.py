from fastapi import UploadFile, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

async def read_upload(file: UploadFile, max_mb: int) -> bytes:
    data = await file.read()
    if len(data) > max_mb * 1024 * 1024:
        raise HTTPException(413, f"File too large (max {max_mb}MB)")
    return data