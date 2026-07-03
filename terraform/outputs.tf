
output "backend_ecr_repository_url" {
  description = "Registry URL for backend container builds"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repository_url" {
  description = "Registry URL for frontend container builds"
  value       = aws_ecr_repository.frontend.repository_url
}
