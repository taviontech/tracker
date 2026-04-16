resource "aws_s3_bucket" "files" {
  bucket = var.s3_files_bucket_name
}

resource "aws_s3_bucket_public_access_block" "files" {
  bucket = aws_s3_bucket.files.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    id     = "auto-delete"
    status = "Enabled"

    filter {}

    expiration {
      days = var.s3_files_retention_days
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket_policy" "files" {
  bucket = aws_s3_bucket.files.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AppUserAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.app.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = "${aws_s3_bucket.files.arn}/*"
      },
      {
        Sid    = "AppUserListBucket"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.app.arn
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.files.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.files]
}
