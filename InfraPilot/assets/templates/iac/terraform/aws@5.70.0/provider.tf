provider "aws" {
  # Region is intentionally not set here so modules stay provider-config free.
  # It is resolved from the AWS_REGION (or AWS_DEFAULT_REGION) environment
  # variable, or from the shared AWS config/credentials at the root.
}
