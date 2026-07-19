@description('The name of the Function App.')
param functionAppName string

@description('The name of the App Service Plan hosting the Function App.')
param servicePlanName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The SKU name for the App Service Plan. Y1 is the Linux consumption plan.')
param skuName string = 'Y1'

@description('The name of an existing storage account used by the Functions runtime.')
param storageAccountName string

@description('The Functions runtime stack.')
@allowed([
  'dotnet-isolated'
  'node'
  'python'
  'java'
  'powershell'
  'custom'
])
param runtime string = 'node'

@description('The version of the Functions runtime stack, e.g. 20 for Node.js.')
param runtimeVersion string = '20'

@description('Tags to apply to the Function App resources.')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource servicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: servicePlanName
  location: location
  tags: tags
  kind: 'functionapp'
  sku: {
    name: skuName
  }
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2024-04-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: servicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: '${toUpper(runtime)}|${runtimeVersion}'
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: runtime
        }
      ]
    }
  }
}

@description('The name of the Function App.')
output name string = functionApp.name

@description('The resource ID of the Function App.')
output id string = functionApp.id

@description('The default hostname of the Function App.')
output defaultHostname string = functionApp.properties.defaultHostName

@description('The principal ID of the system-assigned managed identity.')
output principalId string = functionApp.identity.principalId

@description('The resource ID of the App Service Plan.')
output servicePlanId string = servicePlan.id
