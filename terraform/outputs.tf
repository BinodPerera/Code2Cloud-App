
output "backend_ecr_repository_url" {
  description = "Registry URL for backend container builds"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/${lower(var.project_name)}-backend"
}


output "backend_public_ip" {
  description = "Public IP address of the backend virtual machine"
  value       = aws_instance.backend.public_ip
}


output "frontend_ecr_repository_url" {
  description = "Registry URL for frontend container builds"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/${lower(var.project_name)}-frontend"
}


output "frontend_public_ip" {
  description = "Public IP address of the frontend virtual machine"
  value       = aws_instance.frontend.public_ip
}

