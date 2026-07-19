# OpenTofu templates

OpenTofu is a drop-in fork of Terraform and consumes the **same** module files. There is no separate copy here; reuse the Terraform sets:

- Azure  → `../terraform/azure@4.70.0/`
- AWS    → `../terraform/aws@5.70.0/`
- GCP    → `../terraform/google@6.10.0/`

## How to use with OpenTofu

1. Copy the modules + root files exactly as you would for Terraform.
2. Run `tofu` instead of `terraform` (`tofu init`, `tofu plan`, `tofu apply`).
3. `versions.tf` works unchanged; `required_providers` and the `hashicorp/*` sources resolve from the OpenTofu registry.
4. For the remote backend, the same `backend.tf` block applies (`tofu` reads it identically).

Only switch the CLI; the HCL is identical. Do not duplicate the `.tf` files here; point at the Terraform directories above.
