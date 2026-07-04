# Problems identified when development

1. Problem: When the terraform is executing if any error occurs, the executed resources are remain in the cloud, We need to clean those resources
- Solution: We need to run terraform destroy if the error occured when during the deployment.
- Status: Pending

2. Problem: When the deployment the .env varibles setting is missing, we need to way for set them. 
- Solution: We need to allow user to create .env varibles manually before the deployment.
- Status: Pending

3. The env variables store in the our system is security risk we need to way to reduce the risk
- Solution:

4. When we showing logs to user some phases completeness is missing. So, we need to detect way for accurately show each phases completeness.
- Solution: Hope to create backend endpoint and call them in each phase when executing the terraform code.
- Status: Pending

5. In monorepoes, if we choose instance type or resouces, that selected instance can we enough or waste. 
- Solution: we need to allow user to select instances each services(eg: frontend t3.micro, backend t3.small, redis t3.small).
- Status: Pending