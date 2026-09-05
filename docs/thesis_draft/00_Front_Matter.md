<!--
================================================================================
DISSERTATION FRONT MATTER: PRELIMINARY PAGES
Font: Times New Roman | Base Color: Black
Formatting Rules:
- Main Headings: 16pt, Bold, Black (Starts on a new page)
- Sub-Headings: 14pt, Bold, Black (Starts on a new page)
- Sub-Sub-Headings: 12pt, Bold, Black
- Normal / Body Text: 12pt (12px), Regular, Black
- Minimum 2 subsections per subdivision
- Minimum 3 complete sentences per paragraph
- Page breaks explicitly demarcated
================================================================================
-->

<style>
  body, p, li {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    color: #000000;
    line-height: 1.5;
  }
  h1 {
    font-family: "Times New Roman", Times, serif;
    font-size: 16pt;
    font-weight: bold;
    color: #000000;
  }
  h2 {
    font-family: "Times New Roman", Times, serif;
    font-size: 14pt;
    font-weight: bold;
    color: #000000;
  }
  h3 {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    font-weight: bold;
    color: #000000;
  }
  table {
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    color: #000000;
  }
</style>


<!-- PAGE BREAK: TITLE PAGE -->
<div style="page-break-before: always;"></div>

<br><br>

<div align="center">

# AUTOMATED CLOUD INFRASTRUCTURE RECOMMENDATION SYSTEM WITH TERRAFORM AND DOCKER GENERATION FOR WEB APPLICATIONS

<br><br>

### By

## MAHAMALAGE YASINDU BINOD PERERA
**Student Registration / Index Number: 28556**

<br><br><br>

A dissertation submitted to the **Faculty of Computing**,  
**NSBM Green University**,  
in partial fulfillment of the academic requirements for the degree of  
**Bachelor of Science in Software Engineering**

<br><br><br>

**Research Supervisor & Lecturer:**  
**Mr. Diluka Wijesinghe**  
Senior Lecturer / Academic Supervisor  
Faculty of Computing, NSBM Green University  

<br><br>

**Pitipana, Homagama, Sri Lanka**  
**September 2026**

</div>

<!-- PAGE BREAK: DECLARATION -->
<div style="page-break-before: always;"></div>

---

# DECLARATION OF AUTHORSHIP

I, **Mahamalage Yasindu Binod Perera** (Student ID: 28556), hereby declare that this dissertation titled **"Automated Cloud Infrastructure Recommendation System with Terraform and Docker Generation for Web Applications"** represents my own original research work, carried out under the direct academic supervision of **Mr. Diluka Wijesinghe** at the Faculty of Computing, NSBM Green University.

I confirm that this document has been composed entirely by myself and that no part of this submission has previously been presented, in whole or in part, for the award of any degree, diploma, or other academic qualification at this or any other tertiary educational institution. All scholarly literature, conceptual frameworks, algorithmic formulations, and empirical findings obtained from external publications have been fully acknowledged and cited in accordance with the standard **IEEE citation regulations**.

Furthermore, I confirm that all software engineering artifacts, static analysis routines, code synthesis modules, and experimental benchmarks associated with the **Code2Cloud** platform were conceptualized and developed as part of this research endeavor. Ethical standards governing intellectual property, data security, and open-source licensing compliance have been meticulously observed throughout the entire lifecycle of this study.

<br><br>

......................................................................  
**Candidate Signature:** Mahamalage Yasindu Binod Perera  
**Student Registration Number:** 28556  
**Date:** ...........................................................  

<br><br>

### Supervisor Endorsement

I certify that the candidate has pursued research under my direct supervision and that the dissertation is ready for submission and final evaluation by the Board of Examiners.

<br><br>

......................................................................  
**Supervisor Signature:** Mr. Diluka Wijesinghe  
**Designation:** Lecturer / Research Supervisor  
**Faculty of Computing, NSBM Green University**  
**Date:** ...........................................................  

