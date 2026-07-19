output "name" {
  value = azurerm_virtual_network.main.name
}

output "virtual_network_id" {
  value = azurerm_virtual_network.main.id
}

output "subnet_id" {
  value = azurerm_subnet.main.id
}
