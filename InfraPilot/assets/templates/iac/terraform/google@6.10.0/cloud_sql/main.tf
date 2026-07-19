# Cloud SQL instance with an initial database and user. Public IP is off by
# default; set private_network for private connectivity.
resource "google_sql_database_instance" "main" {
  name             = var.instance_name
  region           = var.region
  database_version = var.database_version

  deletion_protection = var.deletion_protection

  settings {
    tier = var.tier

    ip_configuration {
      ipv4_enabled    = var.public_ip_enabled
      private_network = var.private_network
    }

    backup_configuration {
      enabled    = var.backup_enabled
      start_time = var.backup_start_time
    }

    user_labels = var.labels
  }
}

resource "google_sql_database" "main" {
  name     = var.database_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = var.user_name
  instance = google_sql_database_instance.main.name
  password = var.user_password
}
