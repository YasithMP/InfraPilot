variable "identity_name" {
  description = "The name of the user-assigned managed identity."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the managed identity."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}