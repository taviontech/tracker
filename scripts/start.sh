#!/usr/bin/env bash
# Start the EC2 instance and wait until it is reachable.
set -euo pipefail

REGION="${AWS_REGION:-eu-west-1}"
PROJECT="${PROJECT:-tracker}"

echo "Looking up instance for Project=$PROJECT in $REGION..."
INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Project,Values=$PROJECT" \
             "Name=instance-state-name,Values=running,stopped,stopping,pending" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [[ "$INSTANCE_ID" == "None" || -z "$INSTANCE_ID" ]]; then
  echo "No instance found for Project=$PROJECT."
  exit 1
fi

STATE=$(aws ec2 describe-instances \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text)

if [[ "$STATE" == "running" ]]; then
  echo "Instance $INSTANCE_ID is already running."
else
  echo "Starting instance $INSTANCE_ID (current state: $STATE)..."
  aws ec2 start-instances --region "$REGION" --instance-ids "$INSTANCE_ID" > /dev/null
  aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"
  echo "Instance $INSTANCE_ID is running."
fi

PUBLIC_IP=$(aws ec2 describe-instances \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

echo "Public IP: $PUBLIC_IP"