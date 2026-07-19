resource "google_storage_bucket" "main" {
  name     = var.bucket_name
  location = var.location

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  labels = var.labels
}
