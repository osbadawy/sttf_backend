#!/bin/bash

# AWS ECR deployment script
set -e

# Load environment variables from .env file (only ECR-related vars to avoid multi-line issues)
if [ -f .env ]; then
    set -a
    source <(grep -E '^ECR_|^AWS_REGION' .env)
    set +a
fi

# Configuration - use environment variables
ECR_REGISTRY="${ECR_REGISTRY}"
IMAGE_NAME="${ECR_IMAGE_NAME}"
IMAGE_TAG="${ECR_IMAGE_TAG}"
AWS_REGION="${AWS_REGION}"

# Full image name
FULL_IMAGE_NAME="${ECR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🚀 Starting deployment to ECR..."
echo "Registry: ${ECR_REGISTRY}"
echo "Image: ${FULL_IMAGE_NAME}"

# Step 1: Build the application
echo "🔨 Building the application..."
npm run build

# Step 2: Login to ECR
echo "📦 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Step 3: Build the Docker image
echo "🔨 Building Docker image..."
docker build -f Dockerfile.deploy -t ${FULL_IMAGE_NAME} .

# Step 4: Push the image to ECR
echo "⬆️  Pushing image to ECR..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Successfully pushed ${FULL_IMAGE_NAME}"
echo "🎉 Deployment complete!"

