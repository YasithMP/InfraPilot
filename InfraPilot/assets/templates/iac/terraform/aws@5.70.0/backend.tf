# Backend configuration for remote state storage
#
# IMPORTANT: You must create the backend storage resources BEFORE enabling this.
# Use a bootstrap script or manually create:
#   - S3 Bucket (e.g. tf-state-<account>-<region>) with versioning + encryption
#   - DynamoDB Table (e.g. terraform-locks) with a "LockID" string partition key
#
# Uncomment and fill in the values below after the backend storage is ready.
# Each env dir (environments/dev|test|prod) sets its own state key/prefix - one backend, isolated states.

# terraform {
#   backend "s3" {
#     bucket         = "" # TODO: Fill in backend S3 bucket name
#     key            = "<env>.terraform.tfstate" # unique per env dir
#     region         = "" # TODO: Fill in backend bucket region
#     dynamodb_table = "" # TODO: Fill in state lock DynamoDB table name
#     encrypt        = true
#   }
# }
