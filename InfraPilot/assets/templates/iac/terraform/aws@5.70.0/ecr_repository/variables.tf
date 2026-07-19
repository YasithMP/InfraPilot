variable "repository_name" {
  description = "The name of the ECR repository."
  type        = string
}

variable "image_tag_mutability" {
  description = "The tag mutability setting (MUTABLE or IMMUTABLE)."
  type        = string
  default     = "IMMUTABLE"
}

variable "scan_on_push" {
  description = "Whether images are scanned on push."
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN for encryption. Defaults to AES256."
  type        = string
  default     = null
}

variable "keep_last_images" {
  description = "Optional lifecycle policy: number of most recent images to keep. Leave null to disable."
  type        = number
  default     = null
}

variable "tags" {
  description = "Tags to apply to the ECR repository."
  type        = map(string)
  default     = {}
}
