#!/bin/bash
# ============================================================
# TaskFlow - Jenkins Setup Script
# Run this on your Jenkins server to install required plugins
# and configure credentials
# ============================================================

echo "=========================================="
echo " TaskFlow Jenkins Setup"
echo "=========================================="

# Install Jenkins (Ubuntu/Debian)
install_jenkins() {
    echo "[1/5] Installing Java..."
    sudo apt-get update -y
    sudo apt-get install -y fontconfig openjdk-17-jre

    echo "[2/5] Adding Jenkins repository..."
    sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
        https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
    echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
        https://pkg.jenkins.io/debian-stable binary/" | \
        sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

    echo "[3/5] Installing Jenkins..."
    sudo apt-get update -y
    sudo apt-get install -y jenkins

    echo "[4/5] Starting Jenkins..."
    sudo systemctl enable jenkins
    sudo systemctl start jenkins

    echo "[5/5] Jenkins started. Initial admin password:"
    sudo cat /var/lib/jenkins/secrets/initialAdminPassword
    echo ""
    echo "Open http://YOUR_SERVER_IP:8080 to complete setup"
}

# Install Docker on Jenkins server
install_docker() {
    echo "Installing Docker for Jenkins..."
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    # Add jenkins user to docker group so Jenkins can run docker commands
    sudo usermod -aG docker jenkins
    sudo systemctl restart jenkins
    echo "Docker installed. Jenkins user added to docker group."
}

# Install kubectl on Jenkins server
install_kubectl() {
    echo "Installing kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    kubectl version --client
    echo "kubectl installed."
}

echo "Run the following functions in order:"
echo "  1. install_jenkins"
echo "  2. install_docker"
echo "  3. install_kubectl"
echo ""
echo "Then add these credentials in Jenkins (Manage Jenkins > Credentials):"
echo "  ID: dockerhub-username     | Type: Secret text    | Value: your DockerHub username"
echo "  ID: dockerhub-credentials  | Type: Username+Pass  | Value: DockerHub login"
echo "  ID: kubeconfig             | Type: Secret text    | Value: contents of ~/.kube/config from master node"
echo ""
echo "Required Jenkins Plugins (install via Plugin Manager):"
echo "  - Git plugin"
echo "  - GitHub plugin"
echo "  - Docker Pipeline"
echo "  - Pipeline"
echo "  - JUnit"
echo "  - Blue Ocean (optional, nice UI)"

# Uncomment to run automatically:
# install_jenkins
# install_docker
# install_kubectl
