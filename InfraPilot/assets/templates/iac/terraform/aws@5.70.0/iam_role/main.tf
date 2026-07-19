# AWS IAM role
resource "aws_iam_role" "main" {
  name               = var.role_name
  assume_role_policy = var.assume_role_policy

  tags = merge(var.tags, { Name = var.role_name })
}
