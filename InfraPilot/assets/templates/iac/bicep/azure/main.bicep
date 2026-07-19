targetScope = 'subscription'

// Root deployment: creates a resource group, then a virtual network and a
// storage account inside it. This wires a small, realistic example showing how
// to call the per-module .bicep files with `module` declarations.
//
// Deploy with:
//   az deployment sub create \
//     --location <region> \
//     --template-file main.bicep \
//     --parameters main.bicepparam

@description('The name of the resource group to create.')
param resourceGroupName string

@description('The Azure location for all resources.')
param location string

@description('The name of the virtual network.')
param vnetName string

@description('The name of the subnet.')
param subnetName string

@description('Globally unique storage account name (3-24 lowercase alphanumeric characters).')
param storageAccountName string

@description('Tags applied to every resource.')
param tags object = {}

// Resource group (subscription-scoped module).
module resourceGroup 'modules/resource_group.bicep' = {
  name: 'resourceGroup'
  params: {
    resourceGroupName: resourceGroupName
    location: location
    tags: tags
  }
}

// Virtual network + subnet, scoped to the new resource group.
module virtualNetwork 'modules/virtual_network.bicep' = {
  name: 'virtualNetwork'
  scope: az.resourceGroup(resourceGroupName)
  params: {
    vnetName: vnetName
    subnetName: subnetName
    location: location
    tags: tags
  }
  dependsOn: [
    resourceGroup
  ]
}

// Storage account, scoped to the new resource group.
module storageAccount 'modules/storage_account.bicep' = {
  name: 'storageAccount'
  scope: az.resourceGroup(resourceGroupName)
  params: {
    storageAccountName: storageAccountName
    location: location
    tags: tags
  }
  dependsOn: [
    resourceGroup
  ]
}

@description('The name of the created resource group.')
output resourceGroupName string = resourceGroup.outputs.name

@description('The resource ID of the virtual network.')
output virtualNetworkId string = virtualNetwork.outputs.id

@description('The resource ID of the subnet.')
output subnetId string = virtualNetwork.outputs.subnetId

@description('The resource ID of the storage account.')
output storageAccountId string = storageAccount.outputs.id
