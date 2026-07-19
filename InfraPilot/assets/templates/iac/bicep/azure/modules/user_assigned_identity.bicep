@description('The name of the user-assigned managed identity.')
param identityName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Tags to apply to the managed identity.')
param tags object = {}

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
  tags: tags
}

@description('The name of the user-assigned managed identity.')
output name string = identity.name

@description('The resource ID of the user-assigned managed identity.')
output id string = identity.id

@description('The principal (object) ID of the managed identity.')
output principalId string = identity.properties.principalId

@description('The client ID of the managed identity.')
output clientId string = identity.properties.clientId
