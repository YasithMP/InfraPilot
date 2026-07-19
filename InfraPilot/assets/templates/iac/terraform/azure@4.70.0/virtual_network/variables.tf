variable "vnet_name" {
  description = "The name of the virtual network."
  type        = string
}

variable "subnet_name" {
  description = "The name of the subnet."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for networking resources."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "address_space" {
  description = "Address space for the virtual network."
  type        = list(string)
  default     = ["10.10.0.0/16"]
}

variable "subnet_prefixes" {
  description = "Address prefixes for the subnet."
  type        = list(string)
  default     = ["10.10.1.0/24"]
}
