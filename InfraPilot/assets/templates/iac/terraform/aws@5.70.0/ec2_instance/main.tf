# AWS EC2 instance with an encrypted root volume
resource "aws_instance" "main" {
  ami                    = var.ami
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.vpc_security_group_ids

  root_block_device {
    encrypted = true
  }

  tags = merge(var.tags, { Name = var.name })
}
