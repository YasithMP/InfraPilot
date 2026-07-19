output "name" {
  value = google_compute_instance.main.name
}

output "instance_id" {
  value = google_compute_instance.main.id
}

output "internal_ip" {
  value = google_compute_instance.main.network_interface[0].network_ip
}
