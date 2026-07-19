variable "nsg_name" {
  description = "The name of the network security group."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the NSG."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}
