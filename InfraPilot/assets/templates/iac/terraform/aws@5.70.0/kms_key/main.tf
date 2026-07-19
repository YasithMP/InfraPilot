# AWS KMS key with a friendly alias
resource "aws_kms_key" "main" {
  description             = var.description
  deletion_window_in_days = var.deletion_window_in_days
  enable_key_rotation     = true

  tags = var.tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.alias_name}"
  target_key_id = aws_kms_key.main.key_id
}
