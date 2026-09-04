# Master Thesis Outline & Drafting Roadmap
## Automated Cloud Infrastructure Recommendation System with Terraform and Docker Generation for Web Applications (Code2Cloud)

* **Degree:** Bachelor of Science in Software Engineering, Faculty of Computing, NSBM Green University
* **Target Volume:** 110 – 130 Pages (~38,000 – 45,000 words)
* **Supervisor / Reviewer / Lecturer:** Mr. Diluka Wijesinghe
* **Author / Researcher:** Mahamalage Yasindu Binod Perera (Index: 28556)

---

## Academic & Formatting Guidelines Checklist

Ensure each drafted section strictly complies with these mandatory dissertation regulations:
- [ ] **Typography:** Font family strictly **Times New Roman**, regular color **Black**.
- [ ] **Heading Styles & Hierarchy:**
  - **Main Headings (Level 1):** `16pt`, **Bold**, **Black**. *Must start on a new page.*
  - **Sub-Headings (Level 2):** `14pt`, **Bold**, **Black**. *Must start on a new page.*
  - **Sub-Sub-Headings (Level 3):** `12pt`, **Bold**, **Black**.
  - **Normal / Body Text:** `12pt` (`12px`), **Regular**, **Black** (1.5 line spacing, justified/left aligned).
- [ ] **Subsection Rule:** If a section is divided into subsections, it must contain a **minimum of two subsections** (e.g., if there is `1.3.1`, there must be at least `1.3.2`; never leave a single isolated sub-heading).
- [ ] **Section Numbering Format:**
  - `1.` Main Heading
  - `1.1.` Sub-Heading
  - `1.1.1.` Sub-Sub-Heading
- [ ] **Paragraph Construction:** Every paragraph must consist of a **minimum of three complete sentences**. Fragmented single-sentence bullets are prohibited.
- [ ] **Referencing Standard:** Strict **IEEE Referencing Style** (in-text numeric bracket notation such as `[1]`, `[2]--[4]`, with a formal IEEE bibliography at the end).
- [ ] **Originality & Turnitin Compliance:** Humanized, scholarly academic tone focusing on technical architecture, design science methodology, and empirical evaluations. Avoid generic AI fluff phrases.
- [ ] **Tables:** Used selectively. **Table titles/captions must be placed directly UNDER the table**.
- [ ] **Figures:** Explicit figure placeholders with high-resolution system diagrams, charts, and workflow schemas. Captions placed directly under the figure (`Figure X.Y: Description`).
- [ ] **Page Break Rule:** Each major section / chapter must start on a **new page**.

---

## Global Page & Word Count Budget Allocation

| Chapter | Title | Target Pages | Target Word Count | Completion Status |
| :--- | :--- | :--- | :--- | :--- |
| **Front Matter** | Abstract, Declarations, TOC, Lists | ~6–8 pages | ~1,800 words | `[x] Completed` |
| **Chapter 1** | Introduction & Problem Background | ~14–16 pages | ~4,200 words | `[x] Completed` |
| **Chapter 2** | Literature Review & Technological Analysis | ~20–24 pages | ~6,800 words | `[x] Completed` |
| **Chapter 3** | Research Methodology & Framework | ~14–16 pages | ~4,500 words | `[x] Completed` |
| **Chapter 4** | System Requirement Specification (SRS) | ~18–22 pages | ~5,800 words | `[x] Completed` |
| **Chapter 5** | System Implementation & Designing | ~22–26 pages | ~7,500 words | `[x] Completed` |
| **Chapter 6** | Testing, Verification & Empirical Evaluation | ~16–18 pages | ~5,000 words | `[x] Completed` |
| **Chapter 7** | Concluding Remarks, Self-Reflection & Future Work | ~8–10 pages | ~2,800 words | `[x] Completed` |
| **Back Matter** | IEEE References & Appendices | ~10–14 pages | ~3,500 words | `[x] Completed` |
| **TOTAL** | | **~118–134 Pages** | **~41,900+ Words** | **Drafting Complete (100%)** |

