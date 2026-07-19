variable "service_name" {
  description = "The name of the Cloud Run service."
  type        = string
}

variable "location" {
  description = "The location (region) for the Cloud Run service."
  type        = string
}

variable "image" {
  description = "The container image to deploy."
  type        = string
}

variable "port" {
  description = "The container port the service listens on."
  type        = number
  default     = 8080
}

variable "labels" {
  description = "A map of labels to apply to the service."
  type        = map(string)
  default     = {}
}