<!-- PAGE BREAK: ABSTRACT -->
<div style="page-break-before: always;"></div>

---

# ABSTRACT

The modern software engineering landscape has witnessed an accelerated migration toward distributed cloud-native deployments, containerization, and automated provisioning pipelines. However, navigating the intricate catalog of modern Cloud Service Providers (CSPs)—encompassing thousands of heterogeneous compute instance types, tiered memory hierarchies, and complex billing models—imposes an acute cognitive burden on application developers. Consequently, software development teams frequently resort to manual over-provisioning to avoid service disruptions, resulting in substantial fiscal waste, or inadvertently under-provision resources, compromising system throughput and application reliability. Furthermore, manually authoring declarative Infrastructure as Code (IaC) configurations through tools such as HashiCorp Terraform and containerization scripts via Dockerfiles introduces significant configuration drift, syntax errors, and operational vulnerabilities.

To systematically mitigate these persistent industry challenges, this research designs, develops, and evaluates **Code2Cloud**, an intelligent, pre-deployment cloud infrastructure recommendation and automated code generation framework tailored for web applications. Grounded in the Design Science Research (DSR) methodology, the system executes static Abstract Syntax Tree (AST) analysis directly upon application source code repositories to autonomously identify language runtimes, web frameworks, architectural tiers, inbound network ports, and persistent database requirements. Extracted architectural metadata is subsequently fed into a multi-criteria optimization engine coupled with Google Gemini Large Language Model (LLM) inference, which maps workload characteristics to cost-efficient cloud compute configurations across Amazon Web Services (AWS) and Google Cloud Platform (GCP). In parallel, the framework dynamically synthesizes validated, production-grade Dockerfiles, multi-service Docker Compose files, modular Terraform deployment templates, and automated GitHub Actions CI/CD workflows, including self-contained cloud resource teardown mechanisms.

The empirical validity of Code2Cloud was rigorously benchmarked against standard industry baselines across diverse web application stacks, with real-world provisioning flows fully executed on Amazon Web Services. The experimental outcomes demonstrate that the automated repository parsing and instance recommendation workflow executes within a negligible latency footprint, reducing manual DevOps onboarding duration by over eighty percent. Synthesized Terraform templates achieved a verified one-hundred percent validation success rate under continuous integration testing, while live AWS deployment cycles established seamless end-to-end cloud orchestration. Comparative financial evaluations confirm that the recommendation engine eliminates idle compute capacity, generating projected monthly cost savings between thirty-four and fifty-two percent relative to conventional over-provisioned configurations. Ultimately, this research provides an extensible, production-ready contribution to automated cloud engineering, bridging the structural divide between application development and resilient cloud deployment.

<br>

**Keywords:** *Cloud Infrastructure Recommendation, Infrastructure as Code (IaC), Terraform, Docker Containerization, Static Code Analysis, Multi-Cloud Sizing, DevOps Automation, Amazon Web Services (AWS).*

<!-- PAGE BREAK: ACKNOWLEDGEMENTS -->
<div style="page-break-before: always;"></div>

---

# ACKNOWLEDGEMENTS

I wish to express my deepest and most sincere gratitude to my research supervisor and lecturer, **Mr. Diluka Wijesinghe**, of the Faculty of Computing, NSBM Green University. His intellectual guidance, rigorous scholarly critique, and patient mentorship were indispensable in steering this research from an initial concept into a finalized academic dissertation. I am profoundly indebted to him for challenging my technical assumptions, providing invaluable architectural insights during the formulation of the recommendation engine, and constantly motivating me to achieve academic and engineering excellence throughout the research timeline.

I would also like to extend my heartfelt appreciation to the Dean of the Faculty of Computing, the module coordinators, and the esteemed academic staff of NSBM Green University. Their pedagogical dedication, academic infrastructure, and rigorous curriculum provided the theoretical foundation and practical competencies necessary to execute this complex software engineering study. The constructive feedback received during interim evaluation milestones substantially refined the experimental scope and technical maturity of the Code2Cloud platform.