---

## FRONT MATTER (Target: ~6–8 Pages)

- [x] **Title Page:** Standard NSBM Green University Faculty of Computing layout.
- [x] **Declaration of Authorship:** Formal declaration of originality and independent research work.
- [x] **Abstract (Structured ~500 words):**
  - Background & Motivation
  - Problem Statement
  - Proposed Solution (Code2Cloud engine)
  - Research Methodology & Validation
  - Key Findings & Significance
- [x] **Acknowledgements:** Special formal acknowledgement expressing profound gratitude to lecturer **Mr. Diluka Wijesinghe** for intellectual guidance, constructive feedback, and continuous academic mentorship throughout the research endeavor, alongside thanks to the faculty, evaluators, and colleagues.
- [x] **Table of Contents:** Auto-generated hierarchy covering down to Level 3 headings.
- [x] **List of Figures:** Detailed figure list with accurate page references.
- [x] **List of Tables:** Detailed table list with accurate page references.
- [x] **List of Abbreviations & Acronyms:** Definitions for IaC, AST, CSP, vCPU, RAM, CI/CD, AWS, GCP, Azure, CLI, REST, JSON.

---

## CHAPTER 1: INTRODUCTION (Target: ~14–16 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **1.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).
  - Summarizes the structural path of Chapter 1, setting the background, research questions, motivation, objectives, resource requirements, and project scope.

- [x] **1.2. Problem Background** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~3–4 pages (~1,000 words).
  - Rapid shift toward cloud computing and containerized deployments across AWS, Azure, GCP, and DigitalOcean.
  - The cognitive burden on developers when navigating thousands of cloud instance types and configuring Infrastructure as Code (Terraform, Dockerfiles).
  - Empirical industry statistics on cloud misconfiguration and resource over-provisioning.

- [x] **1.3. Problem Statement** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2–3 pages (~800 words).
  - **1.3.1. General Problem** *(Sub-Sub-Heading: 12pt Bold Black)*
    - High-level cost waste, security vulnerabilities, and deployment delays caused by manual infrastructure provisioning.
  - **1.3.2. Specific Problem & Research Gap** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Lack of automated, deterministic mechanisms to analyze application source code repositories directly, infer runtime footprints, and synthesize verified multi-cloud Terraform templates and automated teardown workflows.

- [x] **1.4. Research Questions** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~450 words).
  - **1.4.1. Primary Research Question** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *“How can static code analysis and heuristic optimization be synthesized to automate cloud infrastructure recommendation and generate production-ready Terraform configurations and Docker orchestration workflows for web applications?”*
  - **1.4.2. Specific Sub-Research Questions** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *RQ1:* How accurately can static repository parsing infer runtime dependencies, ports, and resource demands?
    - *RQ2:* What multi-criteria decision models best balance cost versus compute performance across heterogeneous cloud providers?

- [x] **1.5. Research Motivation** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - **1.5.1. Technical and Developer Productivity Drivers** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Bridging the gap between software development and DevOps operations without requiring steep IaC learning curves.
  - **1.5.2. Economic Impact and Cloud Waste Reduction** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Mitigating underutilized cloud instances and unmonitored orphan resources through automated lifecycle management.

- [x] **1.6. Research Aim and Objectives** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - **1.6.1. Primary Research Aim** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Develop, evaluate, and benchmark Code2Cloud, an automated cloud infrastructure recommendation and code synthesis engine.
  - **1.6.2. Specific Research Objectives** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Objective 1:* To Identify common architectural bottlenecks, configuration patterns, and developer requirements in web application deployments.
    - *Objective 2:* To Analyze repository structures, runtime dependencies, and multi-cloud instance pricing models.
    - *Objective 3:* To Design and Develop the Code2Cloud engine incorporating AST parsing, pricing recommendation algorithms, and Jinja2-based workflow synthesizers.
    - *Objective 4:* To Evaluate the system against manual expert deployments in terms of cost efficiency, generation speed, and syntactic validity.

