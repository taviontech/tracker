#!/usr/bin/env bash
# Pull all parameters from SSM Parameter Store and write them to .env.prod on EC2.
# Run this locally whenever you add/change a parameter:
#   ./scripts/sync-env.sh [-i /path/to/key.pem] [-h host]
#
# SSM path convention: /<project>/<param-name>
#   e.g. /tracker/POSTGRES_PASSWORD, /tracker/JWT_SECRET
#
# To set a parameter (plain text):
#   aws ssm put-parameter --region eu-west-1 --name "/tracker/POSTGRES_DB" --value "tracker" --type String --overwrite
#
# To set a secret (encrypted):
#   aws ssm put-parameter --region eu-west-1 --name "/tracker/POSTGRES_PASSWORD" --value "s3cr3t" --type SecureString --overwrite
set -euo pipefail

REGION="${AWS_REGION:-eu-west-1}"
PROJECT="${PROJECT:-tracker}"
SSM_PATH="/${PROJECT}"

EC2_HOST="54.229.199.216"
EC2_USER="ubuntu"
APP_DIR="/opt/tracker"
ENV_FILE=".env.prod"
SSH_KEY="/Users/ihrechyshchev/devdevdev/parasha/terraform_kp.pem"

while getopts "i:h:" opt; do
  case $opt in
    i) SSH_KEY="$OPTARG" ;;
    h) EC2_HOST="$OPTARG" ;;
    *) echo "Usage: $0 [-i ssh-key.pem] [-h host]"; exit 1 ;;
  esac
done

echo "==> Fetching parameters from SSM path: $SSM_PATH"

PARAMS=$(aws ssm get-parameters-by-path \
  --region "$REGION" \
  --path "$SSM_PATH" \
  --with-decryption \
  --query "Parameters[*].{Name:Name,Value:Value}" \
  --output json)

COUNT=$(echo "$PARAMS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

if [[ "$COUNT" -eq 0 ]]; then
  echo "No parameters found under $SSM_PATH. Nothing to do."
  echo "Add one with: aws ssm put-parameter --region $REGION --name \"$SSM_PATH/MY_VAR\" --value \"value\" --type SecureString"
  exit 0
fi

echo "==> Found $COUNT parameters. Building .env.prod..."

ENV_CONTENT=$(echo "$PARAMS" | python3 -c "
import sys, json
params = json.load(sys.stdin)
lines = []
for p in params:
    key = p['Name'].split('/')[-1]
    val = p['Value']
    if any(c in val for c in [' ', '\"', \"'\"]):
        val = '\"' + val.replace('\"', '\\\\\"') + '\"'
    lines.append(f'{key}={val}')
print('\n'.join(sorted(lines)))
")

echo "$ENV_CONTENT"
echo ""
echo "==> Writing to $EC2_HOST:$APP_DIR/$ENV_FILE ..."

ssh -i "$SSH_KEY" \
  -o StrictHostKeyChecking=no \
  -o ServerAliveInterval=30 \
  "$EC2_USER@$EC2_HOST" \
  "cat > $APP_DIR/$ENV_FILE << 'ENVEOF'
$ENV_CONTENT
ENVEOF
echo 'Written $(wc -l < $APP_DIR/$ENV_FILE) lines to $APP_DIR/$ENV_FILE'"

echo "==> Done. Run ./scripts/deploy.sh to apply changes."
