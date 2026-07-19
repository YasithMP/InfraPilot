# genops-azure (Pulumi · TypeScript)

A Pulumi component set for Azure built on [`@pulumi/azure-native`](https://www.pulumi.com/registry/packages/azure-native/).
It mirrors the GenOps Azure Terraform module coverage as reusable
`pulumi.ComponentResource` classes.

## Components

Each file under `components/` exports a typed component class:

| Component | File | Azure resources |
| --- | --- | --- |
| `ResourceGroup` | `components/resourceGroup.ts` | Resource Group |
| `VirtualNetwork` | `components/virtualNetwork.ts` | Virtual Network + Subnet |
| `NetworkSecurityGroup` | `components/networkSecurityGroup.ts` | Network Security Group |
| `AppService` | `components/appService.ts` | App Service Plan + Linux Web App |
| `ContainerApp` | `components/containerApp.ts` | Container App |
| `KeyVault` | `components/keyVault.ts` | Key Vault (RBAC) |
| `StorageAccount` | `components/storageAccount.ts` | Storage Account |
| `UserAssignedIdentity` | `components/userAssignedIdentity.ts` | User-Assigned Managed Identity |
| `LinuxVirtualMachine` | `components/linuxVirtualMachine.ts` | Network Interface + Linux VM |
| `WindowsVirtualMachine` | `components/windowsVirtualMachine.ts` | Network Interface + Windows VM |
| `PostgresqlFlexibleServer` | `components/postgresqlFlexibleServer.ts` | PostgreSQL Flexible Server + Database |
| `FunctionApp` | `components/functionApp.ts` | Consumption Plan + Linux Function App |
| `ContainerRegistry` | `components/containerRegistry.ts` | Container Registry (ACR) |

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/install/) (`pulumi version`)
- [Node.js](https://nodejs.org/) 18+ and npm
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) authenticated:
  ```bash
  az login
  az account set --subscription "<subscription-id>"
  ```

## Setup

```bash
npm install
pulumi stack init dev          # or select an existing stack
pulumi config set azure-native:location eastus2
```

## Deploy

```bash
pulumi preview                 # review the plan
pulumi up                      # create / update resources
pulumi destroy                 # tear everything down
```

The default program (`index.ts`) wires a resource group, a virtual network, and
a storage account as a worked example.

## Using the components

Import the classes you need and instantiate them inside your Pulumi program.
Outputs are exposed as public readonly fields (e.g. `id`, `name`).

```ts
import { ResourceGroup } from "./components/resourceGroup";
import { KeyVault } from "./components/keyVault";

const rg = new ResourceGroup("app-rg", {
  resourceGroupName: "app-rg",
  location: "eastus2",
});

const vault = new KeyVault("app-kv", {
  keyVaultName: "app-kv-01",
  resourceGroupName: rg.name,
  location: rg.location,
  tenantId: "<tenant-id>",   // pass via config, do not hardcode in real code
});

export const vaultUri = vault.vaultUri;
```

### Secrets

Never hardcode secrets. Pass sensitive values (e.g. the Windows VM admin
password) through Pulumi config secrets:

```bash
pulumi config set --secret vmAdminPassword '<password>'
```

```ts
const cfg = new pulumi.Config();
new WindowsVirtualMachine("win-vm", {
  // ...
  adminPassword: cfg.requireSecret("vmAdminPassword"),
});
```

## Conventions & safe defaults

- Uses `@pulumi/azure-native` (not the classic `@pulumi/azure`).
- Storage accounts: `minimumTlsVersion: TLS1_2`, HTTPS-only, no public blob access.
- Key Vault: RBAC authorization, soft delete + purge protection on by default.
- Linux VMs: SSH key auth only (password auth disabled).
- No environment-specific values are hardcoded; everything flows through Args / stack config.
```
