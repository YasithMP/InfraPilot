@description('The name of the Linux virtual machine.')
param virtualMachineName string

@description('The name of the network interface for the VM.')
param networkInterfaceName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('The subnet resource ID used by the VM network interface.')
param subnetId string

@description('The size of the Linux virtual machine.')
param vmSize string = 'Standard_B2s'

@description('The admin username for the Linux VM.')
param adminUsername string

@description('The SSH public key for admin access.')
param adminSshPublicKey string

@description('The storage account type for the OS disk.')
param osDiskStorageAccountType string = 'Standard_LRS'

@description('Image publisher for the Linux VM.')
param imagePublisher string = 'Canonical'

@description('Image offer for the Linux VM.')
param imageOffer string = '0001-com-ubuntu-server-jammy'

@description('Image SKU for the Linux VM.')
param imageSku string = '22_04-lts'

@description('Image version for the Linux VM.')
param imageVersion string = 'latest'

@description('Tags to apply to the VM resources.')
param tags object = {}

resource networkInterface 'Microsoft.Network/networkInterfaces@2024-05-01' = {
  name: networkInterfaceName
  location: location
  tags: tags
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: subnetId
          }
          privateIPAllocationMethod: 'Dynamic'
        }
      }
    ]
  }
}

resource virtualMachine 'Microsoft.Compute/virtualMachines@2024-07-01' = {
  name: virtualMachineName
  location: location
  tags: tags
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: virtualMachineName
      adminUsername: adminUsername
      linuxConfiguration: {
        disablePasswordAuthentication: true
        ssh: {
          publicKeys: [
            {
              path: '/home/${adminUsername}/.ssh/authorized_keys'
              keyData: adminSshPublicKey
            }
          ]
        }
      }
    }
    storageProfile: {
      osDisk: {
        createOption: 'FromImage'
        caching: 'ReadWrite'
        managedDisk: {
          storageAccountType: osDiskStorageAccountType
        }
      }
      imageReference: {
        publisher: imagePublisher
        offer: imageOffer
        sku: imageSku
        version: imageVersion
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: networkInterface.id
        }
      ]
    }
  }
}

@description('The name of the Linux virtual machine.')
output name string = virtualMachine.name

@description('The resource ID of the Linux virtual machine.')
output id string = virtualMachine.id

@description('The resource ID of the network interface.')
output networkInterfaceId string = networkInterface.id

@description('The private IP address of the network interface.')
output privateIpAddress string = networkInterface.properties.ipConfigurations[0].properties.privateIPAddress
