pipeline{
    agent any
    stages {
        stage('Docker Nightly') {
            steps {
                git branch: 'main', url: 'https://github.com/The-Bds-Maneger/Bds-Maneger-Core.git'
                withCredentials([string(credentialsId: 'dockerlogin', variable: 'TOKEN')]) {
                    sh """
                        if ! (command -v docker);then
                            curl https://get.docker.com | sudo -E bash -
                        fi
                        sudo docker login -u sirherobrine23 -p ${TOKEN}
                        sudo docker buildx build --platform=linux/amd64,linux/arm/v7,linux/s390x,linux/ppc64le --push -t bdsmaneger/maneger:nightly .
                    """
                }
            }
        }
    }
}
