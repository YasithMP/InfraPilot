variable "secret_name" {
  description = "The name of the secret."
  type        = string
}

variable "description" {
  description = "A description of the secret."
  type        = string
  default     = null
}

variable "secret_value" {
  description = "Optional initial secret value. Leave null to set the value out of band."
  type        = string
  default     = null
  sensitive   = true
}

variable "kms_key_id" {
  description = "Optional KMS key ID for encryption. Defaults to the AWS-managed key."
  type        = string
  default     = null
}

variable "recovery_window_in_days" {
  description = "Recovery window in days before permanent deletion."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to the secret."
  type        = map(string)
  default     = {}
}
