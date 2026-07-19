output "name" {
  value = google_compute_network.main.name
}

output "network_id" {
  value = google_compute_network.main.id
}

output "subnet_id" {
  value = google_compute_subnetwork.main.id
}

output "network_self_link" {
  value = google_compute_network.main.self_link
}
