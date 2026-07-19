variable "function_name" {
  description = "The name of the Lambda function."
  type        = string
}

variable "role_arn" {
  description = "The ARN of the IAM execution role (see the iam_role module)."
  type        = string
}

variable "runtime" {
  description = "The Lambda runtime."
  type        = string
  default     = "python3.12"
}

variable "handler" {
  description = "The function entrypoint handler."
  type        = string
  default     = "index.handler"
}

variable "memory_size" {
  description = "Memory size in MB."
  type        = number
  default     = 128
}

variable "timeout" {
  description = "Function timeout in seconds."
  type        = number
  default     = 30
}

variable "filename" {
  description = "Path to a local deployment package zip. Leave null when deploying from S3."
  type        = string
  default     = null
}

variable "s3_bucket" {
  description = "S3 bucket containing the deployment package. Leave null when using a local zip."
  type        = string
  default     = null
}

variable "s3_key" {
  description = "S3 key of the deployment package. Leave null when using a local zip."
  type        = string
  default     = null
}

variable "environment_variables" {
  description = "Environment variables for the function."
  type        = map(string)
  default     = {}
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to the Lambda function."
  type        = map(string)
  default     = {}
}
