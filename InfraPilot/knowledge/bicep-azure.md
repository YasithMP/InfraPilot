# Azure + Bicep: copy & wire-up

Detailed procedure for the bundled `assets/templates/iac/bicep/azure/` modules and `assets/templates/cicd/github/bicep/azure/` pipeline. Load this only when the request targets Bicep on Azure.

## Layout to produce

Create everything under `<working-dir>/infrastructure/bicep/`:

```
infrastructure/bicep/
├── modules/<module>.bicep   # copied from assets/templates, one FILE per resource
├── main.bicep               # copied/edited - targetScope = 'subscription', orchestrates modules
├── main.bicepparam          # copied/edited - parameter values (env-specific live here)
├── bicepconfig.json         # copied - linter rules
└── README.md                # create
```

Unlike Terraform, each module is a **single `.bicep` file** under `modules/` (not a directory). Available modules in `bicep/azure/modules/`: `resource_group`, `virtual_network`, `network_security_group`, `storage_account`, `key_vault`, `user_assigned_identity`, `app_service`, `container_app`, `linux_virtual_machine`, `windows_virtual_machine`, `postgresql_flexible_server`, `function_app`, `container_registry`.

## Steps

1. Copy `bicepconfig.json` to the bicep root unchanged. Copy `main.bicep` and `main.bicepparam` as the starting point.
2. For each resource the request needs, copy `assets/templates/iac/bicep/azure/modules/<module>.bicep` → `infrastructure/bicep/modules/<module>.bicep`. Always include `resource_group`; include `virtual_network` when networking is involved.
3. Edit `main.bicep` (keep `targetScope = 'subscription'`):
   - Declare a `module resourceGroup 'modules/resource_group.bicep'` block first (subscription-scoped).
   - Declare each subsequent module with `scope: az.resourceGroup(resourceGroupName)` and a `dependsOn: [ resourceGroup ]` so it lands inside the new RG.
   - Wire outputs between modules where one needs another's id, e.g. pass `networkSecurityGroupId: nsg.outputs.id` into the `virtual_network` module.
   - Surface useful `output` values (resource ids, names) at the bottom.
4. Edit `main.bicepparam` (it begins with `using 'main.bicep'`). Put **all environment-specific values here**: resource group name, location, vnet/subnet names, globally-unique names (storage accounts: lowercase, 3-24 alphanumeric), and a `tags` object. The modules hardcode nothing.
5. Lint locally with `az bicep build --file main.bicep` (also what CI does); fix any analyzer warnings from `bicepconfig.json`.

## Deploying

Bicep deploys at subscription scope (the RG is created by the template, so there is no RG-scoped deployment to target):

```bash
# Preview changes without applying:
az deployment sub what-if \
  --location <region> \
  --template-file main.bicep \
  --parameters main.bicepparam

# Apply:
az deployment sub create \
  --location <region> \
  --template-file main.bicep \
  --parameters main.bicepparam
```

Use one `.bicepparam` file per environment (e.g. `main.dev.bicepparam`, `main.prod.bicepparam`) and select it with `--parameters` to separate dev/test/prod. There is no remote-state concept: Azure Resource Manager is the source of truth, so no backend setup is required.

## apiVersion pinning

Every resource in the modules pins an explicit `apiVersion` (e.g. `Microsoft.Resources/resourceGroups@2024-03-01`, `Microsoft.Network/virtualNetworks@2024-05-01`). Keep these pinned; do not float them. The `use-recent-api-versions` linter rule is intentionally set to `off` in `bicepconfig.json` so pinned versions don't generate warnings; bump them deliberately when you need newer resource features.

## Auth / secret conventions

- Locally, authenticate with **`az login`** before deploying; the CLI's context supplies the subscription and credentials. No secrets live in the templates.
- In CI, auth is **OIDC** via `azure/login@v2` with federated credentials; three repo/environment secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (no client secret needed). The workflow needs `permissions: id-token: write`.

## CI/CD

- **GitHub Actions:** copy `assets/templates/cicd/github/bicep/azure/` → `.github/workflows/` keeping the file names (`_bicep-deploy.yml` is the callable workflow (the `_` prefix marks it internal per enterprise convention); `bicep-validate.yml`; `bicep-{dev,test,prod}.yml` callers). Validate triggers on PRs touching `infrastructure/bicep/**`, logs in via OIDC, runs `az bicep build` (build + lint), and warns on leftover `TODO` comments; the callable workflow runs what-if then `az deployment sub create` gated by a GitHub Environment for test/prod.
- **Azure DevOps:** copy `assets/templates/cicd/devops/bicep/azure/`: `_bicep-deploy.yml` stage template (build + what-if + Environment-gated deploy) plus thin `bicep-{dev,test,prod}.yml` callers. Set `azureServiceConnection`; configure Environment approvals for test/production.
- **Jenkins:** copy `assets/templates/cicd/jenkins/bicep/azure/Jenkinsfile`: declarative pipeline with an `ENVIRONMENT` choice parameter (`az bicep build` → Checkov → what-if → gated `az deployment sub create`); create the `azure-sp-client-id` / `azure-sp-client-secret` / `azure-subscription-id` / `azure-tenant-id` Jenkins credentials.
