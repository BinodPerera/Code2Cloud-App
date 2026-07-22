variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix for all resource naming"
  type        = string
  default     = "Code2Cloud-App"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
  default     = "production"
}

variable "app_env_vars" {
  description = "Application environment variables passed from GitHub Secrets"
  type        = map(string)
  default     = {}
}
