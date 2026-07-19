# AWS Security Group
resource "aws_security_group" "main" {
  name   = var.name
  vpc_id = var.vpc_id

  ingress {
    description = "Inbound traffic"
    from_port   = var.ingress_from_port
    to_port     = var.ingress_to_port
    protocol    = var.ingress_protocol
    cidr_blocks = var.ingress_cidr_blocks
  }

  egress {
    description = "Outbound traffic"
    from_port   = var.egress_from_port
    to_port     = var.egress_to_port
    protocol    = var.egress_protocol
    cidr_blocks = var.egress_cidr_blocks
  }

  tags = merge(var.tags, { Name = var.name })
}