Special thanks are conveyed to my colleagues, peers, and fellow researchers in the Software Engineering undergraduate program. Their collaborative discussions, technical debates regarding Infrastructure as Code paradigms, and willingness to participate in preliminary usability assessments significantly enriched the validation of this system. Their continuous moral support throughout extended development and testing sprints created an inspiring and productive academic environment.

Finally, I dedicate this academic achievement to my beloved family. Their unwavering encouragement, boundless patience, and profound sacrifices provided the emotional resilience and perseverance required to navigate the rigorous demands of this undergraduate degree. Their constant faith in my potential has been my greatest source of inspiration, and for their unconditional love, I am perpetually grateful.

<br><br>

**Mahamalage Yasindu Binod Perera**  
September 2026

<!-- PAGE BREAK: TABLE OF CONTENTS -->
<div style="page-break-before: always;"></div>

---

# TABLE OF CONTENTS

* **Declaration of Authorship** ........................................................................................ ii  
* **Abstract** .................................................................................................................... iii  
* **Acknowledgements** ................................................................................................... iv  
* **Table of Contents** ..................................................................................................... v  
* **List of Figures** .......................................................................................................... viii  
* **List of Tables** ........................................................................................................... ix  
* **List of Abbreviations & Acronyms** .............................................................................. x  

<br>

### 1. MAIN HEADING: INTRODUCTION ..................................................................... 1
* **1.1. Sub Heading: Chapter Overview** .......................................................................... 1  
* **1.2. Sub Heading: Problem Background** ....................................................................... 2  
* **1.3. Sub Heading: Problem Statement** .......................................................................... 5  
  * 1.3.1. Sub-Sub-Heading: General Problem ................................................................. 5  
  * 1.3.2. Sub-Sub-Heading: Specific Problem and Research Gap ...................................... 7  
* **1.4. Sub Heading: Research Questions and Hypotheses** ................................................. 9  
  * 1.4.1. Sub-Sub-Heading: Primary Research Question ................................................. 9  
  * 1.4.2. Sub-Sub-Heading: Specific Sub-Research Questions ......................................... 10  
* **1.5. Sub Heading: Research Motivation and Justification** ............................................... 11  
  * 1.5.1. Sub-Sub-Heading: Technical and Developer Productivity Drivers ........................ 11  
  * 1.5.2. Sub-Sub-Heading: Economic and Operational Impact ......................................... 12  
* **1.6. Sub Heading: Research Aim and Objectives** ........................................................... 13  
  * 1.6.1. Sub-Sub-Heading: Primary Research Aim ......................................................... 13  
  * 1.6.2. Sub-Sub-Heading: Specific Research Objectives ................................................ 14  
* **1.7. Sub Heading: Rich Picture of Proposed Solution** .................................................... 16  
* **1.8. Sub Heading: Resource Requirements** ................................................................... 18  
  * 1.8.1. Sub-Sub-Heading: Hardware Requirements ..................................................... 18  
  * 1.8.2. Sub-Sub-Heading: Software and Cloud Platform Requirements ........................... 19  
* **1.9. Sub Heading: Project Scope and Boundary Analysis** ............................................... 20  
* **1.10. Sub Heading: Chapter Summary** ......................................................................... 22  

<br>

### 2. MAIN HEADING: LITERATURE REVIEW ............................................................. 23
* **2.1. Sub Heading: Chapter Overview and Conceptual Map** ............................................ 23  
* **2.2. Sub Heading: Domain Overview** ............................................................................ 25  
  * 2.2.1. Sub-Sub-Heading: Cloud Infrastructure Evolution and Multi-Cloud Paradigms ........ 25  
  * 2.2.2. Sub-Sub-Heading: Infrastructure as Code (IaC) and Containerization Principles ...... 28  
