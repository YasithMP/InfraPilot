# VPC network with an explicitly managed subnetwork.
resource "google_compute_network" "main" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = var.subnet_name
  network       = google_compute_network.main.id
  ip_cidr_range = var.subnet_cidr
  region        = var.region
}
