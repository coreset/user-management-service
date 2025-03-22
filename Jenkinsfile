pipeline {
    agent any 
    tools {
        nodejs 'node22' 
    }
    environment {
        SCANNER_HOME=tool 'sonar-scanner'
        DOCKER_IMAGE = 'devmius/user-management-service'
        CONTAINER_NAME = 'user-management-service'
        IMAGE_NAME = 'user-management-service'
        PORT = '3001'
    }

    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'dev', changelog: false, credentialsId: 'coreset_token', poll: false, url: 'https://github.com/coreset/user-management-service.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install -g yarn'
                sh 'yarn install --frozen-lockfile'
            }
        }
        stage('Run Lint & Tests') {
            steps {
                sh 'yarn lint'
                sh 'yarn test'
            }
        }
        stage('Build Application') {
            steps {
                sh 'yarn build'
            }
        }
        stage('OWASP Scan') {
            steps {
                dependencyCheck additionalArguments: '--scan ./ --exclude package-lock.json ', odcInstallation: 'DP'
                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }
        stage('Sonarqube') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh ''' 
                    $SCANNER_HOME/bin/sonar-scanner \
                    -Dsonar.projectName=User-Management-Service  \
                    -Dsonar.sources=src \
                    -Dsonar.projectKey=user-management-service 
                    '''
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script{
                    withDockerRegistry(credentialsId: 'docker_hub', toolName: 'docker') {
                        sh "docker build -t $IMAGE_NAME -f Dockerfile ."
                        sh "docker tag $IMAGE_NAME  $DOCKER_IMAGE:latest"
                        sh "docker push $DOCKER_IMAGE:latest"
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                script{
                    withDockerRegistry(credentialsId: 'docker_hub', toolName: 'docker') {
                        // Stop and remove any existing container with the same name
                        sh '''
                        if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
                            echo "Stopping and removing existing container..."
                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true
                        fi
                        '''
                        // Run the new container
                        sh "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:3000 $DOCKER_IMAGE:latest"
                    }
                }
            }
        }

    }
}
