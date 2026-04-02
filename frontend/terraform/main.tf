provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Static External IP Address
resource "google_compute_address" "static_ip" {
  name = "${var.app_name}-static-ip"
}

# Firewall rule for NPM (80, 443) and Management UI (81)
resource "google_compute_firewall" "allow_npm" {
  name    = "${var.app_name}-allow-npm"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "81"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["npm-server"]
}

# Compute Instance (e2-micro)
resource "google_compute_instance" "frontend_vm" {
  name         = "${var.app_name}-frontend-vm"
  machine_type = "e2-micro"
  zone         = var.zone
  tags         = ["npm-server"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  metadata = {
    ssh-keys = "ubuntu:${var.ssh_public_key}"
  }

  metadata_startup_script = <<-EOT
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

    # 3. Prepare NPM directories
    mkdir -p /home/ubuntu/npm_data /home/ubuntu/letsencrypt

    # 4. Run Nginx Proxy Manager
    sudo docker run -d \
      --name nginx-proxy-manager \
      -p 80:80 -p 81:81 -p 443:443 \
      -v /home/ubuntu/npm_data:/data \
      -v /home/ubuntu/letsencrypt:/etc/letsencrypt \
      --restart unless-stopped \
      jc21/nginx-proxy-manager:latest

    # 5. Run Frontend (Initial)
    sudo docker run -d \
      --name code2cloud-frontend \
      -p 3000:80 \
      --restart unless-stopped \
      ${var.image_uri}
  EOT

  service_account {
    scopes = ["cloud-platform"]
  }
}