- [x] **1.7. Rich Picture of the Proposed Solution** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~450 words).
  - Detailed narrative walking through the developer workflow: GitHub repo input $\rightarrow$ static scanning $\rightarrow$ recommendation $\rightarrow$ Terraform/Docker generation $\rightarrow$ teardown lifecycle.
  - *Include Figure:* `Figure 1.1: Rich Picture of Code2Cloud Automation Workflow and Stakeholder Interactions`.

- [x] **1.8. Resource Requirements** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~400 words).
  - **1.8.1. Hardware Requirements** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Development workstations, memory, CPU thresholds for AST execution.
  - **1.8.2. Software & Cloud Requirements** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Python 3.10+, FastAPI, Docker Engine, Terraform CLI, AWS SDK (Boto3), GitHub Actions runtime.

- [x] **1.9. Project Scope** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~500 words).
  - Explicit boundaries of supported languages (Python, Node.js, etc.) and cloud targets (AWS, GCP, Azure, DigitalOcean).
  - *Include Table:* `Table 1.1: In-Scope versus Out-of-Scope Functional Matrix` *(Caption placed under the table)*.

- [x] **1.10. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).
  - Concise synthesis of Chapter 1 foundations and transition into the literature review.

---

## CHAPTER 2: LITERATURE REVIEW (Target: ~20–24 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **2.1. Chapter Overview and Conceptual Map** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - Visual classification and taxonomy of surveyed literature across cloud provisioning, IaC generation, and static code analysis.
  - *Include Figure:* `Figure 2.1: Conceptual Map of Cloud Infrastructure and Automated IaC Literature`.

- [x] **2.2. Domain Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~4–5 pages (~1,400 words).
  - **2.2.1. Evolution of Cloud Infrastructure and Multi-Cloud Architectures** *(Sub-Sub-Heading: 12pt Bold Black)*
    - IaaS, PaaS, containerization, and modern multi-cloud deployment challenges.
  - **2.2.2. Infrastructure as Code (IaC) and Declarative Configuration Paradigms** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Terraform HCL, Ansible, Dockerfile standards, and automated deployment pipelines.

- [x] **2.3. Critical Review of Existing Systems and Frameworks** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~6–7 pages (~2,000 words).
  - **2.3.1. Commercial Cloud Management and Deployment Platforms** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Detailed appraisal of AWS CloudFormation, AWS CDK, Pulumi, Heroku, and Railway.
  - **2.3.2. Academic and Research Prototypes in Automated Cloud Sizing** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Review of existing rule-based and ML-driven recommendation frameworks; strengths, weaknesses, and omissions.
  - *Include Table:* `Table 2.1: Comparative Feature Matrix of Existing Cloud Recommendation Tools` *(Caption under table)*.

- [x] **2.4. Technological and Algorithmic Analysis** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~5–6 pages (~1,700 words).
  - **2.4.1. Static Code Analysis and Abstract Syntax Tree (AST) Parsing Techniques** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Lexical scanning, runtime detection, dependency manifest inspection (`package.json`, `requirements.txt`).
  - **2.4.2. Cloud Pricing Heuristics and Multi-Criteria Optimization Algorithms** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Cost-performance Pareto frontiers, instance family mapping, spot vs. on-demand strategies.
  - **2.4.3. Template Synthesis and Dynamic Code Generation Engines** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Jinja2 templating, syntax validation, deterministic template generation.

- [x] **2.5. Identification of the Research Gap and Critical Reflection** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2–3 pages (~800 words).
  - **2.5.1. Shortcomings in Current Literature and Tools** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **2.5.2. Justification and Novelty of the Code2Cloud Architecture** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **2.6. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

