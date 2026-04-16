#!/usr/bin/env bash
# Stop the EC2 instance to avoid idle charges.
# EIP stays attached, so the IP is preserved for when you start it back.
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

if [[ "$STATE" == "stopped" || "$STATE" == "stopping" ]]; then
  echo "Instance $INSTANCE_ID is already $STATE."
  exit 0
fi

echo "Stopping instance $INSTANCE_ID (current state: $STATE)..."
aws ec2 stop-instances --region "$REGION" --instance-ids "$INSTANCE_ID" > /dev/null

aws ec2 wait instance-stopped --region "$REGION" --instance-ids "$INSTANCE_ID"
echo "Instance $INSTANCE_ID stopped. EIP and data are preserved."