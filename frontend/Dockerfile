# Frontend Dockerfile - Multi-stage build
FROM node:20-slim AS base

# Set working directory
WORKDIR /frontend

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g @angular/cli@19.2.10

# Development stage
FROM base AS development

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start development server
CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--poll", "2000"]

# Production build stage
FROM base AS production

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN ng build --configuration production

# Serve stage
FROM nginx:alpine AS serve

# Copy built application
COPY --from=production /frontend/dist/* /usr/share/nginx/html/

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]