---

## CHAPTER 3: RESEARCH METHODOLOGY (Target: ~14–16 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **3.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

- [x] **3.2. Research Paradigm and Philosophy** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~3 pages (~900 words).
  - **3.2.1. Pragmatism Paradigm Justification** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Philosophical stance reconciling empirical testing with practical software engineering artifacts.
  - **3.2.2. Design Science Research (DSR) Grounding** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Peffers et al. DSR model: Problem Identification $\rightarrow$ Objectives $\rightarrow$ Design & Development $\rightarrow$ Demonstration $\rightarrow$ Evaluation $\rightarrow$ Communication.

- [x] **3.3. Research Approach and Strategy** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2.5 pages (~800 words).
  - **3.3.1. Deductive and Constructive Research Approach** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **3.3.2. Experimental Prototyping and Benchmarking Strategy** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **3.4. Fact Collection Mechanisms and Data Gathering** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2.5 pages (~800 words).
  - **3.4.1. Open-Source Benchmark Repository Dataset** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Selection criteria for web application repositories used in benchmarking.
  - **3.4.2. Cloud Pricing and Specification Telemetry Ingestion** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Dynamic harvesting of AWS, GCP, and Azure pricing APIs.

- [x] **3.5. Research Methodology Execution Workflow** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2.5 pages (~800 words).
  - Stage-by-stage mapping table and procedural diagram.
  - *Include Table:* `Table 3.1: DSR Research Phases Mapped to Methodological Techniques and Artifacts` *(Caption under table)*.
  - *Include Figure:* `Figure 3.1: Sequential DSR Research Lifecycle of Code2Cloud`.

- [x] **3.6. Project Management Methodology** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - **3.6.1. Agile/Scrum Implementation** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **3.6.2. Sprint Cadence, Milestones, and Work Breakdown Structure (WBS)** *(Sub-Sub-Heading: 12pt Bold Black)*
  - *Include Figure:* `Figure 3.2: Project Timeline and Implementation Gantt Chart`.

- [x] **3.7. Ethical Considerations and Data Integrity** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~450 words).
  - **3.7.1. Intellectual Property and Open-Source Licensing Compliance** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **3.7.2. Cloud Security and Credential Isolation Protocols** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **3.8. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

---

## CHAPTER 4: SYSTEM REQUIREMENT SPECIFICATION (Target: ~18–22 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **4.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

- [x] **4.2. Stakeholder Analysis and User Personas** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2.5 pages (~750 words).
  - **4.2.1. Primary and Secondary Stakeholder Classification** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **4.2.2. User Persona Profiles (Software Developers, DevOps Specialists)** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **4.3. Operationalization Process** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - Mapping research objectives and data collection directly to system requirements.
  - *Include Table:* `Table 4.1: Operationalization Matrix Linking Research Objectives to System Modules` *(Caption under table)*.

- [x] **4.4. System Analysis and UML Modeling** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~8–9 pages (~2,500 words).
  - **4.4.1. Use Case Modeling and Detailed Specifications** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Figure:* `Figure 4.1: Code2Cloud Comprehensive System Use Case Diagram`.
    - Detailed narrative for top 3 critical use cases.
  - **4.4.2. Static Domain Modeling (Class Diagram)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Figure:* `Figure 4.2: Code2Cloud Domain Model and Backend Class Architecture`.
  - **4.4.3. Dynamic Behavioral Modeling (Activity Diagram)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Figure:* `Figure 4.3: Activity Diagram for Repository Scanning and IaC Generation Pipeline`.
  - **4.4.4. Interaction Modeling (Sequence Diagrams)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Figure:* `Figure 4.4: Sequence Diagram for Cloud Infrastructure Recommendation and Teardown Workflow`.
  - **4.4.5. Deployment Topology (Deployment Diagram)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Figure:* `Figure 4.5: Code2Cloud Deployment Diagram showing Container Runtime and Cloud SDK Integration`.