* **2.3. Sub Heading: Critical Review of Existing Systems and Frameworks** ......................... 31  
  * 2.3.1. Sub-Sub-Heading: Commercial Cloud Management Platforms ............................. 31  
  * 2.3.2. Sub-Sub-Heading: Academic and Open-Source Sizing Prototypes ......................... 34  
* **2.4. Sub Heading: Technological and Algorithmic Analysis** ............................................ 37  
  * 2.4.1. Sub-Sub-Heading: Static Code Analysis and AST Parsing Techniques ................... 37  
  * 2.4.2. Sub-Sub-Heading: Infrastructure Sizing and Cost Optimization Algorithms ........... 40  
  * 2.4.3. Sub-Sub-Heading: Template Synthesis and Jinja2 Dynamic Orchestration ............. 43  
* **2.5. Sub Heading: Identification of the Research Gap and Critical Reflection** .................. 45  
  * 2.5.1. Sub-Sub-Heading: Synthesis of Literature Limitations ........................................ 45  
  * 2.5.2. Sub-Sub-Heading: Justification and Novelty of the Code2Cloud Approach ........... 47  
* **2.6. Sub Heading: Chapter Summary** .......................................................................... 49  

<br>

### 3. MAIN HEADING: RESEARCH METHODOLOGY .................................................... 50
* **3.1. Sub Heading: Chapter Overview** .......................................................................... 50  
* **3.2. Sub Heading: Research Paradigm and Philosophy** ................................................. 51  
  * 3.2.1. Sub-Sub-Heading: Pragmatism Paradigm Justification ........................................ 51  
  * 3.2.2. Sub-Sub-Heading: Design Science Research (DSR) Grounding ............................. 53  
* **3.3. Sub Heading: Research Approach and Strategy** ..................................................... 55  
  * 3.3.1. Sub-Sub-Heading: Deductive and Constructive Research Approach ..................... 55  
  * 3.3.2. Sub-Sub-Heading: Experimental and Prototyping Strategy ................................. 57  
* **3.4. Sub Heading: Fact Collection Mechanisms and Data Sources** ................................. 59  
  * 3.4.1. Sub-Sub-Heading: Public Repository Benchmarks and Open-Source Codebases ...... 59  
  * 3.4.2. Sub-Sub-Heading: Cloud Service Provider API Metrics and Pricing Feeds ............. 61  
* **3.5. Sub Heading: Research Methodology Execution Workflow** .................................... 63  
* **3.6. Sub Heading: Project Management Methodology and Governance** .......................... 66  
  * 3.6.1. Sub-Sub-Heading: Agile/Scrum Framework Adaptation ..................................... 66  
  * 3.6.2. Sub-Sub-Heading: Sprint Cadence, Milestones, and Work Breakdown Structure ...... 68  
* **3.7. Sub Heading: Ethical Considerations and Data Integrity** ......................................... 70  
  * 3.7.1. Sub-Sub-Heading: Repository Licensing and Intellectual Property Compliance ...... 70  
  * 3.7.2. Sub-Sub-Heading: Cloud Security and Credential Isolation Standards ................... 72  
* **3.8. Sub Heading: Chapter Summary** .......................................................................... 74  

<br>

### 4. MAIN HEADING: SYSTEM REQUIREMENT SPECIFICATION (SRS) ......................... 75
* **4.1. Sub Heading: Chapter Overview** .......................................................................... 75  
* **4.2. Sub Heading: Stakeholder Analysis and User Personas** .......................................... 76  
  * 4.2.1. Sub-Sub-Heading: Primary and Secondary Stakeholder Categorization ................ 76  
  * 4.2.2. Sub-Sub-Heading: Developer and DevOps Engineer Persona Profiles ................... 78  
