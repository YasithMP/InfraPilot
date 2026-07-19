using 'main.bicep'

// Example parameter values for main.bicep. Replace with your own.
// No environment-specific values are hardcoded in the modules; set them here.

param resourceGroupName = 'rg-genops-example'
param location = 'eastus'
param vnetName = 'vnet-genops-example'
param subnetName = 'snet-app'
// Storage account names must be globally unique, lowercase, 3-24 alphanumeric.
param storageAccountName = 'stgenopsexample001'
param tags = {
  environment: 'example'
  managedBy: 'genops'
}
