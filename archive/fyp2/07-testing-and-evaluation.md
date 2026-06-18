## Chapter 7: Testing and Evaluation

> This chapter should demonstrate the reliability, functionality, and quality assurance of the developed system, proving that it works as intended and meets user/project requirements. For software engineering projects, it recommends unit testing, integration testing, system testing, and acceptance testing. Since BEE also contains data/model evaluation elements, you can include data validation, model evaluation metrics, hyperparameter/parameter testing, and end-to-end pipeline testing.

### 7.1 Overview

> Explain that this chapter validates the BEE implementation through:
> * Unit testing
> * Integration testing
> * System testing
> * Security testing
> * Data validation
> * Model/evaluation testing
> * Performance testing
> * Usability testing
> * Acceptance testing

> Mention that testing is mapped back to the functional and non-functional requirements from Chapter 3.

### 7.2 Testing Strategy

#### 7.2.1 Testing Objectives

> Testing should verify that:
> * Users can authenticate securely
> * Role-based access control works correctly
> * Blueprints can be created, versioned, submitted, and approved
> * Experiments can be configured and queued
> * Split-first execution prevents look-ahead bias
> * Parameter permutations generate correct model artifacts
> * Model rankings display correct metrics
> * Public Hub only shows eligible public artifacts
> * Frontend pages work responsively
> * Backend APIs return correct responses
> * Database state remains consistent

#### 7.2.2 Testing Environment

| Item        | Description                           |
| ----------- | ------------------------------------- |
| Frontend    | Next.js 15 local development server   |
| Backend     | Flask local server                    |
| Database    | PostgreSQL / SQLite / your actual DB  |
| Browser     | Chrome / Edge / Firefox               |
| API Testing | Postman / curl / automated tests      |
| OS          | Your operating system                 |
| Test Data   | BTCUSDT sample OHLCV data             |
| User Roles  | Normal User, Moderator, Administrator |

#### 7.2.3 Test Data Summary

> Mention:
> * Valid user accounts
> * Invalid login credentials
> * Disabled user account
> * Draft Blueprint
> * Pending Blueprint
> * Approved Blueprint
> * Rejected Blueprint
> * Valid experiment configuration
> * Invalid split configuration
> * BTCUSDT OHLCV records
> * Multiple parameter combinations

> The testing guideline recommends showing test data in tables.

### 7.3 Unit Testing

> The guideline says unit testing should include the individual modules tested to identify problems and bugs, shown in tables.

#### 7.3.1 Unit Test Plan

| Test ID | Module               | Function / Unit Tested           | Expected Result                                |
| ------- | -------------------- | -------------------------------- | ---------------------------------------------- |
| UT01    | Authentication       | Password hashing                 | Password is stored as hash, not plaintext      |
| UT02    | Authentication       | Login validation                 | Valid credentials create session               |
| UT03    | User Validator       | Username format                  | Invalid username rejected                      |
| UT04    | Experiment Validator | Split ratio validation           | Train/validation/test sum equals 100%          |
| UT05    | Experiment Validator | Minimum validation/test split    | Values below 10% rejected                      |
| UT06    | Blueprint Validator  | Parameter range validation       | Invalid ranges rejected                        |
| UT07    | Versioning Service   | Edit submitted Blueprint         | New versioned copy created                     |
| UT08    | Queue Service        | Enqueue experiment               | Job ID and queue status returned               |
| UT09    | Executor             | Parameter permutation generation | One model generated per permutation            |
| UT10    | Metrics Service      | Metric calculation               | Accuracy/precision/recall calculated correctly |


#### 7.3.2 Unit Test Data

| Test ID | Input Data                                 | Expected Output           |
| ------- | ------------------------------------------ | ------------------------- |
| UT04    | Train 80, validation 10, test 10           | Accepted                  |
| UT04    | Train 90, validation 5, test 5             | Rejected                  |
| UT06    | SMA period `[10, 20, 50]`                  | Accepted                  |
| UT06    | Empty parameter range                      | Rejected                  |
| UT07    | Blueprint status `PENDING`, edit requested | New draft version created |

