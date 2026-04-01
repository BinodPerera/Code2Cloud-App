output "frontend_ip" {
  description = "The static external IP address of the frontend VM"
  value       = google_compute_address.static_ip.address
}

output "npm_management_url" {
  description = "The URL for the Nginx Proxy Manager management UI"
  value       = "http://${google_compute_address.static_ip.address}:81"
}
