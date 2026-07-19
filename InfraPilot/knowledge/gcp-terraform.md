# GCP + Terraform: copy & wire-up

Detailed procedure for the bundled `assets/templates/iac/terraform/google@6.10.0/` modules and `assets/templates/cicd/github/terraform/gcp/` pipelines. Load this only when the request targets Terraform on Google Cloud.

## Layout to produce

Create everything under `<working-dir>/infrastructure/terraform/`:

```
infrastructure/terraform/
├── modules/<module>/      # copied from assets/templates, shared by all envs
├── environments/
│   ├── dev/               # one Terraform root per environment
│   │   ├── provider.tf    # copied (project/region from env, no hardcoded values)
│   │   ├── versions.tf    # copied (google pinned 6.10.0)
│   │   ├── backend.tf     # copied - FILL IN GCS bucket, per-env prefix
│   │   ├── variables.tf   # create - project/region only
│   │   ├── locals.tf      # create - env name, naming, labels, env-specific machine types
│   │   ├── main.tf        # create - exactly the modules THIS env needs
│   │   └── outputs.tf     # create
│   ├── test/              # same file set
│   └── prod/              # same file set
└── README.md              # create
```

Each environment is its own Terraform root under `environments/<env>`. An environment's `main.tf` declares exactly the resources that environment runs. An env without a resource simply doesn't call its module. No `count` gating, no `var.environment` ternaries, no workspaces. Module sources are `../../modules/<module>`.

Available modules in `google@6.10.0/`: `vpc_network`, `firewall`, `gcs_bucket`, `compute_instance`, `cloud_run`, `service_account`, `secret`, `cloud_sql`, `cloud_function`, `artifact_registry`.

## Steps

1. For each resource the request needs, copy `assets/templates/iac/terraform/google@6.10.0/<module>/` → `infrastructure/terraform/modules/<module>/` (once, shared by all envs). Almost always include `vpc_network`; include `firewall` whenever you expose `compute_instance` or other networked workloads.
2. For each environment (dev, test, prod), create `infrastructure/terraform/environments/<env>/` and copy `provider.tf`, `versions.tf`, `backend.tf` from `assets/templates/iac/terraform/google@6.10.0/` into it. `provider.tf` is intentionally empty (`provider "google" {}`): project, region, and credentials are resolved from `GOOGLE_PROJECT`, `GOOGLE_REGION`, and `GOOGLE_CREDENTIALS`, so do not hardcode them there.
3. Write each env's `main.tf` with ONLY the modules that environment needs (`source = "../../modules/<module>"`), in this order: `vpc_network` first, then `firewall` (passing `network = module.vpc_network.network_name`), then the workload modules. Environments differ by construction: dev may omit a resource entirely while prod includes it with a bigger machine type. Pass outputs through, not hardcoded values:
   - `firewall`: `network = module.vpc_network.network_name` (or `network_self_link`)
   - `compute_instance`: `subnetwork = module.vpc_network.subnet_id`
   - `gcs_bucket`: `bucket_name = local.bucket_names["..."]`, `labels = local.common_labels`
   - regional modules take `region = var.region`
4. Write each env's `locals.tf` with `environment = "<env>"` plus all naming and labels derived from project + environment, e.g. `network_name`, `subnet_name`, `firewall_name`, `bucket_names`, and `common_labels = { environment = local.environment, managed_by = "genops" }`. All naming and env-specific machine types live here; modules accept `name`/`labels` and never invent names. Note GCP uses **labels** (lowercase, hyphen/underscore-safe), not tags.
5. Write each env's `variables.tf` with ONLY: `project`, `region`. No `environment` variable; the env is fixed by the directory. Credentials are NOT a Terraform variable; `GOOGLE_CREDENTIALS` is read from the environment by the provider.
6. Fill each env's `backend.tf` placeholders (GCS bucket, per-env prefix like `terraform/state/dev`) or mark them clearly for the user. The file ships commented out.

## Backend setup (GCS)

The bundled `backend.tf` ships commented out and must be enabled only after the backend bucket exists. Bootstrap once, then uncomment:

- **GCS bucket** (e.g. `tf-state-<project>`) with **versioning** enabled. Optionally enable uniform bucket-level access and a retention policy.

```hcl
terraform {
  backend "gcs" {
    bucket = "tf-state-<project>"
    prefix = "terraform/state/dev"   # unique per env dir: dev/test/prod
  }
}
```

Environments are isolated by directory: each `environments/<env>` root has its own `backend.tf` with a unique `prefix`, so a single backend bucket holds all three states. No workspaces.

## Secret / variable conventions

- The GCP service-account key flows as the **`GOOGLE_CREDENTIALS`** environment secret (the JSON key contents, or a path), never as `TF_VAR`. The provider/SDK reads it automatically.
- The `TF_VAR` values that flow are `TF_VAR_project` and `TF_VAR_region`; these populate the two root variables. Everything else (names, CIDRs, labels, environment) comes from that env dir's `locals.tf`. Never add more `TF_VAR`.
- **OIDC / Workload Identity Federation option:** instead of a long-lived JSON key, the workflow can authenticate keyless via `google-github-actions/auth` with `workload_identity_provider` + `service_account` (`permissions: id-token: write`). Prefer this when the user asks for keyless auth; the bundled callable workflow uses a `GOOGLE_CREDENTIALS` key by default.

## CI/CD

- **GitHub Actions:** copy `assets/templates/cicd/github/terraform/gcp/` → `.github/workflows/` keeping the file names (`_terraform-deploy.yml` is the callable workflow (the `_` prefix marks it internal per enterprise convention); `terraform-validate.yml`; `terraform-{dev,test,prod}.yml` callers). The callable workflow runs `fmt -check`, `validate`, `plan` (posted as a PR comment), then `apply` on the deploy job gated by a GitHub Environment for test/prod.
- The per-env wrappers set `working_directory` (`./infrastructure/terraform/environments/<env>`), `plan_artifact_name`, `gcp_project`, and `gcp_region`, and pass `GOOGLE_CREDENTIALS` as a repo/environment secret. The workflow maps inputs to `TF_VAR_project` / `TF_VAR_region`. Set `apply_requires_approval: true` and add required reviewers on the test/prod GitHub Environments.
- **Azure DevOps:** copy `assets/templates/cicd/devops/terraform/gcp/`: `_terraform-deploy.yml` stage template (validate + Checkov + plan + Environment-gated apply) plus thin `terraform-{dev,test,prod}.yml` callers → `azure-pipelines-{dev,test,prod}.yml`. Set `gcpServiceConnection`, `gcpProject` and backend variables; configure Environment approvals for test/production.
- **Jenkins:** copy `assets/templates/cicd/jenkins/terraform/gcp/Jenkinsfile`: declarative pipeline with an `ENVIRONMENT` choice parameter (validate → Checkov → plan → gated apply); create the `gcp-service-account-key` Jenkins Secret file credential (bound as `GOOGLE_APPLICATION_CREDENTIALS`).
