import os
from pathlib import Path
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / '.env.local')

r2 = boto3.session.Session().client('s3',
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    region_name='auto', aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
    config=Config(signature_version='s3v4'))

bucket = os.environ.get('R2_BUCKET_NAME', 'paroki-klemens-rag-content')
prefix = 'chunks/theological/'

paginator = r2.get_paginator('list_objects_v2')
total = 0
for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
    total += page.get('KeyCount', 0)

print(f'Total objek R2 di {prefix}: {total}')
