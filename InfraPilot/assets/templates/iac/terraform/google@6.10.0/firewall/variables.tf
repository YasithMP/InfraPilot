variable "name" {
  description = "The name of the firewall rule."
  type        = string
}

variable "network" {
  description = "The network this firewall rule applies to (name or self link)."
  type        = string
}

variable "allowed_ports" {
  description = "List of TCP ports to allow."
  type        = list(string)
  default     = ["22", "80", "443"]
}

variable "source_ranges" {
  description = "Source IP CIDR ranges this rule applies to."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
