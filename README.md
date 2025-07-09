# 🛡️ Pandom Stack - Security-First Application Boilerplate

> **A complete boilerplate for modern web applications focused on security, with cookie-based authentication and GDPR compliance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17+-blue.svg)](https://www.postgresql.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Database Architecture](#database-architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Pandom Stack is a comprehensive, security-first application boilerplate that provides a complete foundation for building modern web applications. It features advanced security measures, cookie-based authentication, and GDPR compliance out of the box.

## ✨ Key Features

### 🔒 **Advanced Security**
- **Cookie-based Authentication** with httpOnly cookies
- **JWT tokens** managed securely on server-side
- **Role-based authorization** (RBAC)
- **Complete audit logging** for compliance
- **Configured security headers**
- **Rate limiting** and DDoS protection
- **Integrated GDPR compliance**
- **CSRF protection** with secure cookies

### 🏗️ **Modern Architecture**
- **NestJS backend** with TypeScript
- **Angular 17 frontend** with PWA
- **PostgreSQL database** with TypeORM
- **Complete Docker containerization**
- **Well-documented REST APIs**
- **Microservices ready**

### 📊 **Monitoring & Operations**
- **Automatic health checks**
- **Real-time metrics**
- **Structured logging**
- **Performance monitoring**

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 10+ with TypeScript
- **Database**: PostgreSQL 17+ with TypeORM
- **Authentication**: JWT with httpOnly cookies
- **Storage**: MinIO for file storage
- **Containerization**: Docker & Docker Compose

### Frontend
- **Framework**: Angular 17+ with TypeScript
- **PWA**: Progressive Web App capabilities
- **UI**: Modern, responsive design
- **Internationalization**: Multi-language support

## 🗄️ Database Architecture

### Core Database Components

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ PostgreSQL  │  │   MinIO     │                          │
│  │  Database   │  │   Storage   │                          │
│  └─────────────┘  └─────────────┘                          │
│         │                │                                 │
│   Relational Data   File Storage                           │
│   User Management   Document Storage                       │
│   Audit Logging     Media Files                            │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Overview

#### Core Tables
- **`auth_users`** - User authentication and account management
- **`user_profiles`** - Extended user profile data
- **`audit_logs`** - Security and activity logging
- **`sessions`** - User session management
- **`security_logs`** - Security event tracking

#### Key Database Features
- **UUID Primary Keys** for secure, globally unique identifiers
- **JSONB Data Types** for flexible schema evolution
- **PostgreSQL Arrays** for efficient tag storage
- **Automatic Timestamps** for audit trails
- **Foreign Key Constraints** for data integrity
- **Indexes** for optimal query performance

### Database Management
- **TypeORM Migrations** for schema versioning
- **Automated Seeding** for development data
- **Connection Pooling** with automatic retry
- **Backup Strategies** for data protection
- **Performance Monitoring** and optimization

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd pandom-stack

# Setup environment
cp demo.env .env
# Configure environment variables in .env

# Start the application
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:4200
# Backend: http://localhost:3000
# MinIO Console: http://localhost:9001
# PostgreSQL: localhost:5432
```

### Environment Configuration

Key environment variables:
```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=pandom_db
DATABASE_USERNAME=pandom_user
DATABASE_PASSWORD=secure_password

# Frontend Configuration
FE_URL=http://localhost:4200

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

## 📖 Documentation

### 🚀 **Getting Started**
- [**Application Overview**](./docs/overview.md) - General overview and architecture
- [**Installation Guide**](./docs/installation.md) - Complete setup step-by-step
- [**Environment Configuration**](./docs/configuration/environment-vars.md) - Environment variables and configurations

### 🏗️ **Architecture & Design**
- [**System Architecture**](./docs/architecture/system-architecture.md) - System architecture overview
- [**Database Design**](./docs/architecture/database-design.md) - Database schema and management

### 🔒 **Security & Compliance**
- [**Security Overview**](./docs/security/security-overview.md) - Security framework and features

### 🛠️ **Development & API**
- [**API Reference**](./docs/api/api-reference.md) - Complete API documentation
- [**Postman Collection**](./docs/api/pandom-postman-collection.json) - Complete Postman collection
- [**Postman Environment**](./docs/api/pandom-postman-environment.json) - Postman environment
- [**Postman Setup Guide**](./docs/api/postman-setup-guide.md) - Postman configuration guide

## 🤝 Contributing

This project is open source and accepts contributions! Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is released under the MIT license. See the [LICENSE](./LICENSE) file for details.

---