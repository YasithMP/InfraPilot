# Azure + Terraform: copy & wire-up

Detailed procedure for the bundled `assets/templates/iac/terraform/azure@4.70.0/` modules and `assets/templates/cicd/*/terraform/azure/` pipelines. Load this only when the request targets Terraform on Azure.

## Layout to produce

Create everything under `<working-dir>/infrastructure/terraform/`:

```
infrastructure/terraform/
├── modules/<module>/      # copied from assets/templates, shared by all envs
├── environments/
│   ├── dev/               # one Terraform root per environment
│   │   ├── provider.tf    # copied
│   │   ├── versions.tf    # copied (azurerm pinned 4.70.0)
│   │   ├── backend.tf     # copied - FILL IN backend storage, per-env state key
│   │   ├── variables.tf   # create - ARM auth vars only
│   │   ├── locals.tf      # create - env name, naming, resource group names, tags, env-specific SKUs
│   │   ├── main.tf        # create - exactly the modules THIS env needs
│   │   └── outputs.tf     # create
│   ├── test/              # same file set
│   └── prod/              # same file set
└── README.md              # create
```

Each environment is its own Terraform root under `environments/<env>`. An environment's `main.tf` declares exactly the resources that environment runs. An env without a resource simply doesn't call its module. No `count` gating, no `var.environment` ternaries, no workspaces. Module sources are `../../modules/<module>`.

## Steps

1. For each resource the request needs, copy `assets/templates/iac/terraform/azure@4.70.0/<module>/` → `infrastructure/terraform/modules/<module>/` (once, shared by all envs). Always include `resource_group`; include `virtual_network` if networking is involved.
2. For each environment (dev, test, prod), create `infrastructure/terraform/environments/<env>/` and copy `provider.tf`, `versions.tf`, `backend.tf` from `assets/templates/iac/terraform/azure@4.70.0/` into it.
3. Write each env's `main.tf` with ONLY the modules that environment needs (`source = "../../modules/<module>"`), resource groups first, then VNets, then resources, passing `resource_group_name`, `location`, `tags`. Environments differ by construction: dev may omit a resource entirely while prod includes it with a bigger SKU. Size/setting differences live in that env's `locals.tf`.
4. Write each env's `locals.tf` with `environment = "<env>"`, `resource_group_names`, `vnet_names`, `common_tags`, derived from project + environment. All naming and env-specific SKUs live here.
5. Write each env's `variables.tf` with ONLY: `arm_client_id`, `arm_client_secret`, `arm_tenant_id`, `arm_subscription_id`. No `environment` variable; the env is fixed by the directory.
6. Fill each env's `backend.tf` placeholders (storage account, container, per-env key like `dev.terraform.tfstate`) or mark them clearly for the user.

## Secret / variable conventions

- Only these flow as `TF_VAR` pipeline secrets: `arm_client_id`, `arm_client_secret`, `arm_tenant_id`, `arm_subscription_id`.
- Everything else (names, locations, tags) comes from `locals.tf`. Never add more `TF_VAR`.
- GitHub secrets / Azure DevOps service connection supply the ARM credentials.

## CI/CD

- **GitHub Actions:** copy `assets/templates/cicd/github/terraform/azure/` → `.github/workflows/` keeping the file names (`_terraform-deploy.yml` is the callable workflow (the `_` prefix marks it internal per enterprise convention); `terraform-validate.yml`; `terraform-{dev,test,prod}.yml` callers). Validate + plan on PR (plan posted as comment); apply on approval per environment.
- **Azure DevOps:** copy `assets/templates/cicd/devops/terraform/azure/`: `_terraform-deploy.yml` stage template (validate + Checkov + plan + Environment-gated apply) plus thin `terraform-{dev,test,prod}.yml` callers → `azure-pipelines-{dev,test,prod}.yml` (keep `_terraform-deploy.yml` next to them). Set `azureServiceConnection` and backend variables; configure Environment approvals for test/production.
- **Jenkins:** copy `assets/templates/cicd/jenkins/terraform/azure/Jenkinsfile`: declarative pipeline with an `ENVIRONMENT` choice parameter (validate → Checkov → plan → gated apply); create the `azure-sp-client-id` / `azure-sp-client-secret` / `azure-subscription-id` / `azure-tenant-id` Jenkins credentials.
