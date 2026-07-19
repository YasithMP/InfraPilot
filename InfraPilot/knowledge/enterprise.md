# Enterprise hardening guide

Load this when the user asks for "enterprise", "production", "compliant", "secure", or regulated-industry infrastructure, or when generating anything destined for a prod environment. Apply every section below on top of the normal workflow; each is a default the generated IaC must meet unless the user explicitly opts out.

## Mandatory tagging / labeling

Every resource that supports tags gets, at minimum:

| Tag / label        | Value                                            |
| ------------------ | ------------------------------------------------ |
| `environment`      | `dev` / `test` / `prod` (from the env variable)  |
| `project`          | project name variable                            |
| `owner`            | team or contact (placeholder for user to fill) |
| `cost-center`      | placeholder for user to fill                     |
| `managed-by`       | `terraform` / `pulumi` / `bicep` (literal)       |

Implement once, not per-resource:
- **Terraform:** `default_tags` block on the AWS provider; a `local.common_tags` merged into every module via a `tags` variable on Azure/GCP (GCP: `labels`, lowercase keys/values only).
- **Pulumi:** a shared `commonTags` object spread into every component's args.
- **Bicep:** a `commonTags` param passed to every module.

## Security defaults (non-negotiable)

- **Encryption at rest** on everything that stores data: storage accounts/buckets (SSE, KMS/CMK where the org requires customer-managed keys), disks, databases. Expose a `kms_key_id`-style variable so orgs can bring their own key.
- **No public exposure by default:** storage buckets/accounts block public access; databases and VMs get no public IP; ingress rules never `0.0.0.0/0` except explicit user-requested web tiers (and then only 80/443 into an LB/gateway, never straight to compute).
- **TLS minimum 1.2** wherever the resource has the setting (storage accounts, app services, load balancers).
- **Least-privilege identity:** workload identities (managed identity / IRSA / workload identity federation) over static keys; scoped roles over owner/admin; no wildcard `*` actions in hand-written IAM policies.
- **Secrets** live in the platform vault (Key Vault / Secrets Manager / Secret Manager) and are *referenced*, never in state-visible plaintext variables. CI/CD authenticates via OIDC federation, not long-lived cloud credentials stored as pipeline secrets.
- **Audit/diagnostic logging on:** enable diagnostic settings / CloudTrail-relevant resource options / audit logs on anything that supports them, shipped to the org's central log destination (placeholder variable for the destination ID).
- **Deletion protection** on stateful resources: `prevent_destroy` lifecycle (Terraform) or platform equivalents (Azure resource locks, RDS/S3 deletion protection flags) for prod.

## State & backend hardening (Terraform/OpenTofu)

- Remote backend with **locking** (S3+DynamoDB or S3 lockfile, Azure blob lease, GCS) and **encryption enabled** on the backend store itself.
- **One state per environment**: separate state files/keys (or workspaces) for dev/test/prod; prod state in its own storage with tighter IAM.
- Backend storage is never created by the same config that uses it; document the bootstrap step in the README.

## Pipeline governance

The bundled CI/CD templates already give: validate + plan on PR (plan posted as comment), apply gated by GitHub/AzDO Environment approvals for test/prod. On top:

- **Static security scanning is part of validate**: the bundled GitHub `terraform-validate.yml` and `bicep-validate.yml` run Checkov and fail the PR on findings; the bundled Azure DevOps Terraform pipelines run a Checkov script step in their validate stage. Keep them; if the org standardizes on tfsec/Trivy or OPA/Sentinel policies, swap the step, don't drop it. Pulumi has no static-file scanner; its gate is `tsc` + `pulumi preview` in validate; offer Pulumi CrossGuard policy packs if the org wants policy-as-code.
- **Never `apply -auto-approve` from a push trigger.** Applies only run from the gated deploy jobs.
- **Drift detection:** offer a scheduled (cron) workflow running `terraform plan -detailed-exitcode` per environment that opens an issue/alert on drift. Generate it when the user asks for drift detection or full enterprise setup.
- **Branch protection expectations** (document in README, can't be templated): PR required, validate workflow required to pass, no direct pushes to main.

## Deliverables checklist

When the enterprise profile is applied, the final report to the user must list:
1. Which of the defaults above are active, and any the user opted out of.
2. Every placeholder still to fill: owner/cost-center tags, KMS/CMK key IDs, log destination, backend storage, service connections / OIDC app registrations.
3. The bootstrap order: create backend storage → configure OIDC federation → set environment approvals → first plan/apply per environment.
