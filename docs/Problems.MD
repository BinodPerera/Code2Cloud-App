# Problems identified when development

1. Problem: When the terraform is executing if any error occurs, the executed resources are remain in the cloud, We need to clean those resources
- Solution: We need to run terraform destroy if the error occured when during the deployment.
- Status: Pending

2. Problem: When the deployment the .env variables setting is missing, we need a way to set them. 
- Solution: Allow user to create .env variables manually or upload .env file before deployment in UI (EnvVariablesEditor).
- Strategy: Parse .env in browser/UI, encrypt via NaCl Libsodium, and push directly to GitHub Repository Secrets without storing plain values in Code2Cloud DB.
- Status: Resolved

3. Problem: Storing env variables in our system is a security risk. We need a way to reduce the risk.
- Solution: Zero-Knowledge Secret Transport.
- Strategy: Store user secrets directly in GitHub Repository Secrets (using GitHubSecretsManager). In Terraform/Containers, pass secrets as TF_VAR_ directly into container environment definitions without relying on paid/complex Cloud Secret Managers.
- Status: Resolved

4. Problem: When showing logs to user, some phases completeness is missing. So, we need to detect a way to accurately show each phase's completeness.
- Solution: We need to create a way to accurately show each phase completeness to the user.
- Strategy: We can create a backend endpoint to get the status of each phase and update the UI accordingly.
- Status: Pending

5. Problem: In monorepos, if we choose instance type or resources, that selected instance can be enough or waste. 
- Solution: Allow user to select instances for each service (eg: frontend t3.micro, backend t3.small, redis t3.small).
- Status: Pending

6. Problem: Some .env variables are known only after deployment (e.g., DB host, Redis URL, Backend URL). How do we set them?
- Solution: Two-Pass Terraform In-Memory Auto-Wiring + Pipeline Step Outputs.
- Strategy: 
  1. Terraform in-memory auto-wiring: Terraform outputs (e.g. `aws_db_instance.postgres.address`) are passed directly into ECS container environment definitions in `main.tf` during single `terraform apply`.
  2. Sequential GitHub Actions steps: Run `terraform apply` first, extract outputs (`terraform output -raw backend_url`), and pass them as `--build-arg VITE_API_URL` to frontend Docker container builds.
- Status: Resolved