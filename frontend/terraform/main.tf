provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# 1. Static External IP Address
resource "google_compute_address" "static_ip" {
  name = "${var.app_name}-static-ip"
}

# 2. Firewall rule for NPM (80, 443) and Management UI (81)
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

# 3. Compute Instance (e2-micro)
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
    # --- 1. Swap Setup (Essential for 1GB RAM instances) ---
    if [ ! -f /swapfile ]; then
      sudo fallocate -l 2G /swapfile
      sudo chmod 600 /swapfile
      sudo mkswap /swapfile
      sudo swapon /swapfile
      echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi

    # --- 2. Install Docker and Docker Compose V2 ---
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose-v2
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu

    # --- 3. Setup Project Directory ---
    mkdir -p /home/ubuntu/app
    cd /home/ubuntu/app
    mkdir -p npm_data letsencrypt

    # --- 4. Create the Docker Compose file ---
    cat <<EOF > docker-compose.yml
services:
  nginx-proxy-manager:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./npm_data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - app-network

  code2cloud-frontend:
    image: ${var.image_uri}
    container_name: code2cloud-frontend
    restart: unless-stopped
    ports:
      - '3000:80'
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
EOF

    # --- 5. Start the services ---
    # We use 'docker compose' (V2 syntax)
    sudo docker compose up -d
  EOT

  service_account {
    scopes = ["cloud-platform"]
  }
}

# Output the Static IP so you can find it easily
output "frontend_static_ip" {
  value = google_compute_address.static_ip.address
}
