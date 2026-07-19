variable "instance_name" {
  description = "The name of the Cloud SQL instance."
  type        = string
}

variable "region" {
  description = "The region for the Cloud SQL instance."
  type        = string
}

variable "database_version" {
  description = "The database engine version."
  type        = string
  default     = "POSTGRES_16"
}

variable "tier" {
  description = "The machine tier for the instance."
  type        = string
  default     = "db-f1-micro"
}

variable "deletion_protection" {
  description = "Whether deletion protection is enabled."
  type        = bool
  default     = true
}

variable "public_ip_enabled" {
  description = "Whether the instance is assigned a public IPv4 address."
  type        = bool
  default     = false
}

variable "private_network" {
  description = "The self link of the VPC network for private IP connectivity."
  type        = string
  default     = null
}

variable "backup_enabled" {
  description = "Whether automated backups are enabled."
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Start time for automated backups (HH:MM, UTC)."
  type        = string
  default     = "03:00"
}

variable "database_name" {
  description = "The name of the initial database."
  type        = string
}

variable "user_name" {
  description = "The name of the initial database user."
  type        = string
}

variable "user_password" {
  description = "The password for the initial database user. Supply via a secret store or environment variable, never in source."
  type        = string
  sensitive   = true
}

variable "labels" {
  description = "A map of labels to apply to the instance."
  type        = map(string)
  default     = {}
}
