variable "name" {
  description = "The name of the EC2 instance."
  type        = string
}

variable "ami" {
  description = "The AMI ID to launch the instance from."
  type        = string
}

variable "instance_type" {
  description = "The EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "subnet_id" {
  description = "The subnet ID to launch the instance into."
  type        = string
}

variable "vpc_security_group_ids" {
  description = "List of security group IDs to associate with the instance."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to the EC2 instance."
  type        = map(string)
  default     = {}
}
