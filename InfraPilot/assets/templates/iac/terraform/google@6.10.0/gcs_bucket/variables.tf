variable "bucket_name" {
  description = "Globally unique GCS bucket name."
  type        = string
}

variable "location" {
  description = "The location of the bucket (region, dual-region, or multi-region)."
  type        = string
  default     = "US"
}

variable "labels" {
  description = "A map of labels to apply to the bucket."
  type        = map(string)
  default     = {}
}
