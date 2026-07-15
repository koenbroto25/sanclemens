from dotenv import load_dotenv
import os

load_dotenv(r"D:\paroki_digital_stclemens\.env.local")

keys_to_check = [
    "COCKROACHDB_HOST", "COCKROACHDB_PORT", "COCKROACHDB_DBNAME",
    "COCKROACHDB_USER", "COCKROACHDB_PASSWORD",
    "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
    "GEMINI_API_KEY", "GOOGLE_API_KEY_1",
    "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME",
]

for k in keys_to_check:
    v = os.environ.get(k)
    status = "terisi" if v else "KOSONG"
    print(k + ": " + status)
