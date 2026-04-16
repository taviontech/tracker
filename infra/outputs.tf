output "ec2_public_ip" {
  value = aws_eip.app.public_ip
}

output "s3_bucket_name" {
  value = aws_s3_bucket.files.bucket
}

output "sqs_queue_url" {
  value = aws_sqs_queue.tasks.url
}

output "sqs_queue_name" {
  value = aws_sqs_queue.tasks.name
}

output "iam_access_key_id" {
  value = aws_iam_access_key.app.id
}

output "iam_secret_access_key" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
