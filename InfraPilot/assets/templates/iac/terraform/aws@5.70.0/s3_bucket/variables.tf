variable "bucket_name" {
  description = "Globally unique S3 bucket name."
  type        = string
}

variable "tags" {
  description = "Tags to apply to the S3 bucket."
  type        = map(string)
  default     = {}
}
