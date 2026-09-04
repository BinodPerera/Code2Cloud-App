<!--
================================================================================
DISSERTATION CHAPTER 04: SYSTEM REQUIREMENT SPECIFICATION (SRS)
Font: Times New Roman | Base Color: Black
Formatting Rules:
- Main Headings: 16pt, Bold, Black (Starts on a new page)
- Sub-Headings: 14pt, Bold, Black (Starts on a new page)
- Sub-Sub-Headings: 12pt, Bold, Black
- Normal / Body Text: 12pt (12px), Regular, Black
- Minimum 2 subsections per subdivision
- Minimum 3 complete sentences per paragraph
- Page breaks explicitly demarcated before every major section
- Table captions placed strictly UNDER the table
- Figure placeholders clearly defined with captions UNDER the figure
- IEEE Referencing Style adhered to throughout
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


<!-- PAGE BREAK: CHAPTER 4 MAIN HEADING -->
<div style="page-break-before: always;"></div>

<br>

# 4. MAIN HEADING: SYSTEM REQUIREMENT SPECIFICATION

The rigorous engineering of an automated cloud infrastructure platform requires translating high-level research objectives into verifiable, deterministic software specifications [10]. In modern software engineering, the System Requirement Specification (SRS) serves as the authoritative contract governing system boundaries, user interactions, structural data models, and behavioral constraints [12]. Without an exhaustive requirements framework, automated code generation systems risk producing unverified infrastructure topologies that compromise system security or fail during continuous integration deployments [11].

This chapter articulates the complete System Requirement Specification and architectural design models for **Code2Cloud**. The specification begins by identifying key stakeholders and modeling user personas, followed by an operationalization process that formally links the study's research objectives to functional software modules. Furthermore, the chapter details extensive Unified Modeling Language (UML) representations—encompassing Use Case, Class, Activity, Sequence, and Deployment diagrams—alongside a multi-tier architectural blueprint. Finally, fifteen granular Functional Requirements (FRs) and eight Non-Functional Requirements (NFRs) are formalized to establish strict quality benchmarks for implementation and testing.

<!-- PAGE BREAK: SECTION 4.1 -->
<div style="page-break-before: always;"></div>

---

## 4.1. Sub Heading: Chapter Overview

The objective of this chapter is to provide an exhaustive technical and behavioral specification for the Code2Cloud platform. Transitioning from the methodological principles articulated in Chapter 3, this chapter defines the precise structural mechanics required to transform raw application source code into production-hardened Terraform configurations, Docker containers, and automated cloud teardown pipelines. The chapter is structured to guide the reader through progressive abstraction layers, from stakeholder identification to structural UML modeling and requirement cataloging.

The chapter opens in Section 4.2 with a comprehensive stakeholder analysis and developer persona profiles. Section 4.3 presents the operationalization process, deploying a structured matrix that traces the four core research objectives directly into functional system components. Section 4.4 forms the core modeling foundation, providing five dedicated UML specifications: detailed Use Case specifications, domain Class diagrams, behavioral Activity workflows, interaction Sequence flows, and physical Deployment diagrams.

In Section 4.5, the overarching multi-tier system architecture is detailed, explaining the separation of concerns across presentation, asynchronous orchestration, static analysis, and cloud provider adapters. Section 4.6 formalizes the functional requirements (FR-01 through FR-15) and non-functional quality attributes (NFR-01 through NFR-08) governing performance, determinism, and security. Finally, Section 4.7 summarizes the specification milestones, bridging the design specifications into the implementation chapter.

<!-- PAGE BREAK: SECTION 4.2 -->
<div style="page-break-before: always;"></div>

---

## 4.2. Sub Heading: Stakeholder Analysis and User Personas

A user-centric software architecture requires identifying all individuals, roles, and systems that interact with or are impacted by the platform [10]. The stakeholder landscape for Code2Cloud spans diverse technical competencies, from junior web developers to enterprise infrastructure directors.

### 4.2.1. Sub-Sub-Heading: Primary and Secondary Stakeholder Categorization

Stakeholders are categorized into primary and secondary classifications based on their direct operational proximity to the platform:

1. **Primary Stakeholders (Direct Users):**
   * **Full-Stack & Backend Software Engineers:** Developers seeking to deploy web applications rapidly to the cloud without undergoing steep Infrastructure as Code (IaC) learning curves or managing manual cloud consoles.
   * **DevOps & Site Reliability Engineers (SREs):** Infrastructure practitioners requiring verified, standardized Terraform modules, deterministic containerization definitions, and automated teardown capabilities to prevent environmental drift and orphan resource waste.
