variable "name" {
  description = "The name of the security group."
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID the security group belongs to."
  type        = string
}

variable "ingress_from_port" {
  description = "Start port for the ingress rule."
  type        = number
  default     = 443
}

variable "ingress_to_port" {
  description = "End port for the ingress rule."
  type        = number
  default     = 443
}

variable "ingress_protocol" {
  description = "Protocol for the ingress rule."
  type        = string
  default     = "tcp"
}

variable "ingress_cidr_blocks" {
  description = "CIDR blocks allowed for inbound traffic."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "egress_from_port" {
  description = "Start port for the egress rule."
  type        = number
  default     = 0
}

variable "egress_to_port" {
  description = "End port for the egress rule."
  type        = number
  default     = 0
}

variable "egress_protocol" {
  description = "Protocol for the egress rule. \"-1\" allows all protocols."
  type        = string
  default     = "-1"
}

variable "egress_cidr_blocks" {
  description = "CIDR blocks allowed for outbound traffic."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "tags" {
  description = "Tags to apply to the security group."
  type        = map(string)
  default     = {}
}
