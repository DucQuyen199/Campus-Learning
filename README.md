# Campus T - Learning Management System

## Project Overview

Campus T is a comprehensive learning management system designed to facilitate online education by connecting students, teachers, and administrators through specialized interfaces. The platform supports course management, content delivery, student progress tracking, and administrative functions in an integrated ecosystem.

## Technology Stack

- **Frontend**: React.js, Next.js
- **Backend**: Node.js, Express
- **Database**: SQL Server
- **Authentication**: JWT
- **Code Execution**: Judge0 API
- **Container Technology**: Docker
- **IDE Integration**: Code Server (VS Code in browser)

## Project Structure

### Frontend Applications

- **user-app**: 
  - Main application for regular users/students
  - Features: Course browsing, lesson viewing, progress tracking, assessments
  - Tech stack: React.js with material-UI

- **user-sinhvienapp**: 
  - Specialized student application with enhanced features
  - Additional capabilities: Academic records, specialized coursework, student services
  - Tech stack: React.js with custom components

- **teacher-app**: 
  - Application for teachers/instructors
  - Features: Course creation, content management, student performance analytics, grading
  - Tech stack: React.js with data visualization libraries

- **admin-app**: 
  - Administration interface for system management
  - Features: User management, course approvals, system configuration, reporting
  - Tech stack: React.js with advanced admin components

- **admin-sinhvienapp**: 
  - Specialized administration interface for student management
  - Features: Student record management, academic program administration, specialized reporting
  - Tech stack: React.js with role-based access controls

### Backend Services

- **user-service**: 
  - Core services for regular users/students
  - APIs: Authentication, course access, progress tracking, assessments
  - Tech stack: Node.js, Express, SQL Server integration

- **user-sinhvienservice**: 
  - Specialized services for students
  - APIs: Academic records, specialized course access, student-specific functions
  - Tech stack: Node.js, Express, SQL Server with student data models

- **teacher-service**: 
  - Services supporting teacher functionality
  - APIs: Course management, content upload, grade processing, analytics
  - Tech stack: Node.js, Express, content management integrations

- **admin-service**: 
  - Services for administrative functions
  - APIs: User management, system configuration, reporting
  - Tech stack: Node.js, Express, advanced database operations

- **admin-sinhvienservice**: 
  - Specialized services for student administration
  - APIs: Student record management, program management, academic reporting
  - Tech stack: Node.js, Express, specialized student data operations

- **judge0-master**: 
  - Code execution and evaluation service
  - Features: Secure code execution, test case validation, performance analysis
  - Tech stack: Judge0 API, Docker containers

- **code-server**: 
  - In-browser IDE for coding exercises
  - Features: VS Code in browser, syntax highlighting, extensions support
  - Tech stack: Code-Server, Docker

## Setup and Installation

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

## Features

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

### Other Key Features

- **Course Management**: Create, update, and manage courses and modules
- **User Authentication**: Secure JWT-based authentication and authorization
- **Progress Tracking**: Track and display user progress through courses
- **Assessment System**: Quizzes, assignments, and coding challenges
- **Code Execution**: In-browser code execution with Judge0
- **Integrated IDE**: Browser-based coding environment
- **Analytics Dashboard**: Performance metrics for students and instructors

## Development Guidelines

### Code Style and Standards

- Follow Airbnb JavaScript Style Guide
- Use ESLint for code linting
- Implement TypeScript for type checking where possible
- Follow component-based architecture for frontend applications
- Implement service-oriented architecture for backend services

### Git Workflow

1. Create feature branches from `develop` branch
2. Use conventional commit messages
3. Submit pull requests for code review
4. Merge to `develop` after approval
5. Release to `main/master` branch for production

### API Documentation

- All APIs should be documented using Swagger/OpenAPI
- Documentation endpoints available at `/api-docs` for each service
- Maintain API version control and backward compatibility

### Testing Guidelines

- Write unit tests for critical functions
- Implement integration tests for API endpoints
- Maintain minimum 70% code coverage
- Use Jest for JavaScript/TypeScript testing
- Implement E2E tests using Cypress

## Deployment

### Development Environment

- Deployed to development servers using Docker
- Continuous Integration with GitHub Actions
- Automated testing on pull requests

### Staging Environment

- Deployed after successful merges to `develop` branch
- Full integration testing
- UAT (User Acceptance Testing) environment

### Production Deployment

1. Create release branch from `develop`
2. Deploy to production servers using Docker Compose or Kubernetes
3. Implement blue-green deployment strategy for zero downtime
4. Monitor application performance using monitoring tools
5. Automated rollback procedures in place for failed deployments

### Infrastructure

- Containerized using Docker
- Load balanced across multiple instances
- Database replication and backups
- CDN integration for static assets
- Automated scaling based on usage metrics

## Monitoring and Maintenance

- Application monitoring using Prometheus and Grafana
- Error tracking with Sentry
- Regular database maintenance and optimization
- Security patches and updates
- Performance optimization and load testing

## License

[Specify License]

## Contact

[Contact Information]