#### 7.3.3 Unit Test Results

| Test ID | Actual Result                  | Status |
| ------- | ------------------------------ | ------ |
| UT01    | Password stored as salted hash | Pass   |
| UT02    | Session created successfully   | Pass   |
| UT04    | Invalid split rejected         | Pass   |

### 7.4 Integration Testing

> Integration testing should verify interactions between components or systems.

#### 7.4.1 Frontend-to-Backend API Integration

| Test ID | Scenario                                      | Expected Result                      |
| ------- | --------------------------------------------- | ------------------------------------ |
| IT01    | Login form submits to Flask API               | User is authenticated and redirected |
| IT02    | Experiment wizard submits valid configuration | Experiment record created            |
| IT03    | Blueprint wizard submits new Blueprint        | Blueprint saved as draft             |
| IT04    | Model rankings page requests API data         | Ranked model list displayed          |

#### 7.4.2 Backend-to-Database Integration

| Test ID | Scenario            | Expected Result                             |
| ------- | ------------------- | ------------------------------------------- |
| IT05    | Create user         | User row inserted                           |
| IT06    | Create experiment   | Experiment row linked to user and Blueprint |
| IT07    | Complete experiment | Model and metrics rows inserted             |
| IT08    | Favorite model      | Favorite relation stored                    |

#### 7.4.3 Backend-to-Worker Integration

| Test ID | Scenario             | Expected Result                                               |
| ------- | -------------------- | ------------------------------------------------------------- |
| IT09    | Submit experiment    | Job is queued                                                 |
| IT10    | Worker processes job | Experiment status changes from queued to running to completed |
| IT11    | Worker fails job     | Experiment marked failed and error logged                     |

#### 7.4.4 Backend-to-Binance Connector Integration

| Test ID | Scenario                        | Expected Result              |
| ------- | ------------------------------- | ---------------------------- |
| IT12    | Request BTCUSDT OHLCV data      | Valid kline records returned |
| IT13    | Duplicate market data ingestion | Duplicate rows prevented     |

### 7.5 System Testing

> System testing validates the complete integrated system, including functionality, performance, and robustness.

#### 7.5.1 End-to-End User Workflow Testing

> Test the complete workflow:
> * Register user
> * Login
> * Create Blueprint
> * Submit Blueprint for approval
> * Moderator approves Blueprint
> * User creates experiment
> * System queues experiment
> * Worker executes experiment
> * User views model rankings
> * User views model detail
> * User views public hub

#### 7.5.2 Experiment Execution Pipeline Testing

> This is critical for BEE.

| Test ID | Scenario                              | Expected Result                                |
| ------- | ------------------------------------- | ---------------------------------------------- |
| ST01    | Valid experiment configuration        | Experiment completes successfully              |
| ST02    | Invalid split ratio                   | Experiment creation blocked                    |
| ST03    | Multiple parameter values             | Correct number of model permutations generated |
| ST04    | Split-first execution                 | Indicators computed separately per split       |
| ST05    | Same input and configuration repeated | Identical outputs generated                    |

> This maps to the non-functional requirement that identical inputs and configuration should produce identical outputs.

#### 7.5.3 Public Hub System Testing

| Test ID | Scenario                   | Expected Result                       |
| ------- | -------------------------- | ------------------------------------- |
| ST06    | Browse public models       | Only public/eligible models displayed |
| ST07    | Browse approved Blueprints | Only approved Blueprints displayed    |
| ST08    | Search by username         | Matching public records displayed     |

### 7.6 Security Testing

> Although the guideline lists security testing mainly under cybersecurity projects, it is relevant here because BEE has authentication, roles, sessions, and CSRF requirements.

#### 7.6.1 Authentication Testing

| Test ID | Scenario               | Expected Result   |
| ------- | ---------------------- | ----------------- |
| SEC01   | Valid login            | Login succeeds    |
| SEC02   | Invalid password       | Login fails       |
| SEC03   | Disabled account login | Access denied     |
| SEC04   | Logout                 | Session destroyed |

#### 7.6.2 Authorization Testing