2. **Secondary Stakeholders (Organizational & Beneficiary Roles):**
   * **Engineering Managers & FinOps Practitioners:** Financial stewards and team leads concerned with tracking compute budgets, reducing cloud over-provisioning expenditures, and enforcing cost governance from day one.
   * **Academic Evaluators & Cloud Researchers:** Scholars evaluating the algorithmic validity of pre-deployment static code analysis, multi-criteria resource optimization, and LLM-assisted code synthesis.

### 4.2.2. Sub-Sub-Heading: Developer and DevOps Engineer Persona Profiles

To anchor software design decisions in authentic developer workflows, two detailed user personas were synthesized:

* **Persona 1: Alex - The Startup Full-Stack Developer**
  * *Profile:* 3 years of experience building Node.js (Express) and Python (FastAPI) applications. Highly skilled in frontend and backend business logic, but possesses minimal experience with cloud networking, VPC peering, and Terraform syntax.
  * *Pain Points:* Struggles to select appropriate AWS EC2 instance types, fears unexpected cloud billing spikes, and routinely copies unverified Dockerfiles from online forums that contain root privileges and security vulnerabilities.
  * *Goal:* Wants to provide a GitHub repository link and immediately receive a verified, production-ready cloud deployment package with a single-click teardown mechanism.
* **Persona 2: Marcus - The Lead DevOps / Infrastructure Engineer**
  * *Profile:* 8 years of enterprise infrastructure experience managing large multi-cloud topologies across AWS and GCP. Responsible for enforcing architectural compliance, security policies, and cost governance.
  * *Pain Points:* Frustrated by application developers leaving provisioned test clusters active over weekends (cost leakage) and spending significant engineering hours manually writing boilerplate Terraform configurations for new microservices.
  * *Goal:* Needs an automated framework that generates standard-compliant, modular Terraform templates (`main.tf`, `variables.tf`, `outputs.tf`) containing built-in lifecycle teardown workflows (`aws_destroy.jinja`).

<!-- PAGE BREAK: SECTION 4.3 -->
<div style="page-break-before: always;"></div>

---

## 4.3. Sub Heading: Operationalization Process

The operationalization process bridges the conceptual research objectives established in Chapter 1 with concrete software engineering specifications [12]. By decomposing each academic objective into measurable technical requirements, data-handling techniques, and verifiable outputs, this process ensures that the resulting software artifact directly addresses the research gap. Table 4.1 presents the complete operationalization matrix.

<br>

| Research Objective | Specific Technical Challenge | Methodological & Engineering Technique | Concrete System Module / Functional Output |
| :--- | :--- | :--- | :--- |
| **Objective 1:** Identify developer requirements and provisioning pain points. | Overcoming cloud sizing cognitive friction and eliminating security smells in IaC scripts. | Literature analysis, survey data synthesis, and comparative analysis of cloud catalogs (`[1]`, `[11]`). | Persona definitions, SRS functional requirements (FR-01 to FR-15), Scope Matrix (`Table 1.1`). |
| **Objective 2:** Analyze repository footprints and cloud pricing matrices. | Ingesting polyglot codebases statically without runtime execution; normalizing cloud pricing. | Abstract Syntax Tree (AST) parsing (`ast`, `esprima`), dependency manifest inspection, AWS Price List API. | Repository Scanner (`service_analyzer.py`), Multi-cloud Pricing Ingestion Subsystem (`schemas.py`). |
| **Objective 3:** Design and develop the core Code2Cloud engine. | Integrating AI reasoning with deterministic fallbacks; compiling multi-cloud IaC and teardown scripts. | Google Gemini Pro API with strict Pydantic JSON schemas, Jinja2 template rendering engines. | Recommendation Service (`recommendation_service.py`), IaC Generator (`service_generator.py`, Jinja workflows). |
| **Objective 4:** Evaluate accuracy, latency, and cost savings on AWS. | Verifying syntax validity, measuring synthesis latency, and validating live cloud deployments. | Automated test suite execution, `terraform validate` CI checks, live AWS EC2/ECS provisioning runs. | Master Test Matrix (`Table 6.1`), Cost Savings Evaluation (`Table 6.2`), Verified AWS Teardown Flow. |

<div align="center">

**Table 4.1:** Operationalization Matrix Linking Research Objectives to Functional Specifications
</div>

<br>

As formalized in Table 4.1, every functional module within Code2Cloud is directly justified by an academic objective. For instance, Objective 2 directly materializes in the AST parsing heuristics embedded within `service_analyzer.py`, ensuring that application frameworks, ports, and database drivers are extracted deterministically. Similarly, Objective 3 directly governs the dynamic compilation of Terraform assets and the automated `aws_destroy.jinja` teardown pipeline.

