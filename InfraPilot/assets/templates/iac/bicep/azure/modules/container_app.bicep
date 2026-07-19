@description('The name of the Container App.')
param containerAppName string

@description('The name of the Container App Environment.')
param environmentName string

@description('The Azure location. Defaults to the resource group location.')
param location string = resourceGroup().location

@description('Revision mode for the container app.')
@allowed([
  'Single'
  'Multiple'
])
param revisionMode string = 'Single'

@description('Whether ingress is externally accessible.')
param ingressExternalEnabled bool = true

@description('Port exposed by the container.')
param targetPort int = 80

@description('The container name in the app template.')
param containerName string

@description('The container image to run.')
param containerImage string

@description('CPU allocation for the container (cores).')
param containerCpu string = '0.5'

@description('Memory allocation for the container (e.g. 1Gi).')
param containerMemory string = '1Gi'

@description('Minimum number of container app replicas.')
param minReplicas int = 1

@description('Maximum number of container app replicas.')
param maxReplicas int = 2

@description('Tags to apply to the container app resources.')
param tags object = {}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {}
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      activeRevisionsMode: revisionMode
      ingress: {
        external: ingressExternalEnabled
        targetPort: targetPort
        transport: 'auto'
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
    }
    template: {
      containers: [
        {
          name: containerName
          image: containerImage
          resources: {
            cpu: json(containerCpu)
            memory: containerMemory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

@description('The name of the container app.')
output name string = containerApp.name

@description('The resource ID of the container app.')
output id string = containerApp.id

@description('The resource ID of the container app environment.')
output environmentId string = environment.id

@description('The latest revision FQDN of the container app.')
output latestRevisionFqdn string = containerApp.properties.latestRevisionFqdn