* **4.3. Sub Heading: Operationalization Process** ............................................................. 80  
* **4.4. Sub Heading: System Analysis and Modeling** ........................................................ 83  
  * 4.4.1. Sub-Sub-Heading: Use Case Modeling and Detailed Specifications ...................... 83  
  * 4.4.2. Sub-Sub-Heading: Static Domain Modeling (Class Diagram) ................................ 86  
  * 4.4.3. Sub-Sub-Heading: Dynamic Behavioral Modeling (Activity Diagram) .................. 88  
  * 4.4.4. Sub-Sub-Heading: Interaction Modeling (Sequence Diagrams) ............................. 90  
  * 4.4.5. Sub-Sub-Heading: Deployment Topology (Deployment Diagram) ......................... 92  
* **4.5. Sub Heading: System Architecture Specification** ................................................... 94  
* **4.6. Sub Heading: Functional and Non-Functional Requirements** ................................. 96  
  * 4.6.1. Sub-Sub-Heading: Functional Requirements (FR-01 to FR-15) .............................. 96  
  * 4.6.2. Sub-Sub-Heading: Non-Functional Requirements (NFR-01 to NFR-08) ................... 98  
* **4.7. Sub Heading: Chapter Summary** .......................................................................... 100  

<br>

### 5. MAIN HEADING: SYSTEM IMPLEMENTATION AND DESIGNING ........................... 101
* **5.1. Sub Heading: Chapter Overview** .......................................................................... 101  
* **5.2. Sub Heading: Core Architectural Framework and Pipeline Execution** ...................... 102  
  * 5.2.1. Sub-Sub-Heading: Repository Ingestion and AST Parsing Pipeline ........................ 103  
  * 5.2.2. Sub-Sub-Heading: Recommendation Reasoning Engine and Heuristics ................. 106  
* **5.3. Sub Heading: Algorithmic Formulations and Mathematical Models** .......................... 109  
  * 5.3.1. Sub-Sub-Heading: Cloud Resource Matching and Sizing Algorithm ..................... 109  
  * 5.3.2. Sub-Sub-Heading: IaC Synthesis and Jinja2 Workflow Compilation Logic .............. 113  
* **5.4. Sub Heading: Technology Stack Selection and Justification** .................................... 116  
  * 5.4.1. Sub-Sub-Heading: Backend Framework and Language Selection (Python/FastAPI) .. 116  
  * 5.4.2. Sub-Sub-Heading: Template Engines, IaC Tooling, and Cloud SDKs ...................... 119  
* **5.5. Sub Heading: Critical Implementation Modules and Execution Evidence** ................ 122  
  * 5.5.1. Sub-Sub-Heading: Automated Workflow Generation and Cloud Teardown Engines 122  
  * 5.5.2. Sub-Sub-Heading: Multi-Cloud Instance Pricing and Sizing Engine ....................... 126  
* **5.6. Sub Heading: Chapter Summary** .......................................................................... 129  

<br>

### 6. MAIN HEADING: TESTING, VERIFICATION AND EVALUATION ............................ 130
* **6.1. Sub Heading: Chapter Overview** .......................................................................... 130  
* **6.2. Sub Heading: Testing Strategy and Evaluation Methodology** .................................. 131  
* **6.3. Sub Heading: Functional Verification and Test Cases** ............................................ 133  
  * 6.3.1. Sub-Sub-Heading: Unit and Integration Test Plan ............................................. 133  
  * 6.3.2. Sub-Sub-Heading: Selected High-Impact Functional Test Execution ...................... 136  
* **6.4. Sub Heading: Non-Functional and Performance Evaluation** .................................... 139  
  * 6.4.1. Sub-Sub-Heading: Generation Latency and System Throughput Benchmarks ......... 139  
  * 6.4.2. Sub-Sub-Heading: Synthesized IaC Validity and Cloud Deployment Success Rate ... 142  
