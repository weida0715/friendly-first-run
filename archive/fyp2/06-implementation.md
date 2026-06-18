## Chapter 6: Implementation

### 6.1 Overview

> Explain that this chapter presents the actual implementation of the Bitcoin Experimental Engine based on the OOAD models and Layered/N-tier architecture from Chapter 5.
> 
> Mention that the FYP2 implementation covers:
> * Next.js 15 frontend with Shadcn/ui components
> * Flask backend REST API
> * Python business logic services
> * SQLAlchemy data access layer
> * Server-managed sessions with Flask-Login
> * CSRF protection with Flask-WTF
> * Binance Connector for BTCUSDT market data
> * Background worker runner for experiment execution
> * TradingView Lightweight Charts for BTCUSDT visualization
>
> Link this back to BEE’s core goals: authenticated experimentation, Blueprint configuration, reproducible experiment execution, model ranking, and public discovery. Chapter 1 defines BEE as a web-enabled framework that consolidates data, feature, model, and evaluation workflows into a single parametric execution cycle

### 6.2 Implementation Scope

#### 6.2.1 Implemented Features

| Module                    | Implemented Features                                                             | Related Objective / Requirement |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------- |
| Authentication Module     | Register, login, logout, session handling                                        | F1, N3                          |
| User Management Module    | View users, enable/disable users, role-based access                              | F2                              |
| Blueprint Module          | Create Blueprint, edit Blueprint, request approval, versioning                   | F5, F8                          |
| Experiment Module         | Create experiment, configure split ratios, select Blueprint, override parameters | F3                              |
| Execution Module          | Queue experiment, execute split-first pipeline, generate model results           | F4                              |
| Model Module              | View model rankings, model details, performance metrics                          | F6, F7                          |
| Public Hub Module         | Browse public users, experiments, models, Blueprints                             | F13                             |
| Documentation / UI Module | Dashboard, navigation, responsive pages                                          | N5                              |

#### 6.2.2 Implementation Boundary

> State clearly what is implemented and what is excluded.
>
> Recommended wording:
> The implementation focuses on the research and experimentation workflow for BTCUSDT spot-market experiments. It does not implement live trading, brokerage execution, or real-money order placement, which remain outside the project scope.
>
> This is consistent with the FYP1 scope, which deliberately constrains BEE to BTCUSDT spot experimentation and excludes live trading and brokerage connectivity.

### 6.3 Development Environment

> The guideline specifically suggests listing programming languages, frameworks, tools, version control, and operating system.

#### 6.3.1 Programming Languages Used

> * TypeScript / JavaScript for frontend
> * Python 3.11+ for backend and business logic
> * SQL for database queries and schema validation
> * HTML/CSS via Next.js and Tailwind-based Shadcn/ui styling

#### 6.3.2 Frameworks and Libraries

| Layer                 | Technology                     | Purpose                                                            |
| --------------------- | ------------------------------ | ------------------------------------------------------------------ |
| Frontend              | Next.js 15                     | React-based web application with routing and server-side rendering |
| UI Components         | Shadcn/ui                      | Reusable UI components for forms, tables, cards, dialogs, tabs     |
| Charting              | TradingView Lightweight Charts | BTCUSDT price visualization                                        |
| Backend               | Flask                          | REST API controllers and request handling                          |
| Business Logic        | Python 3.11+                   | Validators, services, experiment execution logic                   |
| Data Access           | SQLAlchemy                     | ORM mappings and repository implementation                         |
| Authentication        | Flask-Login                    | Session-based user authentication                                  |
| Security              | Flask-WTF                      | CSRF protection                                                    |
| External Data         | Binance Connector              | BTCUSDT market data retrieval                                      |
| Background Processing | Background worker runner       | Long-running experiment execution                                  |

#### 6.3.3 IDEs and Tools

> * VS Code
> * Git / GitHub
> * Browser developer tools
> * Database administration tool, if used
> * API testing tool such as Postman, Insomnia, or curl
> * Python virtual environment
> * Node package manager

#### 6.3.4 Operating System Used

> Mention your actual OS, for example:
> * Windows 11 / macOS / Ubuntu
> * Development performed locally using separate frontend and backend servers

### 6.4 System Architecture Implementation

> This section should connect the implementation to the selected architecture in Chapter 5.

> Your Chapter 5 selected Layered/N-tier Architecture because it supports clear separation of Presentation, Business, and Data layers, while preserving the temporal integrity of experiment execution.

#### 6.4.1 Frontend Presentation Layer

