import boto3
from botocore.config import Config
from app.core.config import settings

def get_s3_client():
    client_kwargs = {
        "service_name": "s3",
    }
    if settings.S3_REGION:
        client_kwargs["region_name"] = settings.S3_REGION
    if settings.S3_ACCESS_KEY_ID:
        client_kwargs["aws_access_key_id"] = settings.S3_ACCESS_KEY_ID
    if settings.S3_SECRET_ACCESS_KEY:
        client_kwargs["aws_secret_access_key"] = settings.S3_SECRET_ACCESS_KEY
    if settings.S3_ENDPOINT_URL:
        client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        client_kwargs["config"] = Config(signature_version="s3v4", s3={"addressing_style": "path"})
    else:
        client_kwargs["config"] = Config(signature_version="s3v4")
        
    return boto3.client(**client_kwargs)

from urllib.parse import urlparse, urlunparse

def rewrite_url_with_custom_domain(url: str, custom_domain: str) -> str:
    parsed = urlparse(url)
    clean_domain = custom_domain.replace("https://", "").replace("http://", "").rstrip("/")
    new_parsed = parsed._replace(netloc=clean_domain)
    return urlunparse(new_parsed)

def generate_presigned_download_url(s3_key: str, filename: str, expires_in: int = 3600) -> str:
    s3 = get_s3_client()
    try:
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": s3_key,
                "ResponseContentDisposition": f'inline; filename="{filename}"'
            },
            ExpiresIn=expires_in,
        )
        if settings.S3_CUSTOM_DOMAIN:
            url = rewrite_url_with_custom_domain(url, settings.S3_CUSTOM_DOMAIN)
        return url
    except Exception as e:
        raise e

def generate_presigned_upload_url(s3_key: str, expires_in: int = 3600) -> str:
    s3 = get_s3_client()
    try:
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": s3_key,
            },
            ExpiresIn=expires_in,
        )
        if settings.S3_CUSTOM_DOMAIN:
            url = rewrite_url_with_custom_domain(url, settings.S3_CUSTOM_DOMAIN)
        return url
    except Exception as e:
        raise e
