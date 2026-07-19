# Backend configuration for remote state storage
#
# IMPORTANT: You must create the backend storage resources BEFORE enabling this.
# Use a bootstrap script or manually create:
#   - Resource Group (e.g. rg-terraform-state)
#   - Storage Account (e.g. sttfstate<random>)
#   - Container (e.g. tfstate)
#
# Uncomment and fill in the values below after the backend storage is ready.
# Each env dir (environments/dev|test|prod) sets its own state key/prefix - one backend, isolated states.

# terraform {
#   backend "azurerm" {
#     resource_group_name  = "" # TODO: Fill in backend resource group name
#     storage_account_name = "" # TODO: Fill in backend storage account name
#     container_name       = "" # TODO: Fill in state container name
#     key                  = "<env>.terraform.tfstate" # unique per env dir
#   }
# }
