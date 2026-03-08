output "public_ip" {
  description = "The public IP address of the Compute Engine instance"
  value       = google_compute_instance.vm_instance.network_interface[0].access_config[0].nat_ip
}

output "instance_name" {
  description = "The name of the Compute Engine instance"
  value       = google_compute_instance.vm_instance.name
}
