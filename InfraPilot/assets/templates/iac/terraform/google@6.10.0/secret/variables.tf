variable "secret_id" {
  description = "The ID of the secret (unique within the project)."
  type        = string
}

variable "labels" {
  description = "A map of labels to apply to the secret."
  type        = map(string)
  default     = {}
}
