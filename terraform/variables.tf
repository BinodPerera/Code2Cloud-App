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