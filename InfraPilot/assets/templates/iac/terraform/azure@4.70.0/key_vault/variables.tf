variable "key_vault_name" {
  description = "The name of the Key Vault."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the Key Vault."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "tenant_id" {
  description = "The Azure AD tenant ID used by the Key Vault."
  type        = string
}

variable "sku_name" {
  description = "The Key Vault SKU name."
  type        = string
  default     = "standard"
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention days."
  type        = number
  default     = 90
}

variable "purge_protection_enabled" {
  description = "Enable purge protection."
  type        = bool
  default     = true
}