<!-- PAGE BREAK: SECTION 4.4 -->
<div style="page-break-before: always;"></div>

---

## 4.4. Sub Heading: System Analysis and Modeling

To formalize the structural and dynamic behavior of the system, this section presents five comprehensive Unified Modeling Language (UML) specifications: Use Case modeling, domain Class modeling, behavioral Activity workflows, interaction Sequence flows, and physical Deployment topology.

### 4.4.1. Sub-Sub-Heading: Use Case Modeling and Detailed Specifications

The system's functional scope and external actor boundaries are captured in the comprehensive Use Case diagram depicted in Figure 4.1.

```
+---------------------------------------------------------------------------------------------------------+
|                                  CODE2CLOUD SYSTEM USE CASE DIAGRAM                                     |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|       +-------------------+                                                                             |
|       |                   | ------> ( UC-01: Connect & Authenticate GitHub Repository )                 |
|       |                   |                                                                             |
|       |                   | ------> ( UC-02: Trigger Static Repository Analysis )                       |
|       |                   |             |                                                               |
|       |                   |             | <<includes>>                                                  |
|       |                   |             v                                                               |
|       |                   |         ( UC-03: Extract Runtime, Framework, Ports & DB )                   |
|       | Software Developer|                                                                             |
|       |      (Actor)      | ------> ( UC-04: Request Cloud Infrastructure Sizing )                      |
|       |                   |             |                                                               |
|       |                   |             | <<includes>>                                                  |
|       |                   |             v                                                               |
|       |                   |         ( UC-05: Query Multi-Cloud Pricing Matrix )                         |
|       |                   |                                                                             |
|       |                   | ------> ( UC-06: Synthesize Terraform & Docker Artifacts )                  |
|       |                   |             |                                                               |
|       |                   |             | <<includes>>                                                  |
|       |                   |             v                                                               |
|       |                   |         ( UC-07: Inject Automated Teardown Workflow )                       |
|       |                   |                                                                             |
|       |                   | ------> ( UC-08: Execute AWS Cloud Deployment )                             |
|       |                   |                                                                             |
|       |                   | ------> ( UC-09: Trigger Automated Resource Teardown )                      |
|       +-------------------+                                                                             |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.1:** Code2Cloud Comprehensive System Use Case Diagram
</div>

<br>

To provide precise operational specifications, the three most critical use cases are detailed below:
* **Use Case UC-02: Trigger Static Repository Analysis**
  * *Primary Actor:* Software Developer.
  * *Pre-conditions:* Developer is authenticated and provides a valid, accessible GitHub repository URL.
  * *Main Success Scenario:* The developer submits the repository URL. The backend clones the repository into an ephemeral workspace. The analyzer scans dependency files (`requirements.txt`, `package.json`, `pom.xml`) and executes AST parsing across entrypoint files. The system returns a structured JSON payload detailing language runtime, framework, port (e.g., 8000), and database dependencies.
  * *Post-conditions:* Extracted application profile is cached in memory for compute sizing.
* **Use Case UC-04: Request Cloud Infrastructure Sizing**
  * *Primary Actor:* Software Developer.
  * *Pre-conditions:* Repository analysis (UC-02) completed successfully.
  * *Main Success Scenario:* The developer selects target cloud providers (AWS, GCP). The recommendation service formats the application profile into a structured prompt schema and queries Google Gemini AI. The AI evaluates workload demands against regional instance pricing feeds. If Gemini API is available, an optimal instance (e.g., AWS `t3.medium`) with reasoning is returned; if rate-limited, deterministic fallback heuristics execute.
  * *Post-conditions:* Recommended compute configurations and estimated monthly costs are displayed on the UI.
* **Use Case UC-07: Inject Automated Teardown Workflow**
  * *Primary Actor:* System Generation Engine / Developer.
  * *Pre-conditions:* Developer approves compute recommendation and initiates IaC generation.
  * *Main Success Scenario:* The generation engine compiles modular Terraform scripts and Dockerfiles. Concurrently, the engine loads `aws_destroy.jinja` and dynamically generates a GitHub Actions teardown workflow (`.github/workflows/destroy.yml`). The workflow enforces a mandatory confirmation parameter (`confirm_destroy: DESTROY`).
  * *Post-conditions:* Complete deployment bundle containing deployment and safe teardown assets is packaged into a downloadable zip file.

### 4.4.2. Sub-Sub-Heading: Static Domain Modeling (Class Diagram)

The static object architecture of the Code2Cloud backend is modeled in Figure 4.2, illustrating the domain entities, analytical services, and template rendering abstractions.

```
+---------------------------------------------------------------------------------------------------------+
|                                    CODE2CLOUD DOMAIN CLASS DIAGRAM                                      |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +------------------------------------+           +---------------------------------------------+      |
|   |          RepositoryInfo            |           |              ServiceAnalyzer                |      |
|   +------------------------------------+           +---------------------------------------------+      |
|   | - repo_url: str                    |           | + clone_repository(url: str): Path          |      |
|   | - branch: str                      | 1       1 | + inspect_dependencies(path: Path): dict    |      |
|   | - local_path: Path                 |---------->| + parse_ast(entry_file: Path): ASTMetadata  |      |
|   | - detected_files: List[str]        |           | + extract_service_profile(): ServiceProfile |      |
|   +------------------------------------+           +----------------------+----------------------+      |
|                                                                           |                             |
|                                                                           | produces                    |
|                                                                           v                             |
|   +------------------------------------+           +---------------------------------------------+      |
|   |          InstancePricing           |           |               ServiceProfile                |      |
|   +------------------------------------+           +---------------------------------------------+      |
|   | - provider: CloudProvider          |           | - language: str                             |      |
|   | - instance_type: str               |           | - framework: str                            |      |
|   | - vcpu: int                        |           | - exposed_port: int                         |      |
|   | - memory_gb: float                 |           | - database_required: Optional[str]          |      |
|   | - hourly_price: float              |           | - environment_vars: List[str]               |      |
|   +-----------------+------------------+           +----------------------+----------------------+      |
|                     |                                                     |                             |
|                     | evaluated by                                        | evaluated by                |
|                     v                                                     v                             |
|   +-----------------------------------------------------------------------------------------------+      |
|   |                                    RecommendationService                                      |      |
|   +-----------------------------------------------------------------------------------------------+      |
|   | - gemini_client: GenerativeModel                                                              |      |
|   | - fallback_rules: Dict[str, str]                                                              |      |
|   +-----------------------------------------------------------------------------------------------+      |
|   | + generate_sizing_recommendation(profile: ServiceProfile): RecommendationResult               |      |
|   | + calculate_monthly_expenditure(pricing: InstancePricing, hours: int): float                  |      |
|   +---------------------------------------------------------------+-------------------------------+      |
|                                                                   |                                     |
|                                                                   | outputs                             |
|                                                                   v                                     |
|   +------------------------------------+           +---------------------------------------------+      |
|   |          SecretsHandler            |           |               ServiceGenerator              |      |
|   +------------------------------------+           +---------------------------------------------+      |
|   | + parse_env_file(path: Path): dict |           | - jinja_env: Environment                    |      |
|   | + mask_credentials(env: dict): dict|           | + render_dockerfile(profile): str           |      |
|   | + inject_in_memory(pkg: Zip): void |           | + render_terraform_aws(recommendation): str |      |
|   +------------------------------------+           | + render_teardown_workflow(config): str     |      |
|                                                    | + package_deployment_bundle(): BytesIO      |      |
|                                                    +---------------------------------------------+      |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.2:** Domain Object Model and Backend Entity Architecture (Class Diagram)
</div>

