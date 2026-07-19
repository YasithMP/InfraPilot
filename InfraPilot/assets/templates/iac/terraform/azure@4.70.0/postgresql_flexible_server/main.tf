# PostgreSQL Flexible Server with an initial database.
# Set delegated_subnet_id and private_dns_zone_id together for private access.
resource "azurerm_postgresql_flexible_server" "main" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location
  version             = var.postgresql_version

  administrator_login    = var.administrator_login
  administrator_password = var.administrator_password

  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  backup_retention_days = var.backup_retention_days

  public_network_access_enabled = var.public_network_access_enabled
  delegated_subnet_id           = var.delegated_subnet_id
  private_dns_zone_id           = var.private_dns_zone_id

  tags = var.tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
