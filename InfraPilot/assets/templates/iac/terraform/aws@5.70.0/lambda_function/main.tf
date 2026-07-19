resource "aws_cloudwatch_log_group" "main" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_in_days

  tags = var.tags
}

# Lambda function deployed from a local zip (filename) or from S3 (s3_bucket/s3_key).
resource "aws_lambda_function" "main" {
  function_name = var.function_name
  role          = var.role_arn
  runtime       = var.runtime
  handler       = var.handler
  memory_size   = var.memory_size
  timeout       = var.timeout

  filename  = var.filename
  s3_bucket = var.s3_bucket
  s3_key    = var.s3_key

  environment {
    variables = var.environment_variables
  }

  tags = merge(var.tags, { Name = var.function_name })

  depends_on = [aws_cloudwatch_log_group.main]
}
