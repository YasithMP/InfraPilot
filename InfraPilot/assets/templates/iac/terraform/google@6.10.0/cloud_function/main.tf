# Cloud Functions (2nd gen) function deployed from a source archive in GCS.
resource "google_cloudfunctions2_function" "main" {
  name     = var.function_name
  location = var.location

  build_config {
    runtime     = var.runtime
    entry_point = var.entry_point

    source {
      storage_source {
        bucket = var.source_bucket
        object = var.source_object
      }
    }
  }

  service_config {
    available_memory      = var.available_memory
    timeout_seconds       = var.timeout_seconds
    max_instance_count    = var.max_instance_count
    service_account_email = var.service_account_email
    ingress_settings      = var.ingress_settings
  }

  labels = var.labels
}
