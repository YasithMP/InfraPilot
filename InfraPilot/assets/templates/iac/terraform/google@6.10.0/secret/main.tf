# Secret Manager secret with automatic replication.
resource "google_secret_manager_secret" "main" {
  secret_id = var.secret_id

  replication {
    auto {}
  }

  labels = var.labels
}
