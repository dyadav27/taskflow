# ✅ TaskFlow — DevOps Microservices Project

A production-grade **Task Management Web Application** built with a microservices architecture, deployed on AWS EC2 using Docker, Kubernetes (kubeadm), Jenkins CI/CD, Terraform, and Ansible.

> **Subject:** DevOps (B.E. / B.Tech CSE)  
> **Tech Stack:** Node.js · React · PostgreSQL · Docker · Kubernetes · Jenkins · Terraform · Ansible · AWS EC2

---

## 📐 Architecture Overview

```
                         ┌─────────────────────────────────────┐
                         │         AWS EC2 (Free Tier)          │
                         │   Kubernetes Cluster (kubeadm)        │
                         │                                       │
  Browser ──────────────▶│  ┌──────────┐   ┌───────────────┐   │
  http://MASTER_IP:30080 │  │ Frontend │──▶│  auth-service  │   │
                         │  │ (Nginx)  │   │  (Node.js)    │   │
                         │  │  React   │   └───────┬───────┘   │
                         │  │ + API GW │           │ JWT verify │
                         │  └──────────┘   ┌───────▼───────┐   │
                         │                 │  task-service  │   │
                         │                 │  (Node.js)    │   │
                         │                 └───────┬───────┘   │
                         │                         │            │
                         │                 ┌───────▼───────┐   │
                         │                 │  PostgreSQL    │   │
                         │                 │  StatefulSet   │   │
                         │                 └───────────────┘   │
                         └─────────────────────────────────────┘
```

### Microservices

| Service | Port | Responsibility |
|---|---|---|
| **frontend** | 80 | React UI + Nginx API Gateway |
| **auth-service** | 3001 | Register, Login, JWT token management |
| **task-service** | 3002 | Full CRUD for tasks, calls auth-service to verify tokens |
| **postgres** | 5432 | Shared PostgreSQL database (StatefulSet) |

### DevOps Tools Used

| Tool | Purpose |
|---|---|
| **Docker** | Containerise all 3 services with multi-stage builds |
| **Docker Hub** | Free container registry |
| **Kubernetes (kubeadm)** | Orchestrate containers on AWS EC2 |
| **Jenkins** | CI/CD pipeline: Test → Build → Push → Deploy |
| **Terraform** | Provision 3 EC2 instances (1 master + 2 workers) on AWS |
| **Ansible** | Configure servers, install K8s, deploy app |
| **GitHub** | Source control + triggers Jenkins via webhook |

---

## 📁 Project Structure

```
taskflow/
├── auth-service/           # Auth microservice (Node.js + Express)
│   ├── src/
│   │   ├── index.js        # Entry point
│   │   ├── db.js           # PostgreSQL connection + schema init
│   │   ├── routes/auth.js  # Register, Login, Verify, Me
│   │   ├── middleware/auth.js
│   │   └── __tests__/
│   ├── Dockerfile
│   └── package.json
│
├── task-service/           # Task microservice (Node.js + Express)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── routes/tasks.js # Full CRUD + stats + filters
│   │   ├── middleware/auth.js  # Calls auth-service to verify JWT
│   │   └── __tests__/
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React app + Nginx API Gateway
│   ├── src/
│   │   ├── context/AuthContext.js
│   │   ├── pages/          # Login, Register, Dashboard
│   │   └── components/     # Navbar, TaskCard, TaskModal, StatsBar
│   ├── nginx.conf          # Proxies /api/auth → auth-service, /api/tasks → task-service
│   └── Dockerfile          # Multi-stage: React build → Nginx
│
├── k8s/                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap-secret.yaml
│   ├── postgres.yaml       # StatefulSet + PVC + Service
│   ├── auth-service.yaml   # Deployment + Service + HPA
│   ├── task-service.yaml   # Deployment + Service + HPA
│   └── frontend.yaml       # Deployment + NodePort Service
│
├── terraform/              # AWS infrastructure as code
│   ├── main.tf             # VPC, Subnet, SG, 3x t2.micro EC2
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
│
├── ansible/                # Server configuration automation
│   ├── inventory.ini
│   ├── install-k8s.yml     # Install containerd + kubeadm on all nodes
│   ├── init-master.yml     # kubeadm init + Flannel CNI
│   ├── join-workers.yml    # Join worker nodes
│   └── deploy-app.yml      # Deploy K8s manifests
│
├── jenkins/
│   ├── setup-jenkins.sh    # Install Jenkins + Docker + kubectl
│   └── jenkins.yaml        # Jenkins Configuration as Code
│
├── scripts/
│   ├── deploy.sh           # Full end-to-end deployment automation
│   ├── local-dev.sh        # Local Docker Compose helper
│   └── update-secrets.sh   # Generate K8s secrets from user input
│
├── Jenkinsfile             # CI/CD Pipeline definition
├── docker-compose.yml      # Local development setup
└── README.md
```

---

## 🚀 SETUP AND RUN — COMMANDS IN ORDER

---

### PART A — LOCAL DEVELOPMENT (Test on your machine first)

#### Prerequisites
```bash
# Install Docker Desktop: https://www.docker.com/products/docker-desktop/
# Install Git:            https://git-scm.com/
# Install Node.js 18:     https://nodejs.org/

# Verify installations
docker --version
git --version
node --version
```

#### Step 1 — Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/taskflow.git
cd taskflow
```

#### Step 2 — Start everything locally with Docker Compose
```bash
# Give the script execute permission
chmod +x scripts/local-dev.sh

# Build images and start all 4 services (postgres, auth, task, frontend)
./scripts/local-dev.sh up

# OR manually:
docker compose up --build -d
```

#### Step 3 — Verify local services are running
```bash
docker compose ps

# Check health endpoints
curl http://localhost:3001/health   # Auth service
curl http://localhost:3002/health   # Task service
```

#### Step 4 — Open the app
```
http://localhost:80
```
Register a new account → log in → create tasks!

#### Step 5 — Run tests locally
```bash
./scripts/local-dev.sh test

# OR per service:
cd auth-service && npm ci && npm test
cd task-service && npm ci && npm test
```

#### Useful local commands
```bash
./scripts/local-dev.sh logs              # Tail all logs
./scripts/local-dev.sh logs auth-service # Tail one service
./scripts/local-dev.sh down              # Stop all services
./scripts/local-dev.sh reset             # Stop + delete volumes (wipes DB)
./scripts/local-dev.sh status            # Show container status
```

---

### PART B — AWS CLOUD DEPLOYMENT

---

#### Prerequisites
```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws --version

# 2. Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.3/terraform_1.6.3_linux_amd64.zip
unzip terraform_1.6.3_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version

# 3. Install Ansible
sudo apt-get update && sudo apt-get install -y ansible
ansible --version

# 4. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

---

#### Step 1 — Configure AWS credentials
```bash
# Sign up at https://aws.amazon.com (free tier)
# Go to: IAM → Users → Your User → Security Credentials → Create Access Key

aws configure
# AWS Access Key ID:     ENTER_YOUR_ACCESS_KEY
# AWS Secret Access Key: ENTER_YOUR_SECRET_KEY
# Default region:        ap-south-1
# Default output format: json

# Verify
aws sts get-caller-identity
```

---

#### Step 2 — Create SSH key pair
```bash
# Generate SSH key (skip if you already have ~/.ssh/id_rsa)
ssh-keygen -t rsa -b 2048 -f ~/.ssh/id_rsa -N ""

# Verify public key exists
cat ~/.ssh/id_rsa.pub
```

---

#### Step 3 — Create Docker Hub account and repositories
```bash
# 1. Sign up at https://hub.docker.com (free)
# 2. Create 3 PUBLIC repositories:
#    - YOUR_USERNAME/taskflow-auth
#    - YOUR_USERNAME/taskflow-tasks
#    - YOUR_USERNAME/taskflow-frontend

# 3. Login to Docker Hub locally
docker login
# Username: YOUR_DOCKERHUB_USERNAME
# Password: YOUR_DOCKERHUB_PASSWORD
```

---

#### Step 4 — Configure Terraform variables
```bash
cd terraform/

cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
nano terraform.tfvars
```
```hcl
# Fill in your values:
aws_region         = "ap-south-1"
key_name           = "taskflow-key"
public_key_path    = "~/.ssh/id_rsa.pub"
dockerhub_username = "YOUR_DOCKERHUB_USERNAME"
```

---

#### Step 5 — Provision AWS EC2 instances with Terraform
```bash
# Still inside terraform/ directory
terraform init

terraform plan

terraform apply
# Type 'yes' when prompted

# Save the output IPs!
terraform output
# master_public_ip  = "x.x.x.x"
# worker1_public_ip = "x.x.x.x"
# worker2_public_ip = "x.x.x.x"
# app_url           = "http://x.x.x.x:30080"

cd ..
```

---

#### Step 6 — Update Ansible inventory with EC2 IPs
```bash
nano ansible/inventory.ini
```
```ini
# Replace these with YOUR actual terraform output IPs:
[master]
taskflow-master ansible_host=YOUR_MASTER_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa

[workers]
taskflow-worker1 ansible_host=YOUR_WORKER1_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
taskflow-worker2 ansible_host=YOUR_WORKER2_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/id_rsa
```

---

#### Step 7 — Test SSH connectivity to EC2 nodes
```bash
# Wait ~60 seconds after terraform apply for EC2 to fully boot
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_MASTER_IP "echo Connected to Master!"
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_WORKER1_IP "echo Connected to Worker1!"
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_WORKER2_IP "echo Connected to Worker2!"

# Test Ansible connectivity
ansible all -i ansible/inventory.ini -m ping
```

---

#### Step 8 — Install Kubernetes on all nodes (Ansible)
```bash
# This takes about 5–8 minutes
ansible-playbook -i ansible/inventory.ini ansible/install-k8s.yml
```

---

#### Step 9 — Initialize Kubernetes master node (Ansible)
```bash
ansible-playbook -i ansible/inventory.ini ansible/init-master.yml
```

---

#### Step 10 — Join worker nodes to the cluster (Ansible)
```bash
ansible-playbook -i ansible/inventory.ini ansible/join-workers.yml
```

---

#### Step 11 — Verify the Kubernetes cluster
```bash
# SSH into master node
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_MASTER_IP

# On the master node:
kubectl get nodes
# NAME               STATUS   ROLES           AGE
# taskflow-master    Ready    control-plane   5m
# taskflow-worker1   Ready    <none>          3m
# taskflow-worker2   Ready    <none>          3m

exit  # back to local machine
```

---

#### Step 12 — Build and push Docker images
```bash
# From the project root:
docker login

# Build auth-service
docker build -t YOUR_DOCKERHUB_USERNAME/taskflow-auth:latest ./auth-service/
docker push YOUR_DOCKERHUB_USERNAME/taskflow-auth:latest

# Build task-service
docker build -t YOUR_DOCKERHUB_USERNAME/taskflow-tasks:latest ./task-service/
docker push YOUR_DOCKERHUB_USERNAME/taskflow-tasks:latest

# Build frontend
docker build -t YOUR_DOCKERHUB_USERNAME/taskflow-frontend:latest ./frontend/
docker push YOUR_DOCKERHUB_USERNAME/taskflow-frontend:latest
```

---

#### Step 13 — Update K8s manifests with your Docker Hub username
```bash
# Replace placeholder in all deployment files
sed -i 's/YOUR_DOCKERHUB_USERNAME/YOUR_ACTUAL_USERNAME/g' k8s/auth-service.yaml
sed -i 's/YOUR_DOCKERHUB_USERNAME/YOUR_ACTUAL_USERNAME/g' k8s/task-service.yaml
sed -i 's/YOUR_DOCKERHUB_USERNAME/YOUR_ACTUAL_USERNAME/g' k8s/frontend.yaml
```

---

#### Step 14 — Update Kubernetes Secrets (production values)
```bash
chmod +x scripts/update-secrets.sh
./scripts/update-secrets.sh
# Enter your production DB password, JWT secret, etc.
```

---

#### Step 15 — Deploy the application to Kubernetes (Ansible)
```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy-app.yml \
    -e "dockerhub_username=YOUR_DOCKERHUB_USERNAME"
```

---

#### Step 16 — Verify the deployment
```bash
# SSH into master
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_MASTER_IP

# On master:
kubectl get pods -n taskflow          # All pods should be Running
kubectl get svc -n taskflow           # Check services
kubectl get deployments -n taskflow   # Check deployments

# Check logs of a specific service
kubectl logs -n taskflow deploy/auth-service
kubectl logs -n taskflow deploy/task-service
kubectl logs -n taskflow deploy/frontend

exit
```

---

#### Step 17 — Access the application
```
http://YOUR_MASTER_IP:30080
```

---

### PART C — CI/CD WITH JENKINS

---

#### Step 1 — Install Jenkins (on a separate EC2 or on master node)
```bash
# SSH into the server where you'll run Jenkins
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_SERVER_IP

# Run the setup script
bash /path/to/jenkins/setup-jenkins.sh

# Manually run these functions:
install_jenkins
install_docker
install_kubectl
```

#### Step 2 — Open Jenkins and complete setup
```
http://YOUR_JENKINS_SERVER_IP:8080
```
1. Enter initial admin password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
2. Install suggested plugins
3. Install additional plugins: **Docker Pipeline**, **GitHub plugin**, **Blue Ocean**

#### Step 3 — Add credentials in Jenkins
```
Manage Jenkins → Credentials → Global → Add Credential

1. dockerhub-username
   Type: Secret text
   ID:   dockerhub-username
   Value: YOUR_DOCKERHUB_USERNAME

2. dockerhub-credentials
   Type: Username with password
   ID:   dockerhub-credentials
   Username: YOUR_DOCKERHUB_USERNAME
   Password: YOUR_DOCKERHUB_PASSWORD

3. kubeconfig
   Type: Secret text
   ID:   kubeconfig
   Value: (paste contents of ~/.kube/config from master node)
   # Get it with: ssh ubuntu@MASTER_IP "cat ~/.kube/config"

4. github-token (optional, for private repos)
   Type: Secret text
   ID:   github-token
   Value: YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
```

#### Step 4 — Create Jenkins Pipeline job
```
New Item → Pipeline
Name: taskflow-pipeline

Pipeline → Definition: Pipeline script from SCM
SCM: Git
Repository URL: https://github.com/YOUR_USERNAME/taskflow.git
Branch: */main
Script Path: Jenkinsfile
```

#### Step 5 — Set up GitHub Webhook
```
GitHub repo → Settings → Webhooks → Add webhook
Payload URL: http://YOUR_JENKINS_IP:8080/github-webhook/
Content type: application/json
Events: Just the push event
```

#### Step 6 — Trigger the pipeline
```bash
# Push any code change to main branch
git add .
git commit -m "trigger: test CI/CD pipeline"
git push origin main

# Jenkins will automatically:
# 1. Pull the code
# 2. Run tests for both services
# 3. Build 3 Docker images (parallel)
# 4. Push to Docker Hub (parallel)
# 5. Deploy to Kubernetes
# 6. Verify deployment
```

---

## 🔧 Useful Commands Reference

### Docker Compose (Local)
```bash
docker compose up --build -d         # Start all services
docker compose down                  # Stop all services
docker compose ps                    # List containers
docker compose logs -f auth-service  # Tail logs
docker compose exec postgres psql -U taskflow_user -d taskflow  # DB shell
```

### Kubernetes
```bash
kubectl get pods -n taskflow                          # List pods
kubectl get svc -n taskflow                           # List services
kubectl logs -n taskflow deploy/auth-service -f       # Follow logs
kubectl describe pod -n taskflow <pod-name>           # Debug pod
kubectl exec -it -n taskflow <pod-name> -- sh         # Shell into pod
kubectl rollout restart deploy/auth-service -n taskflow  # Restart service
kubectl get hpa -n taskflow                           # Auto-scalers
```

### Terraform
```bash
terraform init      # Download providers
terraform plan      # Preview changes
terraform apply     # Apply changes
terraform destroy   # Destroy all resources (CAREFUL!)
terraform output    # Show output values
```

### Ansible
```bash
ansible all -i ansible/inventory.ini -m ping              # Test connectivity
ansible-playbook -i ansible/inventory.ini ansible/install-k8s.yml
ansible-playbook -i ansible/inventory.ini ansible/init-master.yml
ansible-playbook -i ansible/inventory.ini ansible/join-workers.yml
ansible-playbook -i ansible/inventory.ini ansible/deploy-app.yml \
    -e "dockerhub_username=YOUR_USERNAME"
```

---

## 🧹 Teardown (Save AWS Free Tier)

```bash
# Delete all K8s resources
kubectl delete namespace taskflow

# Destroy EC2 instances (IMPORTANT: avoid charges)
cd terraform/
terraform destroy
# Type 'yes' when prompted

# Verify all resources deleted in AWS Console
```

---

## 🏗️ DevOps Concepts Demonstrated

| Concept | Implementation |
|---|---|
| **Microservices** | auth-service and task-service are independently deployable |
| **Containerization** | Each service has a multi-stage Dockerfile |
| **Container Orchestration** | Kubernetes manages replicas, health checks, and rolling updates |
| **Infrastructure as Code** | Terraform provisions VPC + EC2 instances declaratively |
| **Configuration Management** | Ansible configures servers and installs K8s automatically |
| **CI/CD Pipeline** | Jenkins: test → build → push → deploy on every git push |
| **Rolling Deployments** | Kubernetes RollingUpdate strategy — zero downtime updates |
| **Auto-scaling** | HorizontalPodAutoscaler scales pods based on CPU usage |
| **Health Checks** | Liveness and readiness probes on all services |
| **Secrets Management** | Kubernetes Secrets keep passwords out of code |
| **Service Discovery** | Services communicate using DNS names (auth-service:3001) |
| **API Gateway** | Nginx routes frontend requests to correct microservice |
