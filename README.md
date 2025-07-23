# Campus T - Learning Management System

<div align="center">

[Overview](#overview) | 
[Technology Stack](#technology-stack) | 
[Project Structure](#project-structure) | 
[Setup & Installation](#setup-and-installation) | 
[Features](#features) | 
[Development](#development-guidelines) | 
[Deployment](#deployment)

</div>

---

## Overview

Campus T is a comprehensive learning management system designed to facilitate online education by connecting students, teachers, and administrators through specialized interfaces. The platform supports course management, content delivery, student progress tracking, and administrative functions in an integrated ecosystem.

[Back to top](#campus-t---learning-management-system)

---

## Technology Stack

- **Frontend**: React.js, Material-UI, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: SQL Server
- **Authentication**: JWT
- **Code Execution**: Judge0 API
- **Container Technology**: Docker
- **IDE Integration**: Code Server (VS Code in browser)
- **Real-time Communication**: Socket.io

[Back to top](#campus-t---learning-management-system)

---

## Project Structure

### Frontend Applications

The project includes multiple specialized frontend applications:

- [User App](frontend/user-app/README.md) - Main application for regular users/students
- [User SinhvienApp](frontend/user-sinhvienapp/README.md) - Specialized student application for Vietnamese university students
- [Teacher App](frontend/teacher-app/README.md) - Application for teachers/instructors
- [Admin App](frontend/admin-app/README.md) - Administration interface for system management
- [Admin SinhvienApp](frontend/admin-sinhvienapp/README.md) - Specialized administration interface for student management

### Backend Services

The backend architecture consists of several specialized services:

- [User Service](services/user-service/README.md) - Core services for regular users/students
- [User Sinhvienservice](services/user-sinhvienservice/README.md) - Specialized services for Vietnamese university students
- [Teacher Service](services/teacher-service/README.md) - Services supporting teacher functionality
- [Admin Service](services/admin-service/README.md) - Services for administrative functions
- [Admin Sinhvienservice](services/admin-sinhvienservice/README.md) - Specialized services for student administration
- [Judge0 Master](services/judge0-master/README.md) - Code execution and evaluation service
- [Code Server](services/code-server/README.md) - In-browser IDE for coding exercises

[Back to top](#campus-t---learning-management-system)

---

## Setup and Installation

<div align="center">

[Prerequisites](#prerequisites) | 
[Frontend Setup](#frontend-setup) | 
[Backend Setup](#backend-setup) | 
[Judge0 and Code Server Setup](#judge0-and-code-server-setup)

</div>

### Prerequisites

- Node.js (v14+)
- Docker and Docker Compose
- SQL Server instance
- Git

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/campust.git
   cd campust/frontend
   ```

2. Install dependencies for each application:
   ```bash
   cd user-app
   npm install
   # Repeat for other frontend applications
   ```

3. Configure environment variables:
   - Create `.env` file in each application directory
   - Set API endpoints, authentication keys, and other configuration

4. Start development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to services directory:
   ```bash
   cd campust/services
   ```

2. Install dependencies for each service:
   ```bash
   cd user-service
   npm install
   # Repeat for other services
   ```

3. Configure environment variables:
   - Create `.env` file in each service directory
   - Set database connection, JWT secrets, and other configuration

4. Initialize database:
   - Run migration scripts provided in each service's `/migrations` folder
   - Seed initial data if needed

5. Start services:
   ```bash
   npm run start
   # Or using Docker Compose
   docker-compose up
   ```

### Judge0 and Code Server Setup

1. Configure Judge0:
   ```bash
   cd services/judge0-master
   docker-compose up -d
   ```

2. Configure Code Server:
   ```bash
   cd services/code-server
   docker-compose up -d
   ```

[Back to top](#campus-t---learning-management-system)

---

## Features

The Campus T platform offers numerous features across its various applications and services:

- **Course Management System**: Create, organize, and deliver educational content
- **User Authentication**: Secure JWT-based authentication and role-based access control
- **Payment Integration**: Support for multiple payment gateways
- **Preview Lessons**: Allow unregistered users to preview course content
- **Code Execution**: Secure Docker-based code execution in various programming languages
- **In-browser IDE**: Integrated development environment for coding exercises
- **Social Features**: User profiles, posts, and connections
- **Competition System**: Coding competitions with timed challenges
- **Educational Support**: Learning roadmaps and AI-assisted learning

For more detailed information about specific features, please refer to the READMEs of individual applications and services.

[Back to top](#campus-t---learning-management-system)

---

## Development Guidelines

<div align="center">

[Code Style](#code-style-and-standards) | 
[Git Workflow](#git-workflow) | 
[API Documentation](#api-documentation) | 
[Testing](#testing-guidelines)

</div>

### Code Style and Standards

- Follow Airbnb JavaScript Style Guide
- Use ESLint for code linting
- Implement TypeScript for type checking where possible
- Follow component-based architecture for frontend applications
- Implement service-oriented architecture for backend services

[Back to Development Guidelines](#development-guidelines)

---

### Git Workflow

1. Create feature branches from `develop` branch
2. Use conventional commit messages
3. Submit pull requests for code review
4. Merge to `develop` after approval
5. Release to `main/master` branch for production

[Back to Development Guidelines](#development-guidelines)

---

### API Documentation

- All APIs should be documented using Swagger/OpenAPI
- Documentation endpoints available at `/api-docs` for each service
- Maintain API version control and backward compatibility

[Back to Development Guidelines](#development-guidelines)

---

### Testing Guidelines

- Write unit tests for critical functions
- Implement integration tests for API endpoints
- Maintain minimum 70% code coverage
- Use Jest for JavaScript/TypeScript testing
- Implement E2E tests using Cypress

[Back to Development Guidelines](#development-guidelines) | [Back to top](#campus-t---learning-management-system)

---

## Deployment

<div align="center">

[Development Environment](#development-environment) | 
[Staging Environment](#staging-environment) | 
[Production](#production-deployment) | 
[Infrastructure](#infrastructure)

</div>

### Development Environment

- Deployed to development servers using Docker
- Continuous Integration with GitHub Actions
- Automated testing on pull requests

[Back to Deployment](#deployment)

---

### Staging Environment

- Deployed after successful merges to `develop` branch
- Full integration testing
- UAT (User Acceptance Testing) environment

[Back to Deployment](#deployment)

---

### Production Deployment

1. Create release branch from `develop`
2. Deploy to production servers using Docker Compose or Kubernetes
3. Implement blue-green deployment strategy for zero downtime
4. Monitor application performance using monitoring tools
5. Automated rollback procedures in place for failed deployments

[Back to Deployment](#deployment)

---

### Infrastructure

- Containerized using Docker
- Load balanced across multiple instances
- Database replication and backups
- CDN integration for static assets
- Automated scaling based on usage metrics

[Back to Deployment](#deployment) | [Back to top](#campus-t---learning-management-system)

---

## Monitoring and Maintenance

- Application monitoring using Prometheus and Grafana
- Error tracking with Sentry
- Regular database maintenance and optimization
- Security patches and updates
- Performance optimization and load testing

[Back to top](#campus-t---learning-management-system)

---

## License

© 2023 Campus T. All rights reserved.

## Contact

For more information, contact the development team at dev@campust.com

[Back to top](#campus-t---learning-management-system)
