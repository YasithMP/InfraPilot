variable "function_name" {
  description = "The name of the Cloud Function."
  type        = string
}

variable "location" {
  description = "The location (region) for the Cloud Function."
  type        = string
}

variable "runtime" {
  description = "The function runtime."
  type        = string
  default     = "python312"
}

variable "entry_point" {
  description = "The name of the function entry point in the source code."
  type        = string
}

variable "source_bucket" {
  description = "The GCS bucket containing the source archive."
  type        = string
}

variable "source_object" {
  description = "The GCS object (zip archive) with the function source."
  type        = string
}

variable "available_memory" {
  description = "Memory available to the function."
  type        = string
  default     = "256M"
}

variable "timeout_seconds" {
  description = "Function timeout in seconds."
  type        = number
  default     = 60
}

variable "max_instance_count" {
  description = "Maximum number of function instances."
  type        = number
  default     = 100
}

variable "service_account_email" {
  description = "The service account email the function runs as. Leave null for the default compute service account."
  type        = string
  default     = null
}

variable "ingress_settings" {
  description = "The ingress settings for the function."
  type        = string
  default     = "ALLOW_INTERNAL_ONLY"
}

variable "labels" {
  description = "A map of labels to apply to the function."
  type        = map(string)
  default     = {}
}
