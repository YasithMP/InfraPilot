output "email" {
  value = google_service_account.main.email
}

output "account_id" {
  value = google_service_account.main.account_id
}

output "member" {
  value = google_service_account.main.member
}
