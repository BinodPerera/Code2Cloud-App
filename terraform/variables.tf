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

variable "storage_size_gb" {
  description = "Root SSD block storage volume size in GB"
  type        = number
  default     = 20
}





variable "app_env_vars" {
  description = "Application runtime environment variables per component (JSON string)"
  type        = string
  default     = "{}"
  sensitive   = true
}

