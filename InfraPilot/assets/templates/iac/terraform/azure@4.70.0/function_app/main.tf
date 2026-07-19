resource "azurerm_service_plan" "main" {
  name                = var.service_plan_name
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.sku_name

  tags = var.tags
}

# Linux Function App backed by an existing storage account.
# Set storage_uses_managed_identity = true instead of passing an access key.
resource "azurerm_linux_function_app" "main" {
  name                = var.function_app_name
  location            = var.location
  resource_group_name = var.resource_group_name
  service_plan_id     = azurerm_service_plan.main.id

  storage_account_name          = var.storage_account_name
  storage_account_access_key    = var.storage_account_access_key
  storage_uses_managed_identity = var.storage_uses_managed_identity ? true : null

  https_only = true

  site_config {
    minimum_tls_version = "1.2"

    application_stack {
      node_version   = var.runtime == "node" ? var.runtime_version : null
      python_version = var.runtime == "python" ? var.runtime_version : null
      dotnet_version = var.runtime == "dotnet" ? var.runtime_version : null
      java_version   = var.runtime == "java" ? var.runtime_version : null
    }
  }

  identity {
    type = var.identity_type
  }

  tags = var.tags
}
