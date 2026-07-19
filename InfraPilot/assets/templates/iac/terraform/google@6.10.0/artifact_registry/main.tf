resource "google_artifact_registry_repository" "main" {
  repository_id = var.repository_id
  location      = var.location
  format        = var.format
  description   = var.description

  dynamic "cleanup_policies" {
    for_each = var.keep_most_recent_versions == null ? [] : [var.keep_most_recent_versions]

    content {
      id     = "keep-most-recent"
      action = "KEEP"

      most_recent_versions {
        keep_count = cleanup_policies.value
      }
    }
  }

  labels = var.labels
}
