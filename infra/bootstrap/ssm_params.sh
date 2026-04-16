#!/bin/bash
# One-time SSM Parameter Store setup for tracker.
# Run this once before the first deploy.
# Requires: aws CLI configured with admin credentials (AKIAVPUAHAKJJBW7N2TB).
set -euo pipefail

REGION="eu-west-1"
PREFIX="/tracker"

put_string() {
  aws ssm put-parameter --region "$REGION" \
    --name "$PREFIX/$1" --value "$2" \
    --type String --overwrite
}

put_secure() {
  aws ssm put-parameter --region "$REGION" \
    --name "$PREFIX/$1" --value "$2" \
    --type SecureString --overwrite
}

# ── Database ──────────────────────────────────────────────────
put_string  POSTGRES_DB       "tracker"
put_string  POSTGRES_USER     "tracker"
put_secure  POSTGRES_PASSWORD "9J1gtkaEEkzRQxkEy89McWeFok2HfgzX"

# ── Auth ──────────────────────────────────────────────────────
put_secure  JWT_SECRET        "kYjhdAAGb0n8EYkKUFPxBP9iwsa9Es1RplBMM4zlZGcT75pmdvAqyyZIsoaIWDw7FpGRaLZaYTqMpIIf"
put_string  JWT_EXPIRY_HOURS  "24"

# ── URLs — replace EC2_IP with the EIP from terraform output ─
EC2_IP="${1:-REPLACE_WITH_EC2_IP}"
put_string  CORS_ALLOWED_ORIGINS  "http://$EC2_IP"
put_string  FRONTEND_URL          "http://$EC2_IP"
put_string  NEXT_PUBLIC_API_URL   "http://$EC2_IP"

# ── Mail (Gmail App Password) ─────────────────────────────────
put_string  MAIL_HOST              "smtp.gmail.com"
put_string  MAIL_PORT              "587"
put_string  MAIL_USERNAME          "illia.hrechyshchev@taviontech.com"
put_secure  MAIL_PASSWORD          "hkwd attz kfoc sqsc"
put_string  CONTACT_RECIPIENT_EMAIL "illia.hrechyshchev@taviontech.com"

# ── AWS (only needed for CloudWatch logging driver) ───────────
put_string  AWS_REGION  "eu-west-1"

# ── Donation wallets ──────────────────────────────────────────
put_string  WALLET_BTC_MAINNET  "bc1qdce7ka2gjd9f5qsaeg4fhk5k0njfx6uc8tetxk"
put_string  WALLET_ETH_ERC20    "0x848728D96F1F7C53C5D96a708AF9ce0031dbFEcF"
put_string  WALLET_ETH_BEP20    "0x848728D96F1F7C53C5D96a708AF9ce0031dbFEcF"
put_string  WALLET_USDT_ERC20   "0x848728D96F1F7C53C5D96a708AF9ce0031dbFEcF"
put_string  WALLET_USDT_TRC20   "TF5NCzHJPe87C5BvgTMrk6dEh6Xa9oHXjr"
put_string  WALLET_USDT_BEP20   "0x848728D96F1F7C53C5D96a708AF9ce0031dbFEcF"
put_string  WALLET_SOL_MAINNET  "9XeLwxvocM9yxpnqhGgGqtJEaCPgPPnhoNBTvrAPjWXV"
put_string  WALLET_TON_MAINNET  "UQBp_nWRaq_LZGD6c6uat6VR1adnarneYMj6KFlKZKKVXlMG"

echo ""
echo "Done. Parameters written to $PREFIX/* in $REGION"
echo "Verify: aws ssm get-parameters-by-path --region $REGION --path $PREFIX --output table"
echo ""
echo "Usage: $0 <EC2_IP>   — pass the EIP from 'terraform output ec2_public_ip'"