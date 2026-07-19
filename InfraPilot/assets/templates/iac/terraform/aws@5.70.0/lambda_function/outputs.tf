output "function_arn" {
  value = aws_lambda_function.main.arn
}

output "function_name" {
  value = aws_lambda_function.main.function_name
}

output "invoke_arn" {
  value = aws_lambda_function.main.invoke_arn
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.main.name
}
