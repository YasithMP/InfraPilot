# Azure Bicep templates

A modular Azure Bicep template set mirroring the Terraform `azure@4.70.0` module
coverage. Each module is a single self-contained `.bicep` file under `modules/`
that declares its `param` inputs, `resource` block(s), and `output` values.

## Layout

```
azure/
├── main.bicep            # subscription-scoped root: resource group + vnet + storage example
├── main.bicepparam       # example parameters for main.bicep
├── bicepconfig.json      # linter settings
├── README.md
└── modules/
    ├── resource_group.bicep
    ├── virtual_network.bicep          # vnet + subnet
    ├── network_security_group.bicep   # NSG with a default deny-all-inbound rule
    ├── app_service.bicep              # App Service Plan + Web App
    ├── function_app.bicep             # Consumption plan + Linux Function App
    ├── container_app.bicep            # Managed Environment + Container App
    ├── container_registry.bicep       # Azure Container Registry
    ├── key_vault.bicep                # RBAC-authorized Key Vault
    ├── storage_account.bicep          # TLS1_2, HTTPS-only
    ├── postgresql_flexible_server.bicep # PostgreSQL Flexible Server + database
    ├── user_assigned_identity.bicep
    ├── linux_virtual_machine.bicep    # NIC + Linux VM (SSH key auth)
    └── windows_virtual_machine.bicep  # NIC + Windows VM (password auth)
```

## Prerequisites

- **Azure CLI** 2.50.0 or later: <https://learn.microsoft.com/cli/azure/install-azure-cli>
- **Bicep CLI** (bundled with recent az CLI). Install/upgrade with:

  ```bash
  az bicep install
  az bicep upgrade
  ```

- Authenticate and select a subscription:

  ```bash
  az login
  az account set --subscription "<subscription-id>"
  ```

## Deploy

`main.bicep` uses `targetScope = 'subscription'` because it creates the resource
group itself. Deploy it as a subscription-scoped deployment:

```bash
az deployment sub create \
  --location eastus \
  --template-file main.bicep \
  --parameters main.bicepparam
```

Preview changes first with a what-if run:

```bash
az deployment sub what-if \
  --location eastus \
  --template-file main.bicep \
  --parameters main.bicepparam
```

Override individual parameters on the command line if needed:

```bash
az deployment sub create \
  --location eastus \
  --template-file main.bicep \
  --parameters main.bicepparam storageAccountName=stmyuniqueapp001
```

## Using a single module on its own

The module files are resource-group-scoped (except `resource_group.bicep`, which
is subscription-scoped). To deploy one directly into an existing resource group:

```bash
az deployment group create \
  --resource-group rg-genops-example \
  --template-file modules/storage_account.bicep \
  --parameters storageAccountName=stmyuniqueapp001
```

To compose modules in your own root template, declare them with `module` blocks
and a `scope` (see `main.bicep` for the pattern):

```bicep
module storage 'modules/storage_account.bicep' = {
  name: 'storage'
  scope: az.resourceGroup('rg-genops-example')
  params: {
    storageAccountName: 'stmyuniqueapp001'
  }
}
```

## Parameter conventions

- Every `param` carries an `@description('...')` decorator.
- Resource-group-scoped modules default `location` to `resourceGroup().location`,
  so you only set it explicitly when you want to override the RG region.
- No environment-specific values are hardcoded in modules. Supply real values
  through `main.bicepparam` (or `--parameters`).
- Secrets use the `@secure()` decorator (e.g. the Windows VM `adminPassword` and
  the PostgreSQL `administratorLoginPassword`) and must be provided at deploy
  time, never committed.
- Names that must be globally unique (storage accounts, key vaults, container
  registries) are passed in by the caller; pick unique values.
- Safe defaults are baked in: storage uses `minimumTlsVersion: 'TLS1_2'` and
  `supportsHttpsTrafficOnly: true`, Key Vault uses RBAC authorization
  (`enableRbacAuthorization: true`), the NSG ships a default deny-all-inbound
  rule, the App Service and Function App are HTTPS-only with TLS 1.2 minimum,
  the PostgreSQL Flexible Server disables public network access by default, and
  the container registry admin user is disabled by default.
- Every module outputs at least the resource `name` and `id`.

## Notes on parity with Terraform

- The Terraform `container_app` module took an existing environment ID as input;
  the Bicep `container_app.bicep` creates the **Managed Environment + Container
  App** together, matching the requested "environment + app" coverage.
- `app_service.bicep` exposes a `linux` boolean (default `true`) in place of the
  Terraform `os_type` string, which is the idiomatic Bicep way to switch the plan
  kind and the `reserved` flag.
