variable "registry_name" {
  description = "Globally unique container registry name (alphanumeric only)."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the container registry."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "sku" {
  description = "The container registry SKU."
  type        = string
  default     = "Basic"
}

variable "admin_enabled" {
  description = "Whether the admin user is enabled."
  type        = bool
  default     = false
}

variable "public_network_access_enabled" {
  description = "Whether public network access is enabled."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to the container registry."
  type        = map(string)
  default     = {}
}
