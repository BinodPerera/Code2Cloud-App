terraform {
  backend "gcs" {
    bucket = "tf_state_bucket_code2cloud"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "iam_api" {
  project            = var.project_id
  service            = "iam.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute_api" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "resourcemanager_api" {
  project            = var.project_id
  service            = "cloudresourcemanager.googleapis.com"
  disable_on_destroy = false
}

# VPC
resource "google_compute_network" "vpc_network" {
  name                    = "code2cloud-vpc"
  auto_create_subnetworks = true
  depends_on              = [google_project_service.compute_api]
}

# firewall rules for allow ssh, http, and application port 8000
resource "google_compute_firewall" "allow_app_traffic" {
  name    = "allow-ssh-http-8000"
  network = google_compute_network.vpc_network.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "81", "443", "8000"]
  }

  source_ranges = ["0.0.0.0/0"]
}

# Create a service account for the instance
resource "google_service_account" "api_instance_sa" {
  account_id   = "code2cloud-instance-sa"
  display_name = "Service Account for code2cloud Instance"
  depends_on   = [google_project_service.iam_api]
}

# Assign minimal roles (Logging and Monitoring)
resource "google_project_iam_member" "log_writer" {
  project    = var.project_id
  role       = "roles/logging.logWriter"
  member     = "serviceAccount:${google_service_account.api_instance_sa.email}"
  depends_on = [google_project_service.resourcemanager_api]
}

resource "google_project_iam_member" "metric_writer" {
  project    = var.project_id
  role       = "roles/monitoring.metricWriter"
  member     = "serviceAccount:${google_service_account.api_instance_sa.email}"
  depends_on = [google_project_service.resourcemanager_api]
}


resource "google_compute_instance" "vm_instance" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network = google_compute_network.vpc_network.name
    access_config {
      # Include this block to give the instance a public IP address
    }
  }

  metadata = {
    ssh-keys = var.ssh_public_key != "" ? "ubuntu:${var.ssh_public_key}" : "ubuntu:${file(pathexpand("~/.ssh/id_ed25519.pub"))}"
  }

  service_account {
    email  = google_service_account.api_instance_sa.email
    scopes = ["cloud-platform"]
  }

  tags = ["http-server"]

  metadata_startup_script = <<-EOF
    #!/bin/bash
    # 1. Create 2GB of Swap space (Essential for e2-micro)
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 2. Standard Docker and Docker Compose install
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-v2
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu

    # 3. Run Nginx Proxy Manager
    mkdir -p /home/ubuntu/npm_data /home/ubuntu/letsencrypt
    sudo docker run -d \
      --name nginx-proxy-manager \
      -p 80:80 -p 81:81 -p 443:443 \
      -v /home/ubuntu/npm_data:/data \
      -v /home/ubuntu/letsencrypt:/etc/letsencrypt \
      --restart unless-stopped \
      jc21/nginx-proxy-manager:latest
  EOF
}
