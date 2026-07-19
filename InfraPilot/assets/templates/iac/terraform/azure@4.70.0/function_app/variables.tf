variable "function_app_name" {
  description = "The name of the Function App."
  type        = string
}

variable "service_plan_name" {
  description = "The name of the App Service Plan."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the Function App resources."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "sku_name" {
  description = "The SKU name for the App Service Plan."
  type        = string
  default     = "Y1"
}

variable "storage_account_name" {
  description = "The name of the existing storage account backing the Function App."
  type        = string
}

variable "storage_account_access_key" {
  description = "The access key of the backing storage account. Leave null when using a managed identity."
  type        = string
  default     = null
  sensitive   = true
}

variable "storage_uses_managed_identity" {
  description = "Whether the Function App accesses the storage account with its managed identity."
  type        = bool
  default     = false
}

variable "runtime" {
  description = "The runtime stack (node, python, dotnet or java)."
  type        = string
  default     = "node"
}

variable "runtime_version" {
  description = "The runtime stack version."
  type        = string
  default     = "20"
}

variable "identity_type" {
  description = "The managed identity type for the Function App."
  type        = string
  default     = "SystemAssigned"
}

variable "tags" {
  description = "Tags to apply to the Function App resources."
  type        = map(string)
  default     = {}
}