| Test ID | Scenario                                        | Expected Result |
| ------- | ----------------------------------------------- | --------------- |
| SEC05   | Normal user accesses admin page                 | Access denied   |
| SEC06   | Moderator approves Blueprint                    | Access allowed  |
| SEC07   | Moderator changes admin role                    | Access denied   |
| SEC08   | User accesses another user’s private experiment | Access denied   |

#### 7.6.3 CSRF Testing

| Test ID | Scenario                                         | Expected Result  |
| ------- | ------------------------------------------------ | ---------------- |
| SEC09   | Submit state-changing request without CSRF token | Request rejected |
| SEC10   | Submit valid request with CSRF token             | Request accepted |

#### 7.6.4 Database Security Testing

| Test ID | Scenario                           | Expected Result                 |
| ------- | ---------------------------------- | ------------------------------- |
| SEC11   | SQL injection string in login form | Query remains safe; login fails |
| SEC12   | SQL injection string in search box | No unauthorized data returned   |

### 7.7 Data Validation Testing

> Because BEE depends on BTCUSDT market data and feature engineering, include data validation testing. The testing guideline’s data science section recommends checking missing values, outliers, duplicates, preprocessing correctness, and dataset splitting.

#### 7.7.1 Market Data Quality Testing

| Test ID | Check                     | Expected Result            |
| ------- | ------------------------- | -------------------------- |
| DV01    | Missing timestamp         | Record rejected or flagged |
| DV02    | Duplicate kline timestamp | Duplicate prevented        |
| DV03    | Negative OHLCV value      | Record rejected            |
| DV04    | Invalid interval          | Request rejected           |
| DV05    | Start date after end date | Experiment rejected        |

#### 7.7.2 Dataset Splitting Validation

| Test ID | Scenario                                  | Expected Result                         |
| ------- | ----------------------------------------- | --------------------------------------- |
| DV06    | Chronological train/validation/test split | No future data appears in earlier split |
| DV07    | Indicator computation after split         | No look-ahead leakage                   |
| DV08    | Same split ratio repeated                 | Same split boundaries produced          |

#### 7.7.3 Feature Engineering Validation

| Test ID | Scenario         | Expected Result                         |
| ------- | ---------------- | --------------------------------------- |
| DV09    | SMA calculation  | Output matches expected rolling average |
| DV10    | RSI calculation  | Output within valid range               |
| DV11    | MACD calculation | Correct signal and histogram values     |

### 7.8 Model and Evaluation Testing

> This section validates BEE’s experiment outputs.

#### 7.8.1 Evaluation Metrics Testing

| Test ID | Metric              | Expected Result                            |
| ------- | ------------------- | ------------------------------------------ |
| ME01    | Accuracy            | Correctly calculated from confusion matrix |
| ME02    | Precision           | Correctly calculated                       |
| ME03    | Recall              | Correctly calculated                       |
| ME04    | False positive rate | Correctly calculated                       |
| ME05    | AUC                 | Correctly calculated                       |
| ME06    | Sharpe ratio        | Correctly calculated                       |
| ME07    | Maximum drawdown    | Correctly calculated                       |
| ME08    | Win rate            | Correctly calculated                       |

#### 7.8.2 Parameter Permutation Testing

| Test ID | Input Parameter Ranges                              | Expected Model Count |
| ------- | --------------------------------------------------- | -------------------- |
| ME09    | SMA `[10,20]`, RSI `[14]`                           | 2 models             |
| ME10    | SMA `[10,20]`, RSI `[14,21]`, threshold `[0.5,0.7]` | 8 models             |

#### 7.8.3 Model Ranking Testing

| Test ID | Scenario             | Expected Result                                |
| ------- | -------------------- | ---------------------------------------------- |
| ME11    | Sort by Sharpe ratio | Highest Sharpe appears first                   |
| ME12    | Sort by accuracy     | Highest accuracy appears first                 |
| ME13    | Filter by experiment | Only models from selected experiment displayed |

### 7.9 Performance Testing

