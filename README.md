# Campus T - Learning Management System

<div align="center">

[Overview](#overview) | 
[Technology Stack](#technology-stack) | 
[Frontend Applications](#frontend-applications) | 
[Backend Services](#backend-services) | 
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

## Frontend Applications

<div align="center">

[User App](#user-app) | 
[Student App](#user-sinhvienapp) | 
[Teacher App](#teacher-app) | 
[Admin App](#admin-app) | 
[Student Admin App](#admin-sinhvienapp)

</div>

### User App

**Main application for regular users/students**

- **Features**:
  - Course browsing and learning
  - Progress tracking
  - Social features (posts, stories, friends)
  - Payments integration
  - Event participation
  - AI chat assistance
  - Competitions and coding challenges
  - Exams and assessments
  - Roadmaps for learning paths

- **Key Pages**:
  - Home, Courses, CourseDetail, CourseLearning
  - Profile, Friends, Posts
  - Payments, PaymentResult
  - Exams, Competitions
  - Chat, AIChat
  - Notifications, Ranking
  - Settings, Support

[Back to Frontend Applications](#frontend-applications)

---

### User Sinhvienapp

**Specialized student application for Vietnamese university students**

- **Features**:
  - Academic record management
  - Schedule viewing
  - Tuition payment
  - Registration for courses and exams
  - Academic results tracking
  - Student services

- **Key Pages**:
  - Dashboard
  - Academic
  - Schedule
  - Tuition
  - Results
  - Registration
  - Services

[Back to Frontend Applications](#frontend-applications)

---

### Teacher App

**Application for teachers/instructors**

- **Features**:
  - Course creation and management
  - Module and lesson editing
  - Student performance tracking
  - Assignment management and grading
  - Dashboard with analytics
  - Notifications system

- **Key Pages**:
  - DashboardPage
  - CoursesPage, CourseDetailPage, CourseEditPage
  - ModuleDetailPage
  - LessonDetailPage, LessonEditPage
  - AssignmentsPage, AssignmentDetailPage
  - StudentsPage, StudentDetailPage
  - ProfilePage

[Back to Frontend Applications](#frontend-applications)

---

### Admin App

**Administration interface for system management**

- **Features**:
  - User management across all roles
  - Course approvals and moderation
  - System configuration
  - Reporting and analytics

[Back to Frontend Applications](#frontend-applications)

---

### Admin Sinhvienapp

**Specialized administration interface for student management**

- **Features**:
  - Student record management
  - Academic program administration
  - Specialized reporting for educational institutions

[Back to Frontend Applications](#frontend-applications) | [Back to top](#campus-t---learning-management-system)

---

## Backend Services

<div align="center">

[User Service](#user-service) | 
[Student Service](#user-sinhvienservice) | 
[Teacher Service](#teacher-service) | 
[Admin Service](#admin-service) | 
[Student Admin Service](#admin-sinhvienservice) | 
[Judge0](#judge0-master) | 
[Code Server](#code-server)

</div>

### User Service

**Core services for regular users/students**

- **API Endpoints**:
  - Authentication (login, register, password reset)
  - Course browsing and enrollment
  - Lesson progress tracking
  - Payment processing (VNPay, PayPal)
  - Social features (posts, friends, stories)
  - Notifications
  - Chat functionality

- **Key Controllers**:
  - authController - User authentication
  - courseController - Course management and access
  - lessonController - Lesson content and progress
  - paymentController - Payment processing
  - socialController - Social interactions

[Back to Backend Services](#backend-services)

---

### User Sinhvienservice

**Specialized services for Vietnamese university students**

- **Features**:
  - Academic record management
  - Course registration
  - Grade tracking
  - Tuition payment processing
  - Student information management

[Back to Backend Services](#backend-services)

---

### Teacher Service

**Services supporting teacher functionality**

- **Features**:
  - Course and content management
  - Assignment creation and grading
  - Student performance analytics
  - Communication with students

[Back to Backend Services](#backend-services)

---

### Admin Service

**Services for administrative functions**

- **Features**:
  - User account management
  - System configuration
  - Content moderation
  - Analytics and reporting

[Back to Backend Services](#backend-services)

---

### Admin Sinhvienservice

**Specialized services for student administration**

- **Features**:
  - Academic program management
  - Student record administration
  - Reporting for educational institutions

[Back to Backend Services](#backend-services)

---

### Judge0 Master

**Code execution and evaluation service**

- **Features**:
  - Secure code execution in isolated environments
  - Support for multiple programming languages
  - Test case validation
  - Performance analysis for code submissions
  - Integration with coding challenges and assignments
  - Configuration via judge0.conf
  - Dockerized for security and scalability

[Back to Backend Services](#backend-services)

---

### Code Server

**In-browser IDE for coding exercises**

- **Features**:
  - VS Code interface in the browser
  - Syntax highlighting
  - Extensions support
  - Integration with judge0 for code execution
  - Real-time collaboration features

[Back to Backend Services](#backend-services) | [Back to top](#campus-t---learning-management-system)

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

<div align="center">

[Course Management](#course-management-system) | 
[Authentication](#user-authentication-and-authorization) | 
[Payment](#payment-integration) | 
[Preview Lessons](#preview-lessons) | 
[Code Execution](#code-execution-and-ide-integration) | 
[Social Features](#social-features) | 
[Competition System](#competition-system) | 
[Educational Support](#educational-support)

</div>

### Course Management System

- Course creation and publishing workflow
- Module and lesson organization
- Content types: video, text, quiz, coding exercises
- Preview lessons for marketing
- Progress tracking
- Enrollment and payment processing

[Back to Features](#features)

---

### User Authentication and Authorization

- JWT-based authentication
- Role-based access control
- Password reset functionality
- Social login options

[Back to Features](#features)

---

### Payment Integration

- Multiple payment gateways:
  - VNPay integration for Vietnamese users
  - PayPal for international payments
- Transaction history tracking
- Payment verification
- Course enrollment activation

[Back to Features](#features)

---

### Preview Lessons

The system supports preview functionality allowing unregistered users to access the first 3 lessons of each module to evaluate course content before registration.

#### Preview Implementation Details:

1. **Frontend Changes**:
   - Updated `CourseLearning.jsx` to display preview mode and notifications
   - Added API `getCourseContent` to handle preview lessons
   - Implemented visual indicators and CTA buttons for course registration
   - Added preview status checks in the lesson renderer

2. **Backend Changes**:
   - Updated `getCourseContent` controller to allow unregistered users to access preview lessons
   - Modified authentication middleware to support preview mode
   - Created SQL script (`update_preview_lessons.sql`) to update preview status for the first 3 lessons of each module
   - Added preview status field to lesson schema

#### Applying SQL Script:

1. Connect to SQL Server and select the application database:
   ```sql
   USE CampusTDatabase;
   ```

2. Run the script in `update_preview_lessons.sql`:
   ```sql
   -- Example of what the script contains
   UPDATE Lessons
   SET IsPreview = 1
   WHERE LessonOrder <= 3
   AND ModuleID IN (SELECT ID FROM Modules);
   ```

3. Verify successful updates through the SELECT statement included in the script:
   ```sql
   SELECT ModuleID, COUNT(ID) as PreviewLessons
   FROM Lessons
   WHERE IsPreview = 1
   GROUP BY ModuleID;
   ```

#### Additional Notes:

- Unregistered users can view the first 3 lessons of each module
- Clear notifications indicate preview mode with course registration buttons
- Preview lessons are marked with "Xem trước" (Preview) labels for easy identification
- Access restrictions are enforced for non-preview content

[Back to Features](#features)

---

### Code Execution and IDE Integration

- In-browser code execution with Judge0
- Support for multiple programming languages
- Automated test case validation
- Integrated VS Code environment
- Code sharing and collaboration

[Back to Features](#features)

---

### Social Features

- User profiles and connections
- Posts and stories sharing
- Friend management
- Chat functionality
- Notifications system

[Back to Features](#features)

---

### Competition System

- Coding competitions with timed challenges
- Multiple problem difficulties
- Real-time leaderboard
- Submission history and analysis

[Back to Features](#features)

---

### Educational Support

- Learning roadmaps
- AI-assisted learning via chat interface
- Progress tracking and analytics
- Exam preparation and practice

[Back to Features](#features) | [Back to top](#campus-t---learning-management-system)

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
