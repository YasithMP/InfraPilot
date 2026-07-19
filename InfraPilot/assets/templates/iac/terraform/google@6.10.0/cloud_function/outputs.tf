output "function_id" {
  value = google_cloudfunctions2_function.main.id
}

output "function_name" {
  value = google_cloudfunctions2_function.main.name
}

output "function_uri" {
  value = google_cloudfunctions2_function.main.service_config[0].uri
}
