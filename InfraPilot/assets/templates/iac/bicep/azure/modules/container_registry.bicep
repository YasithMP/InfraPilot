@description('Globally unique container registry name (5-50 alphanumeric characters).')
@minLength(5)
@maxLength(50)
param registryName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The container registry SKU.')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param skuName string = 'Basic'

@description('Enable the registry admin user.')
param adminUserEnabled bool = false

@description('Whether public network access is enabled.')
param publicNetworkAccessEnabled bool = true

@description('Tags to apply to the container registry.')
param tags object = {}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: publicNetworkAccessEnabled ? 'Enabled' : 'Disabled'
  }
}

@description('The name of the container registry.')
output name string = containerRegistry.name

@description('The resource ID of the container registry.')
output id string = containerRegistry.id

@description('The login server URL of the container registry.')
output loginServer string = containerRegistry.properties.loginServer
