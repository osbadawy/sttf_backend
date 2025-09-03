# Simple single-stage Dockerfile for NestJS application
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 9229

# Start the application in debug mode
CMD ["npm", "run", "start:debug"]
