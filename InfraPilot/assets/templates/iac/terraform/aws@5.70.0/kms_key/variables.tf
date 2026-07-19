variable "alias_name" {
  description = "The alias name for the KMS key (without the \"alias/\" prefix)."
  type        = string
}

variable "description" {
  description = "The description of the KMS key."
  type        = string
  default     = "Managed by Terraform"
}

variable "deletion_window_in_days" {
  description = "Number of days before the key is deleted after destruction."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to the KMS key."
  type        = map(string)
  default     = {}
}
