output "master_public_ip" {
  description = "Public IP of the Kubernetes master node"
  value       = aws_instance.master.public_ip
}

output "worker1_public_ip" {
  description = "Public IP of worker node 1"
  value       = aws_instance.worker1.public_ip
}

output "worker2_public_ip" {
  description = "Public IP of worker node 2"
  value       = aws_instance.worker2.public_ip
}

output "app_url" {
  description = "URL to access the TaskFlow application"
  value       = "http://${aws_instance.master.public_ip}:30080"
}

output "ssh_master" {
  description = "SSH command for master node"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.master.public_ip}"
}

output "ssh_worker1" {
  description = "SSH command for worker 1"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.worker1.public_ip}"
}

output "ssh_worker2" {
  description = "SSH command for worker 2"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.worker2.public_ip}"
}
