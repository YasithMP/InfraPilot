output "windows_virtual_machine_id" {
  value = azurerm_windows_virtual_machine.main.id
}

output "network_interface_id" {
  value = azurerm_network_interface.main.id
}

output "private_ip_address" {
  value = azurerm_network_interface.main.private_ip_address
}