- [x] **4.5. System Architecture Specification** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~3 pages (~900 words).
  - Multi-tier architectural description (Presentation Layer, FastAPI Backend, Scanner Engine, Jinja2 Template Engine, Cloud Connector).
  - *Include Figure:* `Figure 4.6: Multi-Tier Modular System Architecture of Code2Cloud`.

- [x] **4.6. Functional and Non-Functional Requirements** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~3 pages (~900 words).
  - **4.6.1. Functional Requirements (FR-01 through FR-15)** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **4.6.2. Non-Functional Requirements (NFR-01 through NFR-08)** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **4.7. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

---

## CHAPTER 5: IMPLEMENTATION AND DESIGNING (Target: ~22–26 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **5.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

- [x] **5.2. Core Architectural Framework & Pipeline Execution** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~5 pages (~1,600 words).
  - *Include Figure:* `Figure 5.1: End-to-End Ingestion, Analysis, and Generation Pipeline Block Diagram`.
  - **5.2.1. Repository Ingestion and AST Parsing Pipeline** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Extracting dependencies, port bindings, database connection strings, environment flags.
  - **5.2.2. Multi-Cloud Instance Sizing and Recommendation Logic** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Mapping memory, compute bounds, and network requirements to instance types (e.g., t3.medium, e2-medium).

- [x] **5.3. Algorithmic Formulations and Logic Design** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~5 pages (~1,600 words).
  - **5.3.1. Cost-Performance Sizing Algorithm** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Mathematical formulation of instance scoring function.
    - *Algorithm 5.1: Multi-Cloud Instance Sizing and Cost Optimization Algorithm (Formal Pseudocode)*.
  - **5.3.2. Automated Workflow and Teardown Synthesis Logic** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Dynamic synthesis of CI/CD orchestration scripts and safe resource teardown workflows.
    - *Algorithm 5.2: Jinja2-Driven Infrastructure and Teardown Workflow Synthesizer (Formal Pseudocode)*.

- [x] **5.4. Technology Stack Justification** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~3 pages (~900 words).
  - **5.4.1. Backend and Analysis Technologies (Python, FastAPI, Pydantic)** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **5.4.2. Templating, IaC, and Container Runtimes (Jinja2, Terraform, Docker)** *(Sub-Sub-Heading: 12pt Bold Black)*
  - *Include Table:* `Table 5.1: Technology Stack Evaluation and Selection Justification Matrix` *(Caption under table)*.

- [x] **5.5. Critical Implementation Modules and Execution Evidence** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~8 pages (~2,500 words).
  - *Focus on actual novel code logic (avoiding basic auth/login):*
  - **5.5.1. Dynamic Workflow Generator (`service_generator.py`) and Automated Teardown Engine (`aws_destroy.jinja`)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Code walkthrough, parameter binding, state management, and teardown verification.
  - **5.5.2. Multi-Cloud Pricing Aggregator and Sizing Engine** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Implementation of cloud pricing ingest, normalization across AWS, GCP, and Azure.
  - *Include Figure:* `Figure 5.2: Terminal and GitHub Actions Execution Evidence for Automated Cloud Provisioning and Teardown`.

- [x] **5.6. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

---

## CHAPTER 6: TESTING, VERIFICATION AND EVALUATION (Target: ~16–18 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **6.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

- [x] **6.2. Testing and Evaluation Strategy** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2 pages (~600 words).
  - Multidimensional validation strategy: Syntactic unit testing, end-to-end integration, empirical cost benchmarks, and deployment success verification.
  - *Include Figure:* `Figure 6.1: Multidimensional Testing and Evaluation Hierarchy`.

- [x] **6.3. Functional Verification and Test Cases** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~4 pages (~1,200 words).
  - **6.3.1. Unit and Integration Test Strategy** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **6.3.2. Execution of High-Impact Test Cases (TC-01 through TC-10)** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Table:* `Table 6.1: Functional Test Case Results for Scanner and Generator Engines` *(Caption under table)*.

