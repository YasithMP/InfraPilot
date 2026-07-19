# Firewall rule allowing inbound TCP traffic on the given ports.
resource "google_compute_firewall" "main" {
  name    = var.name
  network = var.network

  allow {
    protocol = "tcp"
    ports    = var.allowed_ports
  }

  source_ranges = var.source_ranges
}
