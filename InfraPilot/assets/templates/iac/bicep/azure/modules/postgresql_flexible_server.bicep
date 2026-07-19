@description('The name of the PostgreSQL Flexible Server.')
param serverName string

@description('The name of the database to create on the server.')
param databaseName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The administrator login name for the server.')
param administratorLogin string

@description('The administrator login password for the server.')
@secure()
param administratorLoginPassword string

@description('The major version of PostgreSQL.')
param version string = '16'

@description('The SKU name for the server, e.g. Standard_B1ms.')
param skuName string = 'Standard_B1ms'

@description('The SKU tier for the server.')
@allowed([
  'Burstable'
  'GeneralPurpose'
  'MemoryOptimized'
])
param skuTier string = 'Burstable'

@description('Storage size in GB.')
param storageSizeGB int = 32

@description('Backup retention days.')
@minValue(7)
@maxValue(35)
param backupRetentionDays int = 7

@description('Enable geo-redundant backups.')
param geoRedundantBackup bool = false

@description('Whether public network access is enabled.')
param publicNetworkAccessEnabled bool = false

@description('Tags to apply to the PostgreSQL Flexible Server.')
param tags object = {}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    version: version
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: geoRedundantBackup ? 'Enabled' : 'Disabled'
    }
    network: {
      publicNetworkAccess: publicNetworkAccessEnabled ? 'Enabled' : 'Disabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

@description('The name of the PostgreSQL Flexible Server.')
output name string = postgresServer.name

@description('The resource ID of the PostgreSQL Flexible Server.')
output id string = postgresServer.id

@description('The fully qualified domain name of the PostgreSQL Flexible Server.')
output fqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('The name of the database.')
output databaseName string = database.name