<br>

As detailed in Figure 4.2, the `ServiceAnalyzer` inspects a `RepositoryInfo` entity and constructs a strongly typed `ServiceProfile`. This profile encapsulates extracted language specifications, listening network ports, framework classifications, and detected database drivers. The `RecommendationService` evaluates the `ServiceProfile` alongside `InstancePricing` matrices, invoking Google Gemini LLM reasoning or deterministic fallbacks to produce a `RecommendationResult`. Finally, `ServiceGenerator` consumes this result to render multi-cloud Terraform templates, Dockerfiles, and teardown workflows via Jinja2, with `SecretsHandler` managing environment variables strictly in-memory.

### 4.4.3. Sub-Sub-Heading: Dynamic Behavioral Modeling (Activity Diagram)

The procedural workflow of the automated recommendation and generation pipeline is modeled in the Activity diagram in Figure 4.3.

```
+---------------------------------------------------------------------------------------------------------+
|                            CODE2CLOUD WORKFLOW BEHAVIORAL ACTIVITY DIAGRAM                              |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|                                         ( Start Analysis )                                              |
|                                                  |                                                      |
|                                                  v                                                      |
|                                    [ Ingest & Clone Repository ]                                        |
|                                                  |                                                      |
|                                                  v                                                      |
|                                    [ Detect Dependency Manifests ]                                      |
|                                    (package.json / reqs.txt / pom)                                      |
|                                                  |                                                      |
|                                                  v                                                      |
|                                    [ Execute AST Syntax Parsing ]                                       |
|                                    (Extract Port, DB & Framework)                                       |
|                                                  |                                                      |
|                                                  v                                                      |
|                                    [ Format Application Profile ]                                       |
|                                                  |                                                      |
|                                                  v                                                      |
|                                    < Is Gemini API Available? >                                         |
|                                    /                          \                                         |
|                             [ Yes ]                            [ No (429 Rate Limit) ]                  |
|                                 |                                        |                              |
|                                 v                                        v                              |
|                   [ Structured LLM Inference ]             [ Deterministic Fallback Sizing ]            |
|                   (Evaluate Workload Context)              (Apply Rule-based Instance Map)              |
|                                 \                                        /                              |
|                                  +-------------------+------------------+                               |
|                                                      |                                                  |
|                                                      v                                                  |
|                                      [ Display Sizing & Pricing to User ]                               |
|                                                      |                                                  |
|                                                      v                                                  |
|                                      < Does User Approve & Proceed? >                                   |
|                                      /                              \                                   |
|                                [ Yes ]                              [ No: Abort / Adjust ]              |
|                                   |                                          |                          |
|                                   v                                          v                          |
|                     [ Render Terraform & Dockerfiles ]                 ( End Process )                  |
|                                   |                                                                     |
|                                   v                                                                     |
|                     [ Inject Teardown Workflow (.yml) ]                                                 |
|                                   |                                                                     |
|                                   v                                                                     |
|                     [ Assemble Verified Deployment Zip ]                                                |
|                                   |                                                                     |
|                                   v                                                                     |
|                               ( Success )                                                               |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.3:** Activity Diagram for Automated Repository Parsing and Recommendation Pipeline
</div>

<br>

As illustrated in Figure 4.3, the system incorporates high fault tolerance. When the application profile is ready for sizing, the system evaluates the health of the Gemini API endpoint. If active, structured generative reasoning maps the workload to compute instances; if API rate limits (HTTP 429) or connection timeouts occur, the process branches seamlessly to deterministic fallback sizing without crashing the execution pipeline. Once the developer approves the recommendation, the engine compiles the IaC assets, injects the `aws_destroy.jinja` teardown workflow, and bundles the assets for deployment.

### 4.4.4. Sub-Sub-Heading: Interaction Modeling (Sequence Diagrams)

The interaction sequence between the Developer, Web Portal, Analyzer, Recommendation Service, and Generator is formalized in the Sequence diagram in Figure 4.4.

```
+---------------------------------------------------------------------------------------------------------+
|                                    SYSTEM INTERACTION SEQUENCE DIAGRAM                                  |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
| Developer          Web Portal          ServiceAnalyzer       RecommendationService     ServiceGenerator |
|    |                   |                      |                        |                      |         |
|    | 1. Submit Repo    |                      |                        |                      |         |
|    |------------------>|                      |                        |                      |         |
|    |                   | 2. POST /analyze     |                        |                      |         |
|    |                   |--------------------->|                        |                      |         |
|    |                   |                      | 3. AST Parse Repo      |                      |         |
|    |                   |                      |    Extract Port, DB    |                      |         |
|    |                   | 4. Return Profile    |                        |                      |         |
|    |                   |<---------------------|                        |                      |         |
|    |                   |                                               |                      |         |
|    |                   | 5. POST /recommend (Profile)                  |                      |         |
|    |                   |---------------------------------------------->|                      |         |
|    |                   |                                               | 6. Compute Sizing    |         |
|    |                   |                                               |    (Gemini/Fallback) |         |
|    |                   | 7. Return Sizing & Pricing Result             |                      |         |
|    |                   |<----------------------------------------------|                      |         |
|    | 8. Display Results|                                               |                      |         |
|    |<------------------|                                               |                      |         |
|    |                   |                                               |                      |         |
|    | 9. Confirm & Gen  |                                               |                      |         |
|    |------------------>|                                               |                      |         |
|    |                   | 10. POST /generate (Config)                   |                      |         |
|    |                   |--------------------------------------------------------------------->|         |
|    |                   |                                               |                      | 11. Compile Terraform   |
|    |                   |                                               |                      | 12. Render Dockerfile   |
|    |                   |                                               |                      | 13. Inject aws_destroy  |
|    |                   | 14. Return Deployment Zip Archive             |                      |         |
|    |                   |<---------------------------------------------------------------------|         |
|    | 15. Download Zip  |                                               |                      |         |
|    |<------------------|                                               |                      |         |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.4:** Sequence Diagram for Multi-Cloud IaC Synthesis and Workflow Orchestration
</div>

