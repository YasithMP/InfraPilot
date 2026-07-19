resource "aws_secretsmanager_secret" "main" {
  name                    = var.secret_name
  description             = var.description
  kms_key_id              = var.kms_key_id
  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(var.tags, { Name = var.secret_name })
}

# Only created when a value is supplied; otherwise set the value out of band.
resource "aws_secretsmanager_secret_version" "main" {
  count = var.secret_value == null ? 0 : 1

  secret_id     = aws_secretsmanager_secret.main.id
  secret_string = var.secret_value
}
