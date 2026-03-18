output "frontend_url" {
  description = "The URL of the deployed frontend on Cloud Run"
  value       = google_cloud_run_service.frontend.status[0].url
}
