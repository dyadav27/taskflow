# ============================================================
# TaskFlow - Terraform Infrastructure (AWS Free Tier)
# Provisions: 1 Master + 2 Worker EC2 t2.micro nodes
# ============================================================

terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── Data sources ─────────────────────────────────────────────
data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Ubuntu 22.04 LTS AMI (free tier eligible)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ── VPC and Networking ────────────────────────────────────────
resource "aws_vpc" "taskflow_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "taskflow-vpc"
    Project = "taskflow"
  }
}

resource "aws_internet_gateway" "taskflow_igw" {
  vpc_id = aws_vpc.taskflow_vpc.id
  tags   = { Name = "taskflow-igw" }
}

resource "aws_subnet" "taskflow_subnet" {
  vpc_id                  = aws_vpc.taskflow_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "taskflow-subnet" }
}

resource "aws_route_table" "taskflow_rt" {
  vpc_id = aws_vpc.taskflow_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.taskflow_igw.id
  }

  tags = { Name = "taskflow-rt" }
}

resource "aws_route_table_association" "taskflow_rta" {
  subnet_id      = aws_subnet.taskflow_subnet.id
  route_table_id = aws_route_table.taskflow_rt.id
}

# ── Security Group ────────────────────────────────────────────
resource "aws_security_group" "taskflow_sg" {
  name        = "taskflow-k8s-sg"
  description = "Security group for TaskFlow Kubernetes cluster"
  vpc_id      = aws_vpc.taskflow_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH"
  }

  # Kubernetes API server
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes API Server"
  }

  # App access via NodePort
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Kubernetes NodePort range"
  }

  # Jenkins access
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Jenkins"
  }

  # HTTP/HTTPS
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # Internal cluster communication
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Internal VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "taskflow-sg" }
}

# ── SSH Key Pair ──────────────────────────────────────────────
resource "aws_key_pair" "taskflow_key" {
  key_name   = var.key_name
  public_key = file(var.public_key_path)
}

# ── EC2 Instances ─────────────────────────────────────────────

# Master Node
resource "aws_instance" "master" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"   # Free tier eligible
  subnet_id              = aws_subnet.taskflow_subnet.id
  vpc_security_group_ids = [aws_security_group.taskflow_sg.id]
  key_name               = aws_key_pair.taskflow_key.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
    #!/bin/bash
    hostnamectl set-hostname taskflow-master
    echo "taskflow-master" > /etc/hostname
  EOF

  tags = {
    Name    = "taskflow-master"
    Role    = "master"
    Project = "taskflow"
  }
}

# Worker Node 1
resource "aws_instance" "worker1" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.taskflow_subnet.id
  vpc_security_group_ids = [aws_security_group.taskflow_sg.id]
  key_name               = aws_key_pair.taskflow_key.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
    #!/bin/bash
    hostnamectl set-hostname taskflow-worker1
    echo "taskflow-worker1" > /etc/hostname
  EOF

  tags = {
    Name    = "taskflow-worker1"
    Role    = "worker"
    Project = "taskflow"
  }
}

# Worker Node 2
resource "aws_instance" "worker2" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.taskflow_subnet.id
  vpc_security_group_ids = [aws_security_group.taskflow_sg.id]
  key_name               = aws_key_pair.taskflow_key.key_name

  root_block_device {
    volume_size = 20
    volume_type = "gp2"
  }

  user_data = <<-EOF
    #!/bin/bash
    hostnamectl set-hostname taskflow-worker2
    echo "taskflow-worker2" > /etc/hostname
  EOF

  tags = {
    Name    = "taskflow-worker2"
    Role    = "worker"
    Project = "taskflow"
  }
}
