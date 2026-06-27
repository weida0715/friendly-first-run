Chapter 6: Implementation

- The purpose of the implementation chapter is to give the reader a clear picture of how you developed your system.
  6.1 Deployment
- Briefly summarize the implementation scope
- Mention the main modules and how they map to the system’s objectives
  6.2 Development Environment
  6.2.1 Programming Languages Used
- e.g., Java, C#, Python, JavaScript
  6.2.2 Frameworks and Libraries
- e.g., React, ASP.NET Core, Spring Boot
  6.2.3 IDEs and Tools
- VS Code, IntelliJ IDEA, Android Studio
  6.2.4 Version Control System
- e.g., Git/GitHub
  6.2.5 Operating System Used
  6.3 System Configuration and Setup
  6.3.1 Backend Setup
- Server configuration (e.g., Apache, Node.js, IIS)
- Middleware setup (e.g., Express.js, Django middleware)
- Database server setup (e.g., MySQL, PostgreSQL,
  MongoDB)
  6.3.2 Frontend Setup
- Web / mobile framework configurations (e.g., Vue CLI,
  React scripts)
- UI component integration (e.g., Bootstrap, Material UI)
  6.3.3 Build Tools and Package Managers
- (e.g., npm, Maven, Gradle)
  6.4 Database Implementation
  6.4.1 Database Schema Design
  6.4.2 SQL/NoSQL Database Tables / Collections
  6.4.3 Stored Procedures or Triggers (if applicable)
  6.4.4 Tools Used for Database Management
- (e.g., phpMyAdmin, MySQL Workbench)
  6.5 Key Modules and Features Developed
  For each module or subsystem, describe:
- Feature / functionality
- Screenshots or code snippets
- Algorithm or logic used or pseudo code
- Integration with other components
  6.5.1 User Authentication Module
- e.g. Technologies used is Firebase Auth
- This alidates user credentials, manages sessions
- Pseudocode: Follow https://users.csc.calpoly.edu/~jdalbey/SWE/pdl_std.html standard
- Integration: Redirects to Dashboard on successful login
  6.6 APIs and Integration
  6.6.1 Description of Internal APIs or Third-Party APIs Used
  6.6.2 API Endpoints Implemented
  6.6.3 JSON / XML Payload Structure
  6.6.4 Authentication Mechanisms (e.g., JWT, OAuth2)
  6.7 Network Configuration (if applicable)
  6.7.1 Hosting Setup (e.g., localhost, cloud server)
  6.7.2 Port Configuration
  6.7.3 Deployment to Server or Live Environment
  6.8 Security Measures
  6.8.1 Input Validation, Encryption, HTTPS Configuration
  6.8.2 Role-Based Access Control (RBAC)
  6.8.3 Error Handling and Logging
  6.9 Challenges Encountered and Solutions
  6.9.1 Challenges Encountered
- Explain about the technical difficulties faced during implementation
  6.9.2 Solutions
- How you overcame or mitigated those issues
  6.10 Summary
- Reflect on how the implementation aligns with initial design
- Mention any pending or future improvements

Chapter 7: Testing

- The purpose of the testing chapter is to demonstrate the reliability, functionality, and quality assurance of the system or solution you developed. It validates that your system works as intended and meets user or project requirements
  7.1 Unit Testing
- Include the various units and modules of the system that were tested individually to identify potential problems and bugs.
- Show in tables. Examples in following slides.
  7.1.1 Test Plan
- Show tables for each module:
  | No. | Test ID | Test Case Name | Test Date |
- Example:
  - No.: 1
  - Test ID: UT001
  - Test Case Name: Manage branches
  - Test Date: <Today's date>
    7.1.2 Test Data
- Show tables for each module:
  | Test ID | Test Case Name | Relevant Test Data |
- Example:
  - Test ID: UT001
  - Test Case Name: Manage branches
  - Relevant Test Data: Name, Addresss, State, Phone Number
    7.1.3 Test Results
- Show tables for each Test ID:
  - Row1:
    | Test ID | Description | Precondition | Post Condition | Test Steps | Expected Result | Actual Results |
  - Row 2: Results
    7.2 Integration Testing
- After testing the modules individually, the modeuls are integrated and tested again. The test results are presented below.
  7.2.1: {For each module}
  | No. | Test Case | Units integrated | Test to execute test cases | Expected results | Actual results |
  7.3 Usability Testing
- Usability tests are carried out to test whether the system was developed in a usable fashion for its end-users.
- Refer back to your chapter 3 on user requirements.
  | Date Time | Requirement | Subject | Time | Observation | Status | Conclusion |
- Example:
  - Date: today's date
  - Requirement: refer back to each functional requirement.
  - Subject: The actor role
  - Time: skip this
  - Observation: is the subject able to perform the requirement
  - Status: Success? Failure? Moderate Success?
    7.4 Acceptance Testing
- The purpose of acceptance testing is to demonstrate that the completed system meets the predefined requirements and is acceptable to the end user, or client. It serves as the final verification step to ensure the project is ready for deployment or handover.
- Acceptance test table for each functional requirement:
  - Row 1: Tester, Test date, Test Objective, Test Inputs, Test Procedures, Expected Test Outputs, Actual Test Results, Tester Comments
  - Row 2: the results
  - Example:
    - Tester: John
    - Test date: today's date
    - Test Objective: To record plant health for the day
    - Test inputs:
      1. Click event
      2. Slider event
      3. Button click event
    - Test Procedures:
      1. Open the mobile app
      2. Click Plant Image
      3. Slide to indicate plant health
      4. Click "Done" button
    - Expected Test Outputs
      - Image of plant in the system changes to represent the selected current health of the physical plant
    - Actual Test Results
      - The system successfully changes the image of the plant to reflect the current health of the physical plant.
    - Comments by User
  - NOTE: Tester Comments assume the Expected and Actual results more or less the same.
    7.5 Summary
    - Briefly reiterate the key findings, effectiveness, and outcomes of the testing process. Wrap up the chapter by showing how testing contributed to the system’s reliability and readiness.
