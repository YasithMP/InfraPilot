# Version matrix & migration guide

Load this when the user asks to upgrade/migrate tool or provider versions, switch Terraform ↔ OpenTofu, or asks which versions the templates target.

## Pinned versions (what the bundled templates use)

| Stack              | Template dir                        | Tool version        | Provider pin                  |
| ------------------ | ----------------------------------- | ------------------- | ----------------------------- |
| Terraform / Azure  | `iac/terraform/azure@4.70.0/`       | `>= 1.9.0`          | `hashicorp/azurerm = 4.70.0`  |
| Terraform / AWS    | `iac/terraform/aws@5.70.0/`         | `>= 1.9.0`          | `hashicorp/aws = 5.70.0`      |
| Terraform / GCP    | `iac/terraform/google@6.10.0/`      | `>= 1.9.0`          | `hashicorp/google = 6.10.0`   |
| OpenTofu (any)     | reuses Terraform dirs               | `>= 1.8`            | same pins                     |
| Bicep / Azure      | `iac/bicep/azure/`                  | latest Bicep CLI    | per-resource `apiVersion`     |
| Pulumi / Azure     | `iac/pulumi/azure-native@2.0.0/`    | Pulumi CLI ≥ 3.x    | `@pulumi/azure-native` 2.x    |
| Pulumi / AWS       | `iac/pulumi/aws@6.0.0/`             | Pulumi CLI ≥ 3.x    | `@pulumi/aws` 6.x             |
| Pulumi / GCP       | `iac/pulumi/gcp@8.0.0/`             | Pulumi CLI ≥ 3.x    | `@pulumi/gcp` 8.x             |

CI/CD templates pin the tool too (e.g. `terraform_version: 1.9.0` / `tf_version` variable), so bump those together with `versions.tf`.

## The `@version` directory convention

Template dirs are named `<provider>@<provider-major.minor.patch>`. To support a new provider major **without breaking existing consumers**, add a sibling dir (`azure@5.0.0/`) instead of editing the old one in place; old projects keep copying the version they were built against, new projects get the new one. Delete a version dir only when nothing references it.

## Upgrading a provider version (Terraform/OpenTofu)

1. Read the provider's official upgrade guide for the target major (registry.terraform.io → provider → docs → guides). Never bump a major blind.
2. Update the pin in `versions.tf` (`version = "= X.Y.Z"`), then `terraform init -upgrade`.
3. `terraform plan` and diff carefully: a major bump with a clean plan is the goal; any unexplained destroy/replace means renamed arguments or changed defaults, fix before apply.
4. Deprecations to expect on recent majors: azurerm 3→4 renamed `skip_provider_registration` to `resource_provider_registrations` and dropped many legacy resource syntaxes; aws 4→5 removed deprecated `aws_s3_bucket` inline arguments in favor of separate `aws_s3_bucket_*` resources; google 5→6 tightened default label/name validation. For 6.x+ AWS and other newer majors, rely on the official guide (step 1) rather than memory.
5. One environment at a time: dev → test → prod, plan reviewed at each gate.

## Terraform ↔ OpenTofu migration

State formats are compatible at current versions. `tofu init -migrate-state` in each root, then use `tofu` everywhere the docs say `terraform`. CI: swap `hashicorp/setup-terraform` for `opentofu/setup-opentofu` and the binary name; everything else (backend, modules, pins) is unchanged. Migrating back to Terraform is the same in reverse while versions stay compatible; check the OpenTofu docs for divergence past 1.8.

## Pulumi provider majors

Bump the dependency in `package.json` (e.g. `@pulumi/aws` 6.x → next major), `npm install`, `npx tsc --noEmit`. TypeScript surfaces renamed/removed properties at compile time, which is the main migration cost. Then `pulumi preview` per stack and review before `pulumi up`.

## Bicep

No provider version to bump; each resource declares its own REST `apiVersion`. To migrate a resource, change its `apiVersion` to a newer one from `az provider show --namespace <ns> --query "resourceTypes[?resourceType=='<type>'].apiVersions"` and run `az deployment ... what-if`. Bicep CLI itself: keep current via `az bicep upgrade`; it is backward-compatible.

## Cross-tool migration (bigger moves)

Terraform → Pulumi / Bicep → Terraform etc. are rewrites plus **state adoption**, not file conversions. Rule: never recreate live resources; import them (`terraform import` / `pulumi import` / Bicep `existing` references) module by module, verify an empty plan/preview after each batch, then delete the old tool's state. Offer this as a staged plan, not a one-shot change.
