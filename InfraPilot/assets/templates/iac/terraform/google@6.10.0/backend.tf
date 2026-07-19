# Backend configuration for remote state storage
#
# IMPORTANT: You must create the backend storage resources BEFORE enabling this.
# Use a bootstrap script or manually create:
#   - GCS Bucket (e.g. tf-state-<project>) with versioning enabled
#   - (Optional) uniform bucket-level access and a retention policy
#
# Uncomment and fill in the values below after the backend bucket is ready.
# Each env dir (environments/dev|test|prod) sets its own state key/prefix - one backend, isolated states.

# terraform {
#   backend "gcs" {
#     bucket = "" # TODO: Fill in backend GCS bucket name
#     prefix = "" # TODO: Fill in state path prefix, unique per env dir (e.g. terraform/state/dev)
#   }
# }
