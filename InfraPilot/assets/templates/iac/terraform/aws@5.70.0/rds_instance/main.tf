# AWS RDS instance with encrypted storage and no public access by default.
# Instead of var.password, consider manage_master_user_password = true to let
# RDS manage the master password in Secrets Manager.
resource "aws_db_instance" "main" {
  identifier     = var.identifier
  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  db_name  = var.db_name
  username = var.username
  password = var.password

  allocated_storage = var.allocated_storage
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.vpc_security_group_ids
  publicly_accessible    = false

  backup_retention_period   = var.backup_retention_period
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final"

  tags = merge(var.tags, { Name = var.identifier })
}
