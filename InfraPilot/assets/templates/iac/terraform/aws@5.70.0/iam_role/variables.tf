variable "role_name" {
  description = "The name of the IAM role."
  type        = string
}

variable "assume_role_policy" {
  description = "The trust policy (JSON) that grants an entity permission to assume the role."
  type        = string
  default     = <<-EOT
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }
  EOT
}

variable "tags" {
  description = "Tags to apply to the IAM role."
  type        = map(string)
  default     = {}
}