<br>

Figure 4.4 captures the complete synchronous lifecycle. The sequence enforces strict separation between analysis, recommendation, and generation. In step 13, the `ServiceGenerator` dynamically compiles the `aws_destroy.jinja` template alongside the primary Terraform configuration, ensuring that the resulting archive received by the developer in step 15 contains integrated, self-contained cloud decommissioning automation.

### 4.4.5. Sub-Sub-Heading: Deployment Topology (Deployment Diagram)

The physical deployment topology and cloud provider infrastructure interconnects are modeled in Figure 4.5.

```
+---------------------------------------------------------------------------------------------------------+
|                                    CODE2CLOUD DEPLOYMENT TOPOLOGY DIAGRAM                               |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   | Developer Client Machine                                                                        |   |
|   | [ Web Browser (React/Next.js Client) ] <====================+                                   |   |
|   +-------------------------------------------------------------|-----------------------------------+   |
|                                                                 | HTTPS / JSON (Port 443)               |
|                                                                 v                                       |
|   +-------------------------------------------------------------------------------------------------+   |
|   | Code2Cloud Host Environment (Docker Container Runtime / Ubuntu 22.04 LTS)                       |   |
|   |                                                                                                 |   |
|   |   +-------------------------------------+      +--------------------------------------------+   |   |
|   |   | FastAPI Application Gateway (Uvicorn)|      | Celery Asynchronous Task Workers           |   |   |
|   |   | - REST API Endpoints & Auth         | ---> | - Git Cloning & Ingestion Buffer           |   |   |
|   |   | - Pydantic Request Validation       |      | - Python AST Parsing Subprocess            |   |   |
|   |   +------------------+------------------+      +---------------------+----------------------+   |   |
|   |                      |                                               |                          |   |
|   |                      | Internal UNIX Socket                          | Local File Mount         |   |
|   |                      v                                               v                          |   |
|   |   +-------------------------------------+      +--------------------------------------------+   |   |
|   |   | Redis In-Memory Cache (Port 6379)   |      | Ephemeral Workspace Scratch Storage        |   |   |
|   |   | - Sizing Recommendations Cache      |      | - Isolated Cloned Repositories             |   |   |
|   |   | - Rate Limit Counter State          |      | - Jinja2 Compilation Buffers               |   |   |
|   |   +-------------------------------------+      +--------------------------------------------+   |   |
|   +--------------------------------------------------------------|----------------------------------+   |
|                                                                  |                                      |
|                                      +---------------------------+---------------------------+          |
|                                      | HTTPS / REST API                                      | SDK/Boto3|
|                                      v                                                       v          |
|   +---------------------------------------------------+             +-------------------------------+   |
|   | External AI Services                              |             | Target Cloud Environment (AWS)|   |
|   | [ Google Gemini Pro API Endpoint ]                |             | [ Amazon Web Services ]       |   |
|   | - Model: gemini-pro (Structured JSON Response)    |             | - EC2 Compute Instances       |   |
|   | - Fallback Threshold: 5000ms Timeout / HTTP 429   |             | - VPC / Security Groups       |   |
|   +---------------------------------------------------+             | - Terraform State Bucket (S3) |   |
|                                                                     +-------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.5:** System Deployment Topology and Cloud SDK Runtime Environment
</div>

<br>

As depicted in Figure 4.5, the host architecture isolates the FastAPI gateway from long-running repository scanning tasks using Celery worker processes and ephemeral disk mounts. Temporary repository clones are confined to localized scratch storage and destroyed immediately post-analysis. Outbound connections are established over encrypted HTTPS to Google Gemini Pro for recommendation reasoning and to Amazon Web Services via the Boto3 SDK for live infrastructure provisioning and teardown execution.

<!-- PAGE BREAK: SECTION 4.5 -->
<div style="page-break-before: always;"></div>

---

## 4.5. Sub Heading: System Architecture Specification

The overarching architectural design of Code2Cloud is structured around a decoupled, multi-tier modular architecture, ensuring extensibility, maintainability, and horizontal scalability [10]. Figure 4.6 illustrates the system architecture blueprint.

```
+---------------------------------------------------------------------------------------------------------+
|                                    CODE2CLOUD SYSTEM ARCHITECTURE BLUEPRINT                             |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-------------------------------------------------------------------------------------------------+   |
|   | TIER 1: PRESENTATION & CLIENT LAYER                                                             |   |
|   | - Interactive Next.js Dashboard: Repository Submission, Framework Overrides, Secrets Input     |   |
|   | - Recommendation Viewer: Displays Instance Family, vCPU/RAM Specs, Monthly Pricing Estimates   |   |
|   | - Artifact Manager: Single-Click Zip Download, AWS Deployment Trigger, Teardown Console         |   |
|   +-------------------------------------------------|-----------------------------------------------+   |
|                                                     | RESTful API / JSON Payloads                       |
|                                                     v                                                   |
|   +-------------------------------------------------------------------------------------------------+   |
|   | TIER 2: API ROUTING & REQUEST ORCHESTRATION LAYER (FastAPI)                                     |   |
|   | - API Router (`router.py`): Endpoint dispatching for `/analyze`, `/recommend`, `/generate`     |   |
|   | - Data Validation (`schemas.py`): Pydantic contracts enforcing strict runtime typing            |   |
|   | - Authentication & Scope Handler (`auth/`): GitHub OAuth tokens and secure session validation   |   |
|   +-------------------------------------------------|-----------------------------------------------+   |
|                                                     | In-Memory Data Passing                            |
|                                                     v                                                   |
|   +-------------------------------------------------------------------------------------------------+   |
|   | TIER 3: CORE ANALYTICAL & GENERATION ENGINE LAYER                                               |   |
|   |                                                                                                 |   |
|   |   +-----------------------------+  +----------------------------+  +------------------------+   |   |
|   |   | Static Analysis Engine      |  | AI Recommendation Engine   |  | IaC & Workflow Generator|   |   |
|   |   | (`service_analyzer.py`)     |  | (`recommendation_svc.py`)  |  | (`service_generator.py`)|   |   |
|   |   | - Manifest Parser           |  | - Gemini Prompt Builder    |  | - Jinja2 Template Pool |   |   |
|   |   | - AST Grammar Inspect       |  | - Pydantic JSON Schema     |  | - Terraform Synthesizer|   |   |
|   |   | - Port/DB Signature Match   |  | - Deterministic Fallback   |  | - Dockerfile Generator|   |   |
|   |   +-----------------------------+  +----------------------------+  | - aws_destroy Synthesiz|   |   |
|   |                                                                    +------------------------+   |   |
|   +-------------------------------------------------|-----------------------------------------------+   |
|                                                     | Structured Artifacts                              |
|                                                     v                                                   |
|   +-------------------------------------------------------------------------------------------------+   |
|   | TIER 4: CLOUD INTEGRATION & INFRASTRUCTURE EXECUTION LAYER                                      |   |
|   | - Secrets Handler (`secrets_handler.py`): In-memory secret masking without database persistence|   |
|   | - Multi-Cloud Pricing Provider: Continuous ingestion of AWS Price List API and GCP Pricing Feeds|   |
|   | - Cloud SDK Adapter (Boto3): Validated live EC2/ECS provisioning and teardown automation on AWS |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 4.6:** Multi-Tier Modular System Architecture of Code2Cloud
</div>

