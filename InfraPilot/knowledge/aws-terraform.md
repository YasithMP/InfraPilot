# AWS + Terraform: copy & wire-up

Detailed procedure for the bundled `assets/templates/iac/terraform/aws@5.70.0/` modules and `assets/templates/cicd/github/terraform/aws/` pipelines. Load this only when the request targets Terraform on AWS.

## Layout to produce

Create everything under `<working-dir>/infrastructure/terraform/`:

```
infrastructure/terraform/
├── modules/<module>/      # copied from assets/templates, shared by all envs
├── environments/
│   ├── dev/               # one Terraform root per environment
│   │   ├── provider.tf    # copied (region resolved from env, no hardcoded region)
│   │   ├── versions.tf    # copied (aws pinned 5.70.0)
│   │   ├── backend.tf     # copied - FILL IN S3 + DynamoDB, per-env state key
│   │   ├── locals.tf      # create - env name, naming, tags, env-specific sizes
│   │   ├── main.tf        # create - exactly the modules THIS env needs
│   │   └── outputs.tf     # create
│   ├── test/              # same file set
│   └── prod/              # same file set
└── README.md              # create
```

Each environment is its own Terraform root under `environments/<env>`. An environment's `main.tf` declares exactly the resources that environment runs. An env that has no RDS simply doesn't call the module. No `count` gating, no `var.environment` ternaries, no workspaces. Module sources are `../../modules/<module>`.

Available modules in `aws@5.70.0/`: `vpc`, `security_group`, `s3_bucket`, `ec2_instance`, `iam_role`, `kms_key`, `app_runner`, `rds_instance`, `lambda_function`, `ecr_repository`, `secrets_manager_secret`.

## Steps

1. For each resource the request needs, copy `assets/templates/iac/terraform/aws@5.70.0/<module>/` → `infrastructure/terraform/modules/<module>/` (once, shared by all envs). Almost always include `vpc`; include `security_group` whenever you launch `ec2_instance` or anything network-attached.
2. For each environment (dev, test, prod), create `infrastructure/terraform/environments/<env>/` and copy `provider.tf`, `versions.tf`, `backend.tf` from `assets/templates/iac/terraform/aws@5.70.0/` into it. `provider.tf` is intentionally empty (`provider "aws" {}`): the region comes from `AWS_REGION` / `AWS_DEFAULT_REGION`, so do not add a `region` argument there.
3. Write each env's `main.tf` with ONLY the modules that environment needs (`source = "../../modules/<module>"`). Create the `vpc` first, then `security_group` (passing `vpc_id = module.vpc.vpc_id`), then the workload modules. Pass IDs/outputs through, not hardcoded values:
   - `security_group`: `vpc_id = module.vpc.vpc_id`
   - `ec2_instance`: `subnet_id = module.vpc.subnet_id`, `vpc_security_group_ids = [module.security_group.security_group_id]`
   - `s3_bucket`: `bucket_name = local.bucket_names["..."]`, `tags = local.common_tags`

   Environments differ by construction: dev's `main.tf` may omit RDS entirely while prod's includes it with a bigger instance class. Differences in size/settings live in that env's `locals.tf`, never in shared module code.
4. Write each env's `locals.tf` with `environment = "<env>"` plus all naming and tags derived from project + environment, e.g. `vpc_name`, `subnet_name`, `security_group_name`, `bucket_names`, and `common_tags = { Environment = local.environment, ManagedBy = "genops" }`. All naming lives here; modules take `name`/`tags` as inputs and never invent names.
5. No `variables.tf` is needed: the environment is fixed by the directory, and AWS credentials/region are NOT Terraform variables; they are read from the environment by the provider/SDK (see conventions).
6. Fill each env's `backend.tf` placeholders (S3 bucket, per-env key like `dev.terraform.tfstate`, region, DynamoDB table) or mark them clearly for the user. The file ships commented out.

## Backend setup (S3 + DynamoDB)

The bundled `backend.tf` ships commented out and must be enabled only after the backend storage exists. Bootstrap once (manually or via a throwaway script), then uncomment:

- **S3 bucket** (e.g. `tf-state-<account>-<region>`) with versioning and encryption enabled.
- **DynamoDB table** (e.g. `terraform-locks`) with a `LockID` string partition key for state locking.

```hcl
terraform {
  backend "s3" {
    bucket         = "tf-state-<account>-<region>"
    key            = "dev.terraform.tfstate"  # unique per env dir: dev/test/prod
    region         = "<region>"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

Environments are isolated by directory: each `environments/<env>` root has its own `backend.tf` with a unique `key`, so a single backend bucket holds all three states. No workspaces.

## Secret / variable conventions

- AWS credentials flow as **environment variables**, never as `TF_VAR`: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`. The provider/SDK picks these up automatically.
- No `TF_VAR` values flow at all: the environment is fixed by the working directory (`environments/<env>`), and everything else (names, CIDRs, tags, sizes) comes from that env's `locals.tf`. Never add `TF_VAR`.
- **OIDC option:** instead of long-lived keys, the workflow can assume an IAM role via GitHub OIDC (`permissions: id-token: write` + `aws-actions/configure-aws-credentials` with `role-to-assume`). Prefer this when the user asks for keyless auth; the bundled callable workflow uses static keys by default.

## CI/CD

- **GitHub Actions:** copy `assets/templates/cicd/github/terraform/aws/` → `.github/workflows/` keeping the file names (`_terraform-deploy.yml` is the callable workflow (the `_` prefix marks it internal per enterprise convention); `terraform-validate.yml`; `terraform-{dev,test,prod}.yml` callers). The callable workflow runs `fmt -check`, `validate`, `plan` (posted as a PR comment), then `apply` on the deploy job gated by a GitHub Environment for test/prod.
- The per-env wrappers set `working_directory` (`./infrastructure/terraform/environments/<env>`), `plan_artifact_name`, and `aws_region`, and pass `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` as repo/environment secrets. Set `apply_requires_approval: true` and add required reviewers on the test/prod GitHub Environments.
- **Azure DevOps:** copy `assets/templates/cicd/devops/terraform/aws/`: `_terraform-deploy.yml` stage template (validate + Checkov + plan + Environment-gated apply) plus thin `terraform-{dev,test,prod}.yml` callers → `azure-pipelines-{dev,test,prod}.yml`. Set `awsServiceConnection` and backend variables; configure Environment approvals for test/production.
- **Jenkins:** copy `assets/templates/cicd/jenkins/terraform/aws/Jenkinsfile`: declarative pipeline with an `ENVIRONMENT` choice parameter (validate → Checkov → plan → gated apply); create the `aws-access-key-id` / `aws-secret-access-key` Jenkins credentials (or prefer an IAM role on the agent and delete the bindings).