- [x] **6.4. Non-Functional and Performance Evaluation** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~4 pages (~1,200 words).
  - **6.4.1. Processing Latency and Generation Throughput** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Benchmark timings across repositories of varying sizes (small, medium, microservices).
    - *Include Figure:* `Figure 6.2: Generation Latency across Varying Repository Complexities`.
  - **6.4.2. Syntactic Validity and Terraform Deployment Success Rate** *(Sub-Sub-Heading: 12pt Bold Black)*
    - Percentage of generated Terraform configurations passing `terraform validate` and `terraform apply`.

- [x] **6.5. Empirical Cost Efficiency and Recommendation Benchmarks** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~4 pages (~1,200 words).
  - **6.5.1. Accuracy Evaluation Against Expert DevOps Baselines** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **6.5.2. Monthly Cost Optimization Analysis Across Cloud Providers** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Table:* `Table 6.2: Comparative Monthly Cost Savings: Default Provisioning vs. Code2Cloud Optimized Allocations` *(Caption under table)*.

- [x] **6.6. Chapter Summary** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).

---

## CHAPTER 7: CONCLUDING REMARKS, SELF-REFLECTION & FUTURE WORK (Target: ~8–10 Pages)
*(Starts on a new page | Main Heading: 16pt Bold Black)*

- [x] **7.1. Chapter Overview** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~0.5 page (~150 words).

- [x] **7.2. Accomplishment of Research Objectives (Triangulation)** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~2.5 pages (~800 words).
  - **7.2.1. Triangulation Matrix: Objectives, Implementations, and Empirical Results** *(Sub-Sub-Heading: 12pt Bold Black)*
    - *Include Table:* `Table 7.1: Research Objectives Triangulation and Verification Matrix` *(Caption under table)*.
  - **7.2.2. Addressing the Core Research Questions** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **7.3. Technical Challenges and Problems Encountered** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~450 words).
  - **7.3.1. API Inconsistencies and Rate Limiting Across Cloud Vendors** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **7.3.2. Polyglot Application Boundary and Dynamic Dependency Inference** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **7.3.3. Runtime Injection and State Management of Project Environment Variables** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **7.4. Self-Reflection and Academic Growth** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1.5 pages (~450 words).
  - **7.4.1. Technical Competencies and Architectural Learning Curves** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **7.4.2. Research Methodology Maturity and Engineering Trade-Offs** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **7.5. Commercial Viability and Real-World Application** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).
  - **7.5.1. SaaS Productization and Market Opportunities** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **7.5.2. Integration into CI/CD Platforms and Enterprise Developer Portals** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **7.6. Future Recommendations and Research Roadmap** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~1 page (~300 words).
  - **7.6.1. Dynamic User Interface for Runtime Environment Variable Injection** *(Sub-Sub-Heading: 12pt Bold Black)*
  - **7.6.2. Live Multi-Cloud Telemetry Feedback Loop for Dynamic Autoscaling** *(Sub-Sub-Heading: 12pt Bold Black)*

- [x] **7.7. Concluding Remarks** *(New page | Sub-heading: 14pt Bold Black)*
  - Target: ~0.5 page (~200 words).

---

## BACK MATTER (Target: ~10–14 Pages)

- [x] **References:**
  - Strict IEEE format (`[1]`, `[2]`, ...).
  - Comprehensive peer-reviewed IEEE, ACM, Springer, and top-tier cloud conference citations.
- [x] **Appendix A: Extended Functional and Integration Test Cases (TC-11 through TC-25)**
- [x] **Appendix B: Jinja2 Workflow and Teardown Template Definitions (`aws_destroy.jinja`, Terraform templates)**
- [x] **Appendix C: Benchmarked Repositories and Experimental Datasets**
