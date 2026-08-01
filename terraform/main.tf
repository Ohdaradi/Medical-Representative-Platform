terraform {
  required_version = ">= 1.6.0"
  required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }
}

provider "aws" { region = var.aws_region }

resource "aws_s3_bucket" "attachments" {
  bucket_prefix = "iter-pharma-attachments-"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "attachments" {
  bucket = aws_s3_bucket.attachments.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "aws:kms" } }
}

resource "aws_kms_key" "platform" { description = "ITER pharmaceutical data encryption" }

resource "aws_cloudwatch_log_group" "api" { name = "/iter-pharma/api" retention_in_days = 90 }
