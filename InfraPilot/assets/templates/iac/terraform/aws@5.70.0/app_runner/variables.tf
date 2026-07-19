variable "service_name" {
  description = "The name of the App Runner service."
  type        = string
}

variable "image_identifier" {
  description = "The container image identifier (e.g. an ECR or public registry URI)."
  type        = string
}

variable "image_repository_type" {
  description = "The type of image repository (ECR or ECR_PUBLIC)."
  type        = string
  default     = "ECR_PUBLIC"
}

variable "port" {
  description = "The port the container listens on."
  type        = number
  default     = 8080
}

variable "cpu" {
  description = "The number of CPU units reserved for the service."
  type        = string
  default     = "1024"
}

variable "memory" {
  description = "The amount of memory (in MiB) reserved for the service."
  type        = string
  default     = "2048"
}

variable "tags" {
  description = "Tags to apply to the App Runner service."
  type        = map(string)
  default     = {}
}