> Map this to the performance requirements in Chapter 3, which include fast navigation/configuration, authentication under 500 ms, job acknowledgment under 100 ms, queue feedback under 200 ms, and support for up to ten concurrent experiment jobs.

| Test ID | Scenario                       | Expected Result                |
| ------- | ------------------------------ | ------------------------------ |
| PT01    | Login request                  | Response under 500 ms          |
| PT02    | Submit experiment              | Job acknowledged quickly       |
| PT03    | View queue position            | Queue status returned quickly  |
| PT04    | Run multiple experiment jobs   | System remains stable          |
| PT05    | Load model rankings page       | Page loads without major delay |
| PT06    | Large metrics table pagination | Page remains responsive        |

### 7.10 Usability Testing

> Since the frontend has been implemented, include UI testing.

#### 7.10.1 User Interface Testing

| Test ID | Scenario                            | Expected Result                   |
| ------- | ----------------------------------- | --------------------------------- |
| UI01    | Navigate dashboard                  | User can access main modules      |
| UI02    | Complete experiment wizard          | User can submit without confusion |
| UI03    | Complete Blueprint wizard           | User can configure pipeline       |
| UI04    | Use dark/light mode, if implemented | Theme changes correctly           |
| UI05    | View on tablet/desktop              | Layout remains usable             |

> Chapter 3 already states usability requirements for light/dark presentation, desktop browsers, tablet browsers, and adaptive layouts.

#### 7.10.2 User Feedback Summary

| Participant | Role        | Feedback                                         | Action Taken       |
| ----------- | ----------- | ------------------------------------------------ | ------------------ |
| P1          | Normal User | Experiment wizard is clear                       | No change          |
| P2          | Moderator   | Blueprint approval status should be more visible | Added status badge |
| P3          | Admin       | User status filter is useful                     | No change          |

### 7.11 Acceptance Testing

> The guideline says acceptance testing demonstrates that the completed system meets predefined requirements and is acceptable to the end user or client.

#### 7.11.1 Acceptance Test Plan

| Test ID | Requirement Area | Acceptance Criteria                                | Status |
| ------- | ---------------- | -------------------------------------------------- | ------ |
| AT01    | Authentication   | Users can register, login, logout securely         | Pass   |
| AT02    | Role Access      | Admin, moderator, and user privileges enforced     | Pass   |
| AT03    | Blueprint        | Users can create and submit Blueprints             | Pass   |
| AT04    | Experiment       | Users can create BTCUSDT experiments               | Pass   |
| AT05    | Execution        | System generates model artifacts from permutations | Pass   |
| AT06    | Ranking          | Users can compare models by metrics                | Pass   |
| AT07    | Public Hub       | Users can browse public artifacts                  | Pass   |
| AT08    | Security         | CSRF and authorization checks work                 | Pass   |

#### 7.11.2 Requirements Traceability

| Requirement Group           | Tested By                    |
| --------------------------- | ---------------------------- |
| F1 Authentication           | UT01–UT03, SEC01–SEC04, AT01 |
| F2 User Management          | IT05, SEC05–SEC08, AT02      |
| F3 Experiment Configuration | UT04–UT06, ST01–ST03, AT04   |
| F4 Experiment Execution     | ST04–ST05, ME09–ME10, AT05   |
| F5/F8 Blueprint Governance  | UT07, IT03, AT03             |
| F6/F7 Model Ranking         | ME11–ME13, AT06              |
| F13 Public Hub              | ST06–ST08, AT07              |
| N3 Security                 | SEC01–SEC12, AT08            |
| N5 Usability                | UI01–UI05                    |

### 7.12 Testing Summary

> End the chapter by summarizing:
> * Unit tests verified isolated business rules and validators
> * Integration tests verified frontend/backend/database/worker interaction
> * System tests verified full user workflows
> * Security tests verified authentication, authorization, CSRF, and query safety
> * Data validation confirmed correct BTCUSDT data handling
> * Evaluation tests confirmed model metrics and ranking behavior
> * Acceptance testing confirmed that the system satisfies the main project requirements

> The testing guideline recommends closing with the key findings, effectiveness, outcomes, and how testing contributed to readiness.
