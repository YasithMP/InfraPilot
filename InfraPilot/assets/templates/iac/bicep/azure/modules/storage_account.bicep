@description('Globally unique storage account name (3-24 lowercase alphanumeric characters).')
@minLength(3)
@maxLength(24)
param storageAccountName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Storage account SKU (tier + replication), e.g. Standard_LRS.')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
  'Standard_ZRS'
  'Premium_LRS'
])
param skuName string = 'Standard_LRS'

@description('The kind of storage account.')
param kind string = 'StorageV2'

@description('Access tier for the storage account.')
@allowed([
  'Hot'
  'Cool'
])
param accessTier string = 'Hot'

@description('Tags to apply to the storage account.')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: kind
  properties: {
    accessTier: accessTier
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
  }
}

@description('The name of the storage account.')
output name string = storageAccount.name

@description('The resource ID of the storage account.')
output id string = storageAccount.id

@description('The primary blob endpoint of the storage account.')
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
