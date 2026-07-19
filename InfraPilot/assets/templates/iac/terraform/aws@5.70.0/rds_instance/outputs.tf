output "instance_id" {
  value = aws_db_instance.main.id
}

output "instance_identifier" {
  value = aws_db_instance.main.identifier
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "address" {
  value = aws_db_instance.main.address
}

output "port" {
  value = aws_db_instance.main.port
}