> Explain the implemented Next.js frontend:
> * App shell and routing
> * Reusable layouts
> * Authentication pages
> * Dashboard
> * Experiment wizard
> * Blueprint wizard
> * Model rankings
> * Public Hub
> * Admin / moderator views
> * Shadcn/ui forms, tables, tabs, dialogs, cards
> * TradingView Lightweight Charts for BTCUSDT price visualization

#### 6.4.2 Backend Presentation Layer

> Explain Flask REST controllers:
> * Authentication routes
> * User routes
> * Blueprint routes
> * Experiment routes
> * Model routes
> * Public Hub routes
> * Admin/moderator routes

#### 6.4.3 Business Logic Layer

> Explain Python service classes:
> * `AccessControlService`
> * `SessionService`
> * `ExperimentValidator`
> * `BlueprintValidator`
> * `QueueService`
> * `VersioningService`
> * `ExperimentExecutor`
> * `BlueprintExecutorFactory`

> This aligns with the earlier design where validators enforce split constraints and parameter override rules, strategies encapsulate interchangeable execution/cancellation behavior, and executors enforce immutable experiment sequencing.

#### 6.4.4 Data Access Layer

> Explain SQLAlchemy and repository patterns:
> * ORM mappings
> * Repository classes
> * Unit-of-work / transaction handling, if implemented
> * Query encapsulation
> * Parameterized queries
> * Separation between business logic and persistence

#### 6.4.5 Infrastructure Layer

> Explain:
> * Session store
> * Background worker runner
> * Binance Connector
> * Database server
> * Environment variables
> * Static/media files, if any

### 6.5 Database Implementation

#### 6.5.1 Database Schema Overview

> Include the implemented database tables:
> * `users`
> * `blueprints`
> * `experiments`
> * `models`
> * `favorite_models`
> * `favorite_blueprints`
> * `experiment_confusion_metrics`
> * `btcusdt_klines`
> * any session/job tables if implemented

#### 6.5.2 Entity-to-Table Mapping

| Entity                     | Database Table               | Purpose                                              |
| -------------------------- | ---------------------------- | ---------------------------------------------------- |
| User                       | users                        | Stores account, role, status, authentication fields  |
| Blueprint                  | blueprints                   | Stores reusable experiment pipeline specifications   |
| Experiment                 | experiments                  | Stores experiment configuration and execution status |
| Model                      | models                       | Stores generated model artifacts and metrics         |
| BTCUSDTKline               | btcusdt_klines               | Stores OHLCV market data                             |
| ExperimentConfusionMetrics | experiment_confusion_metrics | Stores evaluation metrics per model/split            |

> Previous implementation plan already identified these entities as the database foundation.

#### 6.5.3 Data Integrity Controls

> Discuss:
> * Unique username/email constraints
> * Foreign key constraints
> * Experiment-to-model relationship
> * Blueprint-to-experiment relationship
> * Duplicate market data prevention
> * Transaction handling for experiment creation and state transitions

### 6.6 Frontend Implementation

#### 6.6.1 Application Routing

> Describe the route structure

| Page           | Route              | Purpose                      |
| -------------- | ------------------ | ---------------------------- |
| Landing Page   | `/`                | Introduces BEE               |
| Login          | `/login`           | Authenticates user           |
| Register       | `/register`        | Creates new account          |
| Dashboard      | `/dashboard`       | Shows experiment summary     |
| Experiments    | `/experiments`     | Lists user experiments       |
| New Experiment | `/experiments/new` | Multi-step experiment wizard |
| Blueprints     | `/blueprints`      | Blueprint library            |
| New Blueprint  | `/blueprints/new`  | Blueprint wizard             |
| Models         | `/models`          | Model ranking and library    |
| Public Hub     | `/hub`             | Public discovery             |
| Admin          | `/admin`           | User and system management   |

#### 6.6.2 UI Component Implementation

> Mention Shadcn/ui components used:
> * Button
> * Card
> * Table
> * Tabs
> * Dialog
> * Form
> * Input
> * Select
> * Badge
> * Toast / alert
> * Dropdown menu
> * Data table

#### 6.6.3 Experiment Wizard Implementation

> Structure this around the FYP1 use case:
> 1. Experiment metadata
> 2. BTCUSDT interval and date range
> 3. Train/validation/test split
> 4. Blueprint selection
> 5. Parameter overrides
> 6. Review and submit

> The FYP1 analysis defined this as a multi-step wizard, including parameter overrides that apply only to the current experiment and do not mutate the Blueprint.

#### 6.6.4 Blueprint Wizard Implementation

> Suggested steps:
> 1. Blueprint name and description
> 2. Indicator selection
> 3. Feature configuration
> 4. Reference architecture / model configuration
> 5. Review and save
> 6. Request approval

