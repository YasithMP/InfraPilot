output "container_app_id" {
  value = azurerm_container_app.main.id
}

output "latest_revision_name" {
  value = azurerm_container_app.main.latest_revision_name
}

output "latest_revision_fqdn" {
  value = azurerm_container_app.main.latest_revision_fqdn
}