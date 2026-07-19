variable "server_name" {
  description = "The name of the PostgreSQL Flexible Server."
  type        = string
}

variable "resource_group_name" {
  description = "The resource group for the PostgreSQL Flexible Server."
  type        = string
}

variable "location" {
  description = "The Azure location."
  type        = string
}

variable "database_name" {
  description = "The name of the initial database."
  type        = string
}

variable "postgresql_version" {
  description = "The major PostgreSQL version."
  type        = string
  default     = "16"
}

variable "administrator_login" {
  description = "The administrator login name."
  type        = string
}

variable "administrator_password" {
  description = "The administrator password. Supply via a secret store or environment variable, never in source."
  type        = string
  sensitive   = true
}

variable "sku_name" {
  description = "The SKU name for the server."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "storage_mb" {
  description = "Storage size in megabytes."
  type        = number
  default     = 32768
}

variable "backup_retention_days" {
  description = "Backup retention days."
  type        = number
  default     = 7
}

variable "public_network_access_enabled" {
  description = "Whether public network access is enabled."
  type        = bool
  default     = false
}

variable "delegated_subnet_id" {
  description = "The delegated subnet ID for private access."
  type        = string
  default     = null
}

variable "private_dns_zone_id" {
  description = "The private DNS zone ID for private access."
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to the PostgreSQL Flexible Server."
  type        = map(string)
  default     = {}
}
