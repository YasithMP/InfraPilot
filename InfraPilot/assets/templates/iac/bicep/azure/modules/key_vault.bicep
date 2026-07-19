@description('The name of the Key Vault.')
param keyVaultName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The Azure AD tenant ID used by the Key Vault.')
param tenantId string = subscription().tenantId

@description('The Key Vault SKU name.')
@allowed([
  'standard'
  'premium'
])
param skuName string = 'standard'

@description('Soft delete retention days.')
@minValue(7)
@maxValue(90)
param softDeleteRetentionDays int = 90

@description('Enable purge protection.')
param purgeProtectionEnabled bool = true

@description('Tags to apply to the Key Vault.')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: tenantId
    sku: {
      family: 'A'
      name: skuName
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: softDeleteRetentionDays
    enablePurgeProtection: purgeProtectionEnabled
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

@description('The name of the Key Vault.')
output name string = keyVault.name

@description('The resource ID of the Key Vault.')
output id string = keyVault.id

@description('The URI of the Key Vault.')
output vaultUri string = keyVault.properties.vaultUri