<br>

As detailed in Figure 4.6, Tier 1 delivers an intuitive developer portal. Tier 2 enforces strict data contracts using Pydantic, preventing malformed payloads from entering core processing routines. Tier 3 houses the novel intellectual contributions of this research: static repository parsing, Gemini AI instance sizing with deterministic fallback safeguards, and dynamic Jinja2 template rendering. Tier 4 governs physical infrastructure execution, interfacing securely with Amazon Web Services via Boto3 while ensuring credentials and secrets remain strictly in transient memory.

<!-- PAGE BREAK: SECTION 4.6 -->
<div style="page-break-before: always;"></div>

---

## 4.6. Sub Heading: Functional and Non-Functional Requirements

To establish objective benchmarks for software development and experimental evaluation, this section catalogs fifteen granular Functional Requirements (FRs) and eight Non-Functional Requirements (NFRs).

### 4.6.1. Sub-Sub-Heading: Functional Requirements (FR-01 through FR-15)

* **FR-01: GitHub Repository Cloning:** The system shall ingest public and authenticated private GitHub repository URLs and clone the codebase into an isolated, ephemeral workspace.
* **FR-02: Dependency Manifest Detection:** The system shall automatically detect and parse package manifests, including `package.json` (Node.js), `requirements.txt` / `Pipfile` (Python), and `pom.xml` (Java Maven).
* **FR-03: Web Framework Identification:** The system shall identify the underlying web framework (FastAPI, Flask, Django, Express.js, Nest.js, Spring Boot) through dependency manifest inspection.
* **FR-04: Static Port Extraction:** The system shall inspect entrypoint source files using Abstract Syntax Tree (AST) parsing to identify listening network ports (e.g., `app.listen(3000)`).
* **FR-05: Database Dependency Detection:** The system shall identify persistent database requirements (PostgreSQL, MySQL, MongoDB, Redis) by matching driver import signatures within application code.
* **FR-06: Environment Variable Key Discovery:** The system shall discover expected environment variables by statically scanning `.env.example` files and `os.environ` / `process.env` code lookups.
* **FR-07: Real-Time Pricing Feed Querying:** The system shall query cloud provider pricing APIs to retrieve up-to-date hourly and monthly tariffs for compute instance families.
* **FR-08: AI-Assisted Instance Sizing:** The system shall invoke Google Gemini Pro with structured JSON schema constraints to infer workload compute requirements and recommend optimal instance sizes.
* **FR-09: Deterministic Fallback Execution:** The system shall automatically invoke deterministic rule-based sizing heuristics if the Gemini API encounters rate limits (HTTP 429) or network timeouts.
* **FR-10: Multi-Cloud Recommendation Display:** The system shall present comparative compute recommendations across Amazon Web Services (AWS) and Google Cloud Platform (GCP) with monthly cost projections.
* **FR-11: Dockerfile Synthesis:** The system shall dynamically generate multi-stage, production-hardened Dockerfiles tailored to the detected language runtime and framework version.
* **FR-12: Docker Compose Compilation:** The system shall synthesize `docker-compose.yml` files configuring application containers and required database sidecars with bridge networking.
* **FR-13: Terraform Infrastructure Generation:** The system shall synthesize modular Terraform scripts (`main.tf`, `variables.tf`, `outputs.tf`) provisioning compute instances, VPCs, and security groups.
* **FR-14: Automated Teardown Workflow Generation:** The system shall synthesize an automated GitHub Actions teardown workflow (`aws_destroy.jinja`) enforcing a manual confirmation trigger (`DESTROY`).
* **FR-15: Deployment Bundle Packaging:** The system shall package all synthesized IaC scripts, Dockerfiles, and CI/CD pipelines into a downloadable, structured zip archive.

