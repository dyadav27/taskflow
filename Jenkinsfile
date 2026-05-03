// ============================================================
// TaskFlow - Jenkinsfile
// Complete CI/CD Pipeline:
//   1. Checkout code from GitHub
//   2. Run tests for both microservices
//   3. Build Docker images
//   4. Push images to Docker Hub
//   5. Deploy to Kubernetes cluster via kubectl
// ============================================================

pipeline {
    agent any

    // ── Environment Variables ───────────────────────────────
    environment {
        DOCKERHUB_USERNAME    = credentials('dockerhub-username')
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        KUBE_CONFIG           = credentials('kubeconfig')
        // IMAGE_TAG is set in the Checkout stage after git is available
        AUTH_IMAGE    = "${DOCKERHUB_USERNAME}/taskflow-auth"
        TASK_IMAGE    = "${DOCKERHUB_USERNAME}/taskflow-tasks"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/taskflow-frontend"
    }

    // ── Pipeline Options ────────────────────────────────────
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    // ── Trigger: Build on push to main or develop ───────────
    triggers {
        githubPush()
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
                sh 'git log --oneline -5'
                script {
                    // Set IMAGE_TAG here, after checkout, so git is available
                    env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.GIT_COMMIT_SHORT}-${BUILD_NUMBER}"
                    echo "Image tag will be: ${env.IMAGE_TAG}"
                }
            }
        }

        // ── Stage 2: Test Auth Service ────────────────────
        stage('Test: Auth Service') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                    args '-u root'
                }
            }
            steps {
                dir('auth-service') {
                    echo "Installing dependencies for auth-service..."
                    sh 'npm ci'
                    echo "Running auth-service tests..."
                    sh 'npm test -- --ci --forceExit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'auth-service/junit.xml'
                }
            }
        }

        // ── Stage 3: Test Task Service ────────────────────
        stage('Test: Task Service') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                    args '-u root'
                }
            }
            steps {
                dir('task-service') {
                    echo "Installing dependencies for task-service..."
                    sh 'npm ci'
                    echo "Running task-service tests..."
                    sh 'npm test -- --ci --forceExit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'task-service/junit.xml'
                }
            }
        }

        // ── Stage 4: Build Docker Images ──────────────────
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images with tag: ${IMAGE_TAG}"
                parallel(
                    "Build Auth Service": {
                        dir('auth-service') {
                            sh """
                                docker build -t ${AUTH_IMAGE}:${IMAGE_TAG} .
                                docker tag ${AUTH_IMAGE}:${IMAGE_TAG} ${AUTH_IMAGE}:latest
                            """
                        }
                    },
                    "Build Task Service": {
                        dir('task-service') {
                            sh """
                                docker build -t ${TASK_IMAGE}:${IMAGE_TAG} .
                                docker tag ${TASK_IMAGE}:${IMAGE_TAG} ${TASK_IMAGE}:latest
                            """
                        }
                    },
                    "Build Frontend": {
                        dir('frontend') {
                            sh """
                                docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} .
                                docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest
                            """
                        }
                    }
                )
            }
        }

        // ── Stage 5: Push to Docker Hub ───────────────────
        stage('Push to Docker Hub') {
            steps {
                echo "Pushing images to Docker Hub..."
                sh """
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                """
                parallel(
                    "Push Auth Service": {
                        sh """
                            docker push ${AUTH_IMAGE}:${IMAGE_TAG}
                            docker push ${AUTH_IMAGE}:latest
                        """
                    },
                    "Push Task Service": {
                        sh """
                            docker push ${TASK_IMAGE}:${IMAGE_TAG}
                            docker push ${TASK_IMAGE}:latest
                        """
                    },
                    "Push Frontend": {
                        sh """
                            docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                            docker push ${FRONTEND_IMAGE}:latest
                        """
                    }
                )
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }

        // ── Stage 6: Deploy to Kubernetes ─────────────────
        stage('Deploy to Kubernetes') {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying to Kubernetes cluster..."
                script {
                    // writeFile is safe for multiline kubeconfig content
                    sh "mkdir -p ${env.HOME}/.kube"
                    writeFile file: "${env.HOME}/.kube/config", text: env.KUBE_CONFIG
                    sh "chmod 600 ${env.HOME}/.kube/config"
                }
                sh """
                    # Update images with the new versioned tag
                    kubectl set image deployment/auth-service \
                        auth-service=${AUTH_IMAGE}:${IMAGE_TAG} \
                        -n taskflow

                    kubectl set image deployment/task-service \
                        task-service=${TASK_IMAGE}:${IMAGE_TAG} \
                        -n taskflow

                    kubectl set image deployment/frontend \
                        frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} \
                        -n taskflow
                """
                sh """
                    # Wait for rolling updates to complete
                    kubectl rollout status deployment/auth-service -n taskflow --timeout=180s
                    kubectl rollout status deployment/task-service -n taskflow --timeout=180s
                    kubectl rollout status deployment/frontend -n taskflow --timeout=180s
                """
                echo "Deployment successful!"
            }
        }

        // ── Stage 7: Verify Deployment ────────────────────
        stage('Verify Deployment') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    echo "=== Pod Status ==="
                    kubectl get pods -n taskflow -o wide

                    echo "=== Services ==="
                    kubectl get svc -n taskflow

                    echo "=== Deployments ==="
                    kubectl get deployments -n taskflow
                """
            }
        }
    }

    // ── Post Actions ────────────────────────────────────────
    post {
        success {
            echo """
            ============================================
             BUILD SUCCESSFUL
             Image Tag: ${IMAGE_TAG}
             App URL: http://MASTER_NODE_IP:30080
            ============================================
            """
        }
        failure {
            echo """
            ============================================
             BUILD FAILED - Check logs above
            ============================================
            """
            // Clean up failed images only if IMAGE_TAG was set (i.e. checkout succeeded)
            script {
                if (env.IMAGE_TAG) {
                    sh """
                        docker rmi ${AUTH_IMAGE}:${env.IMAGE_TAG} || true
                        docker rmi ${TASK_IMAGE}:${env.IMAGE_TAG} || true
                        docker rmi ${FRONTEND_IMAGE}:${env.IMAGE_TAG} || true
                    """
                }
            }
        }
        always {
            echo "Cleaning up workspace and local kubeconfig..."
            sh """
                docker image prune -f || true
                rm -f ${env.HOME}/.kube/config || true
            """
        }
    }
}
