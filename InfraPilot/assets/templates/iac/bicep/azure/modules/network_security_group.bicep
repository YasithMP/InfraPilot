@description('The name of the network security group.')
param nsgName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Security rules to apply to the network security group. A sane default denies all inbound traffic that is not explicitly allowed by a higher-priority rule.')
param securityRules array = [
  {
    name: 'DenyAllInbound'
    properties: {
      priority: 4096
      direction: 'Inbound'
      access: 'Deny'
      protocol: '*'
      sourcePortRange: '*'
      destinationPortRange: '*'
      sourceAddressPrefix: '*'
      destinationAddressPrefix: '*'
    }
  }
]

@description('Tags to apply to the network security group.')
param tags object = {}

resource networkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: nsgName
  location: location
  tags: tags
  properties: {
    securityRules: securityRules
  }
}

@description('The name of the network security group.')
output name string = networkSecurityGroup.name

@description('The resource ID of the network security group.')
output id string = networkSecurityGroup.id
