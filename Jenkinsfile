pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = "hulala27"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                docker build -t hulala27/taskflow-auth:latest ./auth-service
                docker build -t hulala27/taskflow-tasks:latest ./task-service
                docker build -t hulala27/taskflow-frontend:latest ./frontend
                '''
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh '''
                    echo $PASS | docker login -u $USER --password-stdin

                    docker push hulala27/taskflow-auth:latest
                    docker push hulala27/taskflow-tasks:latest
                    docker push hulala27/taskflow-frontend:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                kubectl apply -f k8s/
                '''
            }
        }
    }
}