#### 6.6.5 Market Chart Visualization

> Explain the TradingView Lightweight Charts integration:
> * Displays BTCUSDT OHLC/price movement
> * Gives user visual market context
> * Used in dashboard, experiment detail, or market preview screen
> * Does not replace the backend evaluation engine

### 6.7 Backend Implementation

#### 6.7.1 Flask API Structure

> Example structure.

```
backend/
  app/
    controllers/
    services/
    validators/
    repositories/
    models/
    executors/
    strategies/
    infrastructure/
```

#### 6.7.2 Authentication and Session Management

> Discuss:
> * Registration
> * Login
> * Logout
> * Password hashing
> * Server-managed sessions
> * Flask-Login
> * Session timeout
> * Role-based access control

> Security requirements in FYP1 include password hashing, role-based access control, parameterized database queries, session lifetime control, secure session identifiers, and CSRF protection.

#### 6.7.3 Blueprint Management Implementation

> Discuss:
> * Create Blueprint
> * Edit Blueprint
> * Versioning rule
> * Approval request
> * Moderator approval/rejection
> * Public visibility of approved Blueprints

#### 6.7.4 Experiment Management Implementation

> Discuss:
> * Create experiment record
> * Validate BTCUSDT interval/date range
> * Validate split ratio
> * Select Blueprint
> * Apply parameter overrides
> * Queue experiment job
> * Update execution status

#### 6.7.5 Experiment Execution Pipeline

> This should be one of the most important sections.

> Suggested flow:
> * Load BTCUSDT data
> * Chronologically split train/validation/test
> * Compute indicators per split
> * Compose features per split
> * Generate parameter permutations
> * Train/evaluate one model per permutation
> * Store model metrics
> * Rank models
> * Persist logs and artifacts

> This directly supports BEE’s core split-first temporal integrity principle described in the background chapter.

#### 6.7.6 Model Ranking and Evaluation Implementation

> Discuss stored metrics:
> * Accuracy
> * Precision
> * Recall
> * False positive rate
> * AUC
> * Sharpe ratio
> * Maximum drawdown
> * Win rate

#### 6.7.7 Public Hub Implementation

> Discuss:
> * Public users
> * Public experiments
> * Public models
> * Approved Blueprints
> * Search/filter features
> * Favorite model/Blueprint

### 6.8 Security Implementation

#### 6.8.1 Authentication Security

> * Password hashing
> * Login validation
> * Disabled account checks
> * Logout session destruction

#### 6.8.2 Authorization Security

> * Normal User
> * Moderator
> * Administrator
> * Staff-only endpoints
> * Owner-only access to private resources

#### 6.8.3 CSRF Protection

> * Flask-WTF CSRF token validation
> * Applied to state-changing operations

#### 6.8.4 Database Query Protection

> * SQLAlchemy parameterized queries
> * No string interpolation in SQL pathways

#### 6.8.5 Session Protection

> * Server-managed sessions
> * Session timeout
> * Secure cookie configuration, if implemented

### 6.9 Deployment and Configuration

> The guideline includes system setup and network configuration topics such as backend setup, frontend setup, database setup, hosting setup, ports, and deployment environment.

#### 6.9.1 Backend Setup
> * Python virtual environment
> * Flask configuration
> * Environment variables
> * Database connection string
> * Binance API configuration, if any
> * Session store configuration

#### 6.9.2 Frontend Setup
> * Next.js 15 project setup
> * Shadcn/ui installation
> * Environment variables for backend API URL
> * TradingView Lightweight Charts installation

#### 6.9.3 Database Setup
> * Database creation
> * Migration or schema initialization
> * Seed data, if used
> * BTCUSDT data ingestion

#### 6.9.4 Worker Setup
> * Background worker runner
> * Experiment job queue
> * Job status update mechanism

#### 6.9.5 Network and Port Configuration

| Component        |                   Port | Purpose                         |
| ---------------- | ---------------------: | ------------------------------- |
| Next.js frontend |                   3000 | Web UI                          |
| Flask backend    |                   5000 | REST API                        |
| Database         | 5432 / configured port | Persistent storage              |
| Worker           |       Internal process | Background experiment execution |

### 6.10 Summary

> Summarize that the implementation realizes the design from Chapter 5 using a layered architecture. Mention that the frontend was implemented with Next.js and Shadcn/ui, the backend with Flask and Python services, the data layer with SQLAlchemy, and the execution pipeline with background workers. End by saying the next chapter validates the implementation through testing and evaluation.
