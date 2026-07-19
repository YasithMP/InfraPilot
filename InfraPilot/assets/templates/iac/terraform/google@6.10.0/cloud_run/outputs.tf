output "service_id" {
  value = google_cloud_run_v2_service.main.id
}

output "service_name" {
  value = google_cloud_run_v2_service.main.name
}

output "service_uri" {
  value = google_cloud_run_v2_service.main.uri
}