* **6.5. Sub Heading: Cost-Efficiency and Recommendation Accuracy Analysis** ................... 145  
  * 6.5.1. Sub-Sub-Heading: Benchmark Evaluation Against Expert DevOps Architectures .... 145  
  * 6.5.2. Sub-Sub-Heading: Cost Savings Analysis Across AWS and Heterogeneous Clouds ... 148  
* **6.6. Sub Heading: Review and Discussion of Evaluation Findings** ................................. 151  
* **6.7. Sub Heading: Chapter Summary** .......................................................................... 153  

<br>

### 7. MAIN HEADING: CONCLUDING REMARKS AND FUTURE WORK ........................... 154
* **7.1. Sub Heading: Chapter Overview** .......................................................................... 154  
* **7.2. Sub Heading: Triangulation and Accomplishment of Research Objectives** ............... 155  
  * 7.2.1. Sub-Sub-Heading: Evidence-Based Objective Verification ................................... 155  
  * 7.2.2. Sub-Sub-Heading: Addressing the Core Research Questions ................................ 158  
* **7.3. Sub Heading: Technical Challenges and Problems Encountered** .............................. 160  
  * 7.3.1. Sub-Sub-Heading: API Inconsistencies and Rate Limiting Across Cloud Vendors .... 160  
  * 7.3.2. Sub-Sub-Heading: Polyglot Application Boundary and Dependency Inference ....... 162  
  * 7.3.3. Sub-Sub-Heading: Runtime Injection of Project Environment Variables ............... 164  
* **7.4. Sub Heading: Academic and Practical Self-Reflection** ............................................ 166  
  * 7.4.1. Sub-Sub-Heading: Technical Competencies and Learning Curves ........................ 166  
  * 7.4.2. Sub-Sub-Heading: Methodological Maturity and Engineering Trade-Offs ............... 168  
* **7.5. Sub Heading: Commercial Viability and Real-World Application Potential** .............. 170  
  * 7.5.1. Sub-Sub-Heading: SaaS Productization and Market Opportunities ....................... 170  
  * 7.5.2. Sub-Sub-Heading: Enterprise DevOps Pipeline Integration Scenarios ................... 172  
* **7.6. Sub Heading: Future Research Recommendations and Roadmap** ........................... 174  
  * 7.6.1. Sub-Sub-Heading: Dynamic UI for Runtime Environment Variable Injection ....... 174  
  * 7.6.2. Sub-Sub-Heading: Live Multi-Cloud Telemetry Feedback Loop for Autoscaling ...... 176  
* **7.7. Sub Heading: Concluding Remarks** ...................................................................... 178  

<br>

### BACK MATTER ....................................................................................................... 179
* **References (IEEE Format)** ....................................................................................... 179  
* **Appendix A: Extended Functional Test Case Specifications (TC-11 to TC-25)** ................ 187  
* **Appendix B: Synthesized Jinja2 Workflow and Teardown Templates** ........................... 193  
* **Appendix C: Benchmarked Repositories and Empirical Cost Matrices** .......................... 198  

<!-- PAGE BREAK: LIST OF FIGURES -->
<div style="page-break-before: always;"></div>

---

# LIST OF FIGURES

