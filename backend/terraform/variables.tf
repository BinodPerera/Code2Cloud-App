variable "project_id" {
  description = "The GCP Project ID"
  type        = string
  default     = "final-year-research-488914"
}

variable "tf_state_bucket" {
  description = "The terraform state bucket name"
  type        = string
  default     = "tf_state_bucket_code2cloud"
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone to deploy resources"
  type        = string
  default     = "us-central1-a"
}

variable "instance_name" {
  description = "The name of the Compute Engine instance"
  type        = string
  default     = "code2cloud-instance"
}

variable "machine_type" {
  description = "The machine type for the instance"
  type        = string
  default     = "e2-micro"
}

variable "ssh_public_key" {
  description = "The public key content for SSH access. If not provided, it will attempt to read from ~/.ssh/id_ed25519.pub"
  type        = string
  default     = ""
}
