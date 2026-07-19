# AWS App Runner service
resource "aws_apprunner_service" "main" {
  service_name = var.service_name

  source_configuration {
    image_repository {
      image_identifier      = var.image_identifier
      image_repository_type = var.image_repository_type

      image_configuration {
        port = tostring(var.port)
      }
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu    = var.cpu
    memory = var.memory
  }

  tags = merge(var.tags, { Name = var.service_name })
}