### 4.6.2. Sub-Sub-Heading: Non-Functional Requirements (NFR-01 through NFR-08)

* **NFR-01: Static Analysis Latency:** The system shall complete the static cloning, dependency manifest parsing, and AST inspection of a repository under 50 MB in size within 5.0 seconds.
* **NFR-02: Code Generation Throughput:** The system shall render all Terraform templates, Dockerfiles, and CI/CD workflows via Jinja2 within 2.0 seconds post-recommendation approval.
* **NFR-03: Syntactic Validity Rate:** 100% of generated Terraform configuration files shall pass HashiCorp Terraform syntax and schema verification (`terraform validate`) without syntax errors.
* **NFR-04: Credential and Secret Isolation:** The system shall never persist user `.env` secrets or cloud API credentials to physical databases or application log streams; all secrets must remain strictly in transient memory.
* **NFR-05: High Availability and Fault Tolerance:** The system shall maintain an operational availability threshold exceeding 99.5%, ensuring continuous operation even during third-party LLM API degradation via fallback heuristics.
* **NFR-06: Deterministic IaC Idempotency:** Synthesized Terraform templates shall be strictly idempotent; executing `terraform apply` multiple times against identical configuration states shall produce zero unintended resource modifications.
* **NFR-07: User Experience and Accessibility:** The web application dashboard shall achieve a Lighthouse usability and accessibility score exceeding 90 points, rendering sizing metrics clearly across desktop viewports.
* **NFR-08: Cloud Deployment Success Rate:** Generated AWS deployment packages shall achieve an end-to-end cloud provisioning success rate exceeding 90% across validated benchmark web applications.

<!-- PAGE BREAK: SECTION 4.7 -->
<div style="page-break-before: always;"></div>

---

## 4.7. Sub Heading: Chapter Summary

This chapter has formalized the comprehensive System Requirement Specification (SRS) and architectural modeling for the Code2Cloud platform. By conducting stakeholder analysis and developing developer personas, the engineering design was anchored directly in the operational realities of software teams transitioning to cloud deployments. The operationalization process linked each of the study's four research objectives to concrete software modules, establishing a verifiable continuum from academic goals to technical deliverables.

The chapter presented five detailed Unified Modeling Language specifications: Use Case modeling covering end-to-end interactions, Class diagrams defining the domain entity architecture, Activity diagrams modeling procedural fault tolerance, Sequence diagrams capturing synchronous execution flows, and Deployment diagrams detailing containerized execution topology. Furthermore, the multi-tier architectural blueprint illustrated the clean separation of concerns across presentation, API routing, analytical reasoning, and cloud execution. Finally, fifteen Functional Requirements and eight Non-Functional Requirements were cataloged to govern the implementation and empirical evaluation detailed in the subsequent chapter.
