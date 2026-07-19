output "registry_id" {
  value = azurerm_container_registry.main.id
}

output "registry_name" {
  value = azurerm_container_registry.main.name
}

output "login_server" {
  value = azurerm_container_registry.main.login_server
}
