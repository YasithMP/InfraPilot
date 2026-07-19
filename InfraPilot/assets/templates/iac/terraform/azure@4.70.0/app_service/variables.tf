variable "app_service_name" {
  description = "The name of the App Service."
  type        = string
}

variable "service_plan_name" {
  description = "The name of the App Service Plan."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the App Service resources."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "os_type" {
  description = "The operating system type for the App Service Plan."
  type        = string
  default     = "Linux"
}

variable "sku_name" {
  description = "The SKU name for the App Service Plan."
  type        = string
  default     = "B1"
}

variable "always_on" {
  description = "Whether Always On is enabled for the App Service."
  type        = bool
  default     = true
}