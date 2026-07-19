output "app_service_id" {
  value = azurerm_linux_web_app.main.id
}

output "default_hostname" {
  value = azurerm_linux_web_app.main.default_hostname
}

output "service_plan_id" {
  value = azurerm_service_plan.main.id
}