variable "aws_region" {
  description = "AWS region to deploy in"
  type        = string
  default     = "ap-south-1"   # Mumbai — closest for India-based students
}

variable "key_name" {
  description = "Name of the EC2 key pair"
  type        = string
  default     = "taskflow-key"
}

variable "public_key_path" {
  description = "Path to local SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "dockerhub_username" {
  description = "Your Docker Hub username (for image names)"
  type        = string
}
