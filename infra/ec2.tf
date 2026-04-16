resource "aws_instance" "app" {
  ami                    = "ami-0ec2a5ff1be0688fa" # Ubuntu 22.04 LTS eu-west-1, pinned 2026-03-31
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_pair_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.ebs_volume_size_gb
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project = var.project
  }))
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
}