variable "identifier" {
  description = "The identifier of the RDS instance."
  type        = string
}

variable "engine" {
  description = "The database engine."
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "The database engine version."
  type        = string
  default     = "16"
}

variable "instance_class" {
  description = "The RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "The name of the initial database."
  type        = string
}

variable "username" {
  description = "The master username."
  type        = string
}

variable "password" {
  description = "The master password. Supply via a secret store or environment variable, never in source."
  type        = string
  sensitive   = true
}

variable "allocated_storage" {
  description = "Allocated storage in gibibytes."
  type        = number
  default     = 20
}

variable "kms_key_id" {
  description = "Optional KMS key ARN for storage encryption. Defaults to the AWS-managed key."
  type        = string
  default     = null
}

variable "db_subnet_group_name" {
  description = "The DB subnet group to launch the instance into."
  type        = string
}

variable "vpc_security_group_ids" {
  description = "List of security group IDs to associate with the instance."
  type        = list(string)
  default     = []
}

variable "backup_retention_period" {
  description = "Backup retention period in days."
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot on destroy."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to the RDS instance."
  type        = map(string)
  default     = {}
}
