provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "run_api" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_cloud_run_service" "frontend" {
  name       = "${var.app_name}-frontend"
  location   = var.region
  depends_on = [google_project_service.run_api]

  template {
    spec {
      containers {
        image = var.image_uri
        ports {
          container_port = 80
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
