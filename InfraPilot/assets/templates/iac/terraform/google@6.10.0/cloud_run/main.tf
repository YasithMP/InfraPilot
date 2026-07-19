resource "google_cloud_run_v2_service" "main" {
  name     = var.service_name
  location = var.location

  template {
    containers {
      image = var.image

      ports {
        container_port = var.port
      }
    }
  }

  labels = var.labels
}
