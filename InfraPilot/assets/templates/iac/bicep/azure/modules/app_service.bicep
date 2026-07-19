@description('The name of the App Service (web app).')
param appServiceName string

@description('The name of the App Service Plan.')
param servicePlanName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The SKU name for the App Service Plan.')
param skuName string = 'B1'

@description('Whether the App Service Plan hosts Linux workloads. When false, a Windows plan is created.')
param linux bool = true

@description('Whether Always On is enabled for the App Service.')
param alwaysOn bool = true

@description('Tags to apply to the App Service resources.')
param tags object = {}

resource servicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: servicePlanName
  location: location
  tags: tags
  kind: linux ? 'linux' : 'app'
  sku: {
    name: skuName
  }
  properties: {
    reserved: linux
  }
}

resource appService 'Microsoft.Web/sites@2024-04-01' = {
  name: appServiceName
  location: location
  tags: tags
  properties: {
    serverFarmId: servicePlan.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: alwaysOn
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
    }
  }
}

@description('The name of the App Service.')
output name string = appService.name

@description('The resource ID of the App Service.')
output id string = appService.id

@description('The default hostname of the App Service.')
output defaultHostname string = appService.properties.defaultHostName

@description('The resource ID of the App Service Plan.')
output servicePlanId string = servicePlan.id
