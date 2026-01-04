# User Stories - SieveFlow MVP 🚀



## Overview

SieveFlow is an automated recruitment pipeline designed to filter resumes (CVs), rank candidates using NLP scoring, and streamline the hiring process.



---



## 1. Job Management (Recruiter)



### **US01: Create Job Posting**

**As a** Recruiter  

**I want to** create a new job vacancy with a title, description, and technical requirements  

**So that** I can define the criteria for the automated filtering.



**Acceptance Criteria:**

- [ ] The recruiter can input a job title and a detailed description.

- [ ] The system allows defining "Key Skills" as mandatory requirements.

- [ ] Data is correctly stored in the `jobs` table via the NestJS API.



### **US02: List Active Jobs**

**As a** Recruiter  

**I want to** view a list of all my active job postings  

**So that** I can manage multiple recruitment processes simultaneously.



**Acceptance Criteria:**

- [ ] Displays a dashboard with all vacancies created by the user.

- [ ] Shows the number of applicants currently in the pipeline for each job.



---



## 2. Application & NLP Parsing (Candidate / System)



### **US03: Submit Application**

**As a** Candidate  

**I want to** upload my CV in PDF format to a specific job opening  

**So that** I can apply for the position.



**Acceptance Criteria:**

- [ ] The system only accepts `.pdf` files.

- [ ] The file is uploaded to the storage service (local/cloud).

- [ ] A new record is created in the `applications` table with a "Pending" status.



### **US04: Automated Resume Parsing**

**As a** System  

**I want to** extract text from the uploaded PDF and analyze it using NLP  

**So that** I can compare candidate experience with job requirements.



**Acceptance Criteria:**

- [ ] The `nlp-service` successfully extracts plain text from the PDF.

- [ ] The system identifies key entities (Skills, Experience, Education).



### **US05: Match Scoring**

**As a** System  

**I want to** assign a "Match Score" from 0 to 100 to each application  

**So that** the recruiter can see how well a candidate fits the role.



**Acceptance Criteria:**

- [ ] The score is calculated based on the coincidence between the CV text and the Job requirements.

- [ ] The score is updated in the database and visible in real-time.



---



## 3. Recruitment Pipeline (Recruiter)



### **US06: Candidate Ranking**

**As a** Recruiter  

**I want to** see a list of applicants ranked by their Match Score  

**So that** I can prioritize the best talent immediately.



**Acceptance Criteria:**

- [ ] The UI displays candidates sorted in descending order (highest score first).

- [ ] Clicking a candidate reveals their parsed data and original CV.



### **US07: Status Management**

**As a** Recruiter  

**I want to** move a candidate through different stages (e.g., Screening, Interview, Hired)  

**So that** I can keep track of the hiring pipeline.



**Acceptance Criteria:**

- [ ] The recruiter can update the `status` field of an application.

- [ ] The UI reflects the status change instantly.
