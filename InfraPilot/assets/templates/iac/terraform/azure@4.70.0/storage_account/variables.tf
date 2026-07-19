variable "storage_account_name" {
  description = "Globally unique storage account name."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the storage account."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "account_tier" {
  description = "Storage account tier."
  type        = string
  default     = "Standard"
}

variable "account_replication_type" {
  description = "Storage replication type."
  type        = string
  default     = "LRS"
}
