variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP Region"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name prefix"
  type        = string
  default     = "code2cloud"
}

variable "zone" {
  description = "The GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "image_uri" {
  description = "The Docker image URI to deploy (e.g. gcr.io/project/image:tag)"
  type        = string
}

variable "ssh_public_key" {
  description = "The SSH public key for the ubuntu user"
  type        = string
}
