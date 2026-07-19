variable "vpc_name" {
  description = "The name of the VPC."
  type        = string
}

variable "cidr_block" {
  description = "The IPv4 CIDR block for the VPC."
  type        = string
  default     = "10.10.0.0/16"
}

variable "subnet_name" {
  description = "The name of the subnet."
  type        = string
}

variable "subnet_cidr" {
  description = "The IPv4 CIDR block for the subnet."
  type        = string
  default     = "10.10.1.0/24"
}

variable "tags" {
  description = "Tags to apply to the VPC resources."
  type        = map(string)
  default     = {}
}