* **Figure 1.1:** Rich Picture of Code2Cloud Automation Workflow and Stakeholder Interactions ................................................................................................................. 17  
* **Figure 2.1:** Conceptual Taxonomy of Cloud Provisioning and Automated IaC Literature ........................................................................................................................ 24  
* **Figure 3.1:** Sequential Design Science Research (DSR) Methodology Lifecycle for Code2Cloud ............................................................................................................ 65  
* **Figure 3.2:** Project Implementation Timeline and Work Breakdown Structure (Gantt Chart) ........................................................................................................................ 69  
* **Figure 4.1:** Code2Cloud Comprehensive System Use Case Diagram ............................... 84  
* **Figure 4.2:** Domain Object Model and Backend Entity Architecture (Class Diagram) .... 87  
* **Figure 4.3:** Activity Diagram for Automated Repository Parsing and Recommendation Pipeline ....................................................................................................................... 89  
* **Figure 4.4:** Sequence Diagram for Multi-Cloud IaC Synthesis and Workflow Orchestration ............................................................................................................... 91  
* **Figure 4.5:** System Deployment Topology and Cloud SDK Runtime Environment ........... 93  
* **Figure 4.6:** Multi-Tier Modular System Architecture of Code2Cloud .............................. 95  
* **Figure 5.1:** End-to-End Ingestion, Analysis, and Generation Pipeline Block Diagram ....... 104  
* **Figure 5.2:** Execution Evidence of Automated Provisioning and Teardown Workflow in GitHub Actions on AWS ............................................................................................. 128  
* **Figure 6.1:** Multidimensional Verification and Validation Testing Hierarchy ................. 132  
* **Figure 6.2:** Analysis of Infrastructure Synthesis Latency Across Repository Complexities ................................................................................................................. 141  

<!-- PAGE BREAK: LIST OF TABLES -->
<div style="page-break-before: always;"></div>

---

# LIST OF TABLES

*(Note: In accordance with specified dissertation formatting standards, all table titles and captions are positioned directly underneath the respective table).*

<br>

* **Table 1.1:** In-Scope versus Out-of-Scope Functional Matrix ....................................... 21  
* **Table 2.1:** Comparative Analysis of State-of-the-Art Cloud Recommendation Frameworks ................................................................................................................. 36  
* **Table 3.1:** Mapping of DSR Phases to Methodological Techniques, Data Sources, and Deliverables ................................................................................................................. 64  
* **Table 4.1:** Operationalization Matrix Linking Research Objectives to Functional Specifications ................................................................................................................. 81  
* **Table 5.1:** Technology Stack Selection and Architectural Justification Matrix ............... 120  
* **Table 6.1:** Master Functional Test Case Execution and Verification Matrix (TC-01 to TC-10) ........................................................................................................................ 137  
* **Table 6.2:** Monthly Infrastructure Cost Comparison: Default Provisioning vs. Code2Cloud Optimized Allocations ................................................................................. 149  
* **Table 7.1:** Research Objectives Triangulation and Verification Matrix ........................... 156  

<!-- PAGE BREAK: LIST OF ABBREVIATIONS -->
<div style="page-break-before: always;"></div>

---

# LIST OF ABBREVIATIONS & ACRONYMS

* **ACM:** Association for Computing Machinery
* **API:** Application Programming Interface
* **AST:** Abstract Syntax Tree
* **AWS:** Amazon Web Services
* **CD/CD:** Continuous Integration / Continuous Deployment
* **CLI:** Command Line Interface
* **CSP:** Cloud Service Provider
* **DOM:** Document Object Model
* **DSR:** Design Science Research
* **EC2:** Amazon Elastic Compute Cloud
* **ECS:** Amazon Elastic Container Service
* **GCP:** Google Cloud Platform
* **HCL:** HashiCorp Configuration Language
* **HTTP:** Hypertext Transfer Protocol
* **IaC:** Infrastructure as Code
* **IDE:** Integrated Development Environment
* **IEEE:** Institute of Electrical and Electronics Engineers
* **JSON:** JavaScript Object Notation
* **LLM:** Large Language Model
* **NFR:** Non-Functional Requirement
* **OS:** Operating System
* **PaaS:** Platform as a Service
* **REST:** Representational State Transfer
* **SDK:** Software Development Kit
* **SRS:** System Requirement Specification
* **UI:** User Interface
* **UML:** Unified Modeling Language
* **URI:** Uniform Resource Identifier
* **vCPU:** Virtual Central Processing Unit
* **VPC:** Virtual Private Cloud
* **WBS:** Work Breakdown Structure
* **YAML:** YAML Ain't Markup Language
