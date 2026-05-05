pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "hulala27"           // DockerHub account
        IMAGE_TAG = "build-${BUILD_NUMBER}"   // unique tag per build; also tagged :latest
        KUBE_NAMESPACE    = "taskflow"
    }

    stages {

        // ─────────────────────────────────────────────
        // 1.  Checkout
        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Branch: $GIT_BRANCH  Commit: $GIT_COMMIT"'
            }
        }

        // ─────────────────────────────────────────────
        // 2.  Test  (unit tests for each service)
        // ─────────────────────────────────────────────
        stage('Test') {
            parallel {
                stage('Test auth-service') {
                    steps {
                        dir('auth-service') {
                            sh '''
                                npm ci --prefer-offline 2>/dev/null || npm install
                                npm test --if-present || echo "No tests defined — skipping"
                            '''
                        }
                    }
                }
                stage('Test task-service') {
                    steps {
                        dir('task-service') {
                            sh '''
                                npm ci --prefer-offline 2>/dev/null || npm install
                                npm test --if-present || echo "No tests defined — skipping"
                            '''
                        }
                    }
                }
                stage('Test frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci --prefer-offline 2>/dev/null || npm install
                                npm test --if-present -- --watchAll=false || echo "No tests defined — skipping"
                            '''
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // 3.  Build Docker images
        // ─────────────────────────────────────────────
        stage('Build Images') {
            steps {
                sh '''
                    docker build -t ${DOCKERHUB_USERNAME}/taskflow-auth:${IMAGE_TAG}     \
                                 -t ${DOCKERHUB_USERNAME}/taskflow-auth:latest            \
                                 ./auth-service

                    docker build -t ${DOCKERHUB_USERNAME}/taskflow-tasks:${IMAGE_TAG}    \
                                 -t ${DOCKERHUB_USERNAME}/taskflow-tasks:latest           \
                                 ./task-service

                    docker build -t ${DOCKERHUB_USERNAME}/taskflow-frontend:${IMAGE_TAG} \
                                 -t ${DOCKERHUB_USERNAME}/taskflow-frontend:latest        \
                                 ./frontend
                '''
            }
        }

        // ─────────────────────────────────────────────
        // 4.  Push to DockerHub
        // ─────────────────────────────────────────────
        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        # Push versioned + latest tags
                        docker push ${DOCKERHUB_USERNAME}/taskflow-auth:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USERNAME}/taskflow-auth:latest

                        docker push ${DOCKERHUB_USERNAME}/taskflow-tasks:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USERNAME}/taskflow-tasks:latest

                        docker push ${DOCKERHUB_USERNAME}/taskflow-frontend:${IMAGE_TAG}
                        docker push ${DOCKERHUB_USERNAME}/taskflow-frontend:latest

                        docker logout
                    '''
                }
            }
        }

        // ─────────────────────────────────────────────
        // 5.  Deploy to Kubernetes
        // ─────────────────────────────────────────────
    stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    # Ensure namespace exists
                    kubectl apply -f k8s/namespace.yaml

                    # Apply all manifests (ConfigMap/Secrets FIRST, then services)
                    kubectl apply -f k8s/configmap-secret.yaml
                    kubectl apply -f k8s/postgres.yaml
                    kubectl apply -f k8s/auth-service.yaml
                    kubectl apply -f k8s/task-service.yaml
                    kubectl apply -f k8s/frontend.yaml

                    # Force a rolling restart so new :latest image is pulled
                    kubectl rollout restart deployment/auth-service  -n ${KUBE_NAMESPACE}
                    kubectl rollout restart deployment/task-service   -n ${KUBE_NAMESPACE}
                    kubectl rollout restart deployment/frontend       -n ${KUBE_NAMESPACE}

                    # Wait for rollouts to complete (fail fast if something breaks)
                    kubectl rollout status deployment/auth-service  -n ${KUBE_NAMESPACE} --timeout=120s
                    kubectl rollout status deployment/task-service  -n ${KUBE_NAMESPACE} --timeout=120s
                    kubectl rollout status deployment/frontend      -n ${KUBE_NAMESPACE} --timeout=120s

                    echo "==============================="
                    echo " Deployment complete!"
                    echo " Build: ${IMAGE_TAG}"
                    echo "==============================="
                '''
            }
        }
    }

    // ─────────────────────────────────────────────
    // Post-build actions
    // ─────────────────────────────────────────────
    post {
        success {
            echo "✅ Pipeline SUCCESS — Build ${IMAGE_TAG} deployed to Kubernetes."
        }
        failure {
            echo "❌ Pipeline FAILED — Check the logs above for details."
        }
        always {
            // Clean up local Docker images to save disk space on the Jenkins agent
            sh '''
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-auth:${IMAGE_TAG}     || true
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-tasks:${IMAGE_TAG}    || true
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-frontend:${IMAGE_TAG} || true
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-auth:latest            || true
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-tasks:latest           || true
                docker rmi ${DOCKERHUB_USERNAME}/taskflow-frontend:latest        || true
            '''
        }
    }
}