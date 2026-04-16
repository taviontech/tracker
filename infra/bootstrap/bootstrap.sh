#!/bin/bash
set -euo pipefail

REGION="eu-west-1"
STATE_BUCKET="taviontech-tracker-tfstate"
LOCK_TABLE="tracker-terraform-locks"

echo "Creating S3 state bucket: $STATE_BUCKET"
aws s3api create-bucket \
  --bucket "$STATE_BUCKET" \
  --region "$REGION" 2>/dev/null || echo "  (already exists)"

aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
    }]
  }'

aws s3api put-public-access-block \
  --bucket "$STATE_BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Creating DynamoDB lock table: $LOCK_TABLE"
aws dynamodb create-table \
  --table-name "$LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "  (already exists)"

echo ""
echo "Done. Now run from the infra/ directory:"
echo "  terraform init"
echo "  terraform plan -var-file=terraform.tfvars"
echo "  terraform apply -var-file=terraform.tfvars"