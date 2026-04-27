#!/usr/bin/env bash
set -euo pipefail

EC2_HOST=""
EC2_USER="ubuntu"
APP_DIR="/home/ubuntu/tracker"
ENV_FILE=".env"
SSH_KEY="/Users/ihrechyshchev/devdevdev/parasha/terraform_kp.pem"
SERVICES="backend frontend"

while getopts "i:h:d:s:" opt; do
  case $opt in
    i) SSH_KEY="$OPTARG" ;;
    h) EC2_HOST="$OPTARG" ;;
    d) APP_DIR="$OPTARG" ;;
    s) SERVICES="$OPTARG" ;;
    *) echo "Usage: $0 -h <ec2-host> [-i ssh-key.pem] [-d app-dir] [-s 'service1 service2']"; exit 1 ;;
  esac
done

if [[ -z "$EC2_HOST" ]]; then
  echo "Error: EC2 host is required. Use -h <host>"
  exit 1
fi

SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ServerAliveInterval=30 $EC2_USER@$EC2_HOST"

echo "==> Pushing code to $EC2_HOST..."
rsync -az --exclude='.git' --exclude='node_modules' --exclude='target' --exclude='.env' \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$(dirname "$0")/../" "$EC2_USER@$EC2_HOST:$APP_DIR/"

echo "==> Rebuilding and restarting: $SERVICES"
$SSH "cd $APP_DIR && \
  docker compose -f docker-compose.aws.yml --env-file $ENV_FILE build $SERVICES && \
  docker compose -f docker-compose.aws.yml --env-file $ENV_FILE up -d $SERVICES"

echo "==> Waiting for the app to respond..."
for i in $(seq 1 18); do
  if curl -sf --max-time 5 --resolve "taviontracker.com:443:$EC2_HOST" "https://taviontracker.com/" > /dev/null 2>&1; then
    echo "==> Done! App is live at https://taviontracker.com"
    exit 0
  fi
  echo "  waiting... ($i/18)"
  sleep 10
done

echo "==> Deployed, but app did not respond in time. Check logs:"
echo "    $SSH 'docker compose -f $APP_DIR/docker-compose.aws.yml logs --tail=50'"