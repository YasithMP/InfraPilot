@description('The name of the virtual network.')
param vnetName string

@description('The name of the subnet.')
param subnetName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Address space for the virtual network.')
param addressSpace array = [
  '10.10.0.0/16'
]

@description('Address prefixes for the subnet.')
param subnetPrefixes array = [
  '10.10.1.0/24'
]

@description('Optional network security group resource ID to associate with the subnet.')
param networkSecurityGroupId string = ''

@description('Tags to apply to the virtual network.')
param tags object = {}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: addressSpace
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefixes: subnetPrefixes
          networkSecurityGroup: empty(networkSecurityGroupId) ? null : {
            id: networkSecurityGroupId
          }
        }
      }
    ]
  }
}

@description('The name of the virtual network.')
output name string = virtualNetwork.name

@description('The resource ID of the virtual network.')
output id string = virtualNetwork.id

@description('The resource ID of the subnet.')
output subnetId string = virtualNetwork.properties.subnets[0].id
