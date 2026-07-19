variable "container_app_name" {
  description = "The name of the Azure Container App."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the container app."
  type        = string
}

variable "container_app_environment_id" {
  description = "The Container App Environment ID."
  type        = string
}

variable "revision_mode" {
  description = "Revision mode for the container app."
  type        = string
  default     = "Single"
}

variable "ingress_external_enabled" {
  description = "Whether ingress is externally accessible."
  type        = bool
  default     = true
}

variable "target_port" {
  description = "Port exposed by the container."
  type        = number
  default     = 80
}

variable "container_name" {
  description = "The container name in the app template."
  type        = string
}

variable "container_image" {
  description = "The container image to run."
  type        = string
}

variable "container_cpu" {
  description = "CPU allocation for the container."
  type        = number
  default     = 0.5
}

variable "container_memory" {
  description = "Memory allocation for the container (e.g. 1Gi)."
  type        = string
  default     = "1Gi"
}

variable "min_replicas" {
  description = "Minimum number of container app replicas."
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of container app replicas."
  type        = number
  default     = 2
}