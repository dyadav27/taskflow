#!/bin/bash
# ============================================================
# TaskFlow - deploy.sh
# One-shot deployment script
# Usage: ./scripts/deploy.sh <dockerhub_username>
# ============================================================

set -e   # Exit on any error

DOCKERHUB_USERNAME=${1:-"YOUR_DOCKERHUB_USERNAME"}
MASTER_IP=${2:-""}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC}   $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${BLUE}"
echo "  ████████╗ █████╗ ███████╗██╗  ██╗███████╗██╗      ██████╗ ██╗    ██╗"
echo "     ██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██║     ██╔═══██╗██║    ██║"
echo "     ██║   ███████║███████╗█████╔╝ █████╗  ██║     ██║   ██║██║ █╗ ██║"
echo "     ██║   ██╔══██║╚════██║██╔═██╗ ██╔══╝  ██║     ██║   ██║██║███╗██║"
echo "     ██║   ██║  ██║███████║██║  ██╗██║     ███████╗╚██████╔╝╚███╔███╔╝"
echo "     ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ "
echo -e "${NC}"
echo "  DevOps Microservices Project - Deployment Script"
echo "  DockerHub User: $DOCKERHUB_USERNAME"
echo "  ============================================================"

# ── Check Prerequisites ───────────────────────────────────────
check_prereqs() {
    log "Checking prerequisites..."
    for cmd in docker git ansible terraform; do
        if command -v $cmd &>/dev/null; then
            success "$cmd found"
        else
            error "$cmd is not installed. Please install it first."
        fi
    done
}

# ── Step 1: Provision AWS with Terraform ──────────────────────
provision_infra() {
    log "Step 1: Provisioning AWS EC2 instances with Terraform..."
    cd terraform/

    terraform init
    terraform plan -var="dockerhub_username=$DOCKERHUB_USERNAME" -out=tfplan
    terraform apply tfplan

    MASTER_IP=$(terraform output -raw master_public_ip)
    WORKER1_IP=$(terraform output -raw worker1_public_ip)
    WORKER2_IP=$(terraform output -raw worker2_public_ip)

    success "EC2 instances provisioned!"
    log "Master IP:  $MASTER_IP"
    log "Worker1 IP: $WORKER1_IP"
    log "Worker2 IP: $WORKER2_IP"

    # Update Ansible inventory with real IPs
    cd ../ansible
    sed -i "s/MASTER_PUBLIC_IP/$MASTER_IP/g" inventory.ini
    sed -i "s/WORKER1_PUBLIC_IP/$WORKER1_IP/g" inventory.ini
    sed -i "s/WORKER2_PUBLIC_IP/$WORKER2_IP/g" inventory.ini

    success "Ansible inventory updated with EC2 IPs"
    cd ..
}

# ── Step 2: Build & Push Docker Images ───────────────────────
build_and_push() {
    log "Step 2: Building and pushing Docker images..."

    docker login -u "$DOCKERHUB_USERNAME"

    for service in auth-service task-service frontend; do
        log "Building $service..."
        IMAGE_NAME="$DOCKERHUB_USERNAME/taskflow-${service//-service/}"
        [ "$service" = "task-service" ] && IMAGE_NAME="$DOCKERHUB_USERNAME/taskflow-tasks"
        [ "$service" = "auth-service" ] && IMAGE_NAME="$DOCKERHUB_USERNAME/taskflow-auth"
        [ "$service" = "frontend" ]     && IMAGE_NAME="$DOCKERHUB_USERNAME/taskflow-frontend"

        docker build -t "$IMAGE_NAME:latest" "./$service/"
        docker push "$IMAGE_NAME:latest"
        success "$service image pushed: $IMAGE_NAME:latest"
    done
}

# ── Step 3: Configure Kubernetes with Ansible ─────────────────
configure_cluster() {
    log "Step 3: Waiting 60s for EC2 instances to boot..."
    sleep 60

    log "Running Ansible: Install Kubernetes on all nodes..."
    ansible-playbook -i ansible/inventory.ini ansible/install-k8s.yml

    log "Running Ansible: Initialize master node..."
    ansible-playbook -i ansible/inventory.ini ansible/init-master.yml

    log "Running Ansible: Join worker nodes..."
    ansible-playbook -i ansible/inventory.ini ansible/join-workers.yml

    success "Kubernetes cluster is ready!"
}

# ── Step 4: Deploy App ────────────────────────────────────────
deploy_app() {
    log "Step 4: Deploying TaskFlow to Kubernetes..."

    # Update k8s manifests with Docker Hub username
    for f in k8s/auth-service.yaml k8s/task-service.yaml k8s/frontend.yaml; do
        sed -i "s/YOUR_DOCKERHUB_USERNAME/$DOCKERHUB_USERNAME/g" "$f"
    done

    ansible-playbook -i ansible/inventory.ini ansible/deploy-app.yml \
        -e "dockerhub_username=$DOCKERHUB_USERNAME"

    success "Application deployed!"
}

# ── Final Summary ─────────────────────────────────────────────
print_summary() {
    MASTER_IP=$(cd terraform && terraform output -raw master_public_ip 2>/dev/null || echo "CHECK_TERRAFORM_OUTPUT")
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN} DEPLOYMENT COMPLETE!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo -e "  App URL:      ${YELLOW}http://$MASTER_IP:30080${NC}"
    echo -e "  Auth Service: http://$MASTER_IP:30080/api/auth/health"
    echo -e "  Task Service: http://$MASTER_IP:30080/api/tasks/health (needs token)"
    echo ""
    echo -e "  SSH Master:   ssh -i ~/.ssh/id_rsa ubuntu@$MASTER_IP"
    echo ""
    echo -e "  To view pods:       kubectl get pods -n taskflow"
    echo -e "  To view logs:       kubectl logs -n taskflow deploy/auth-service"
    echo -e "${GREEN}============================================================${NC}"
}

# ── Main ──────────────────────────────────────────────────────
main() {
    check_prereqs
    provision_infra
    build_and_push
    configure_cluster
    deploy_app
    print_summary
}

main
