variable "network_name" {
  description = "The name of the VPC network."
  type        = string
}

variable "subnet_name" {
  description = "The name of the subnetwork."
  type        = string
}

variable "subnet_cidr" {
  description = "The IPv4 CIDR range for the subnetwork."
  type        = string
  default     = "10.10.1.0/24"
}

variable "region" {
  description = "The region for the subnetwork."
  type        = string
}
