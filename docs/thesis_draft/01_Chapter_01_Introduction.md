<!--
================================================================================
DISSERTATION CHAPTER 01: INTRODUCTION
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


<!-- PAGE BREAK: CHAPTER 1 MAIN HEADING -->
<div style="page-break-before: always;"></div>

<br>

# 1. MAIN HEADING: INTRODUCTION

The contemporary paradigm of software engineering is defined by an accelerating transition toward distributed cloud-native systems, containerized service execution, and automated deployment architectures. Organizations of all scales increasingly rely on major Cloud Service Providers (CSPs)—predominantly Amazon Web Services (AWS), Google Cloud Platform (GCP), Microsoft Azure, and specialized providers like DigitalOcean—to achieve operational elasticity, high availability, and global user reach [1]. However, while the underlying infrastructure capabilities have expanded exponentially, the process of translating an application's codebase into an optimal, cost-effective, and secure cloud configuration remains an acutely complex, error-prone, and human-intensive endeavor [2].

Modern web application developers face a bewildering assortment of infrastructure decisions prior to deploying their code into production environments. Within Amazon Web Services alone, developers must choose among hundreds of virtual machine instance families, container orchestration runtimes, managed relational and non-relational database services, and intricate Virtual Private Cloud (VPC) network topologies [3]. Compounding this cognitive burden is the steep learning curve required to master declarative Infrastructure as Code (IaC) tooling, such as HashiCorp Terraform, and container orchestration schemas via Dockerfiles and Docker Compose [4]. In the absence of automated decision-support mechanisms, software teams routinely suffer from either severe resource over-provisioning—triggering catastrophic budgetary overruns—or under-provisioning, which introduces application bottlenecks, latency spikes, and runtime crashes during real-world traffic surges [5].

To bridge this fundamental structural gap between application source code development and resilient cloud deployment, this research presents **Code2Cloud**. The system introduces an intelligent, pre-deployment automation pipeline that statically parses application code repositories, determines application runtime footprints, utilizes large language model heuristics for cost-performance optimization, and synthesizes deterministic, production-hardened Terraform configurations and Docker containers alongside automated cloud lifecycle teardown workflows. This introductory chapter establishes the empirical and theoretical foundations of the research, delineating the problem background, problem statement, research questions, motivation, objectives, solution rich picture, resource specifications, and defined scope boundaries.

<!-- PAGE BREAK: SECTION 1.1 -->
<div style="page-break-before: always;"></div>

---

## 1.1. Sub Heading: Chapter Overview

This initial chapter establishes the formal academic foundation and structural scope for the entire dissertation. The narrative begins by examining the contemporary cloud computing landscape, demonstrating how the proliferation of heterogeneous compute catalogs and declarative configuration frameworks has introduced unprecedented operational friction for modern software engineering teams. By presenting empirical data from industry and academia, the chapter establishes that cloud resource misallocation and Infrastructure as Code authoring errors represent chronic, systemic impediments to rapid software delivery.

Following the contextual background, the document rigorously formalizes the problem statement, bifurcating the dilemma into its overarching industry ramifications and its precise, technical domain limitations. To systematically address these challenges, the chapter articulates the primary research question alongside targeted sub-research questions, establishing the core technical aim and four formal research objectives formulated in accordance with academic engineering standards. Furthermore, the technical and economic motivations underpinning this study are justified in detail, underscoring the tangible societal and industry benefits of automated cloud provisioning.

The latter half of the chapter visualizes the proposed system through a comprehensive Rich Picture diagram, capturing the end-to-end interactions between software developers, repository ingestion pipelines, recommendation algorithms, and multi-cloud provisioning targets. The hardware, software, and cloud environments necessary to replicate and execute this study are explicitly cataloged to ensure scientific reproducibility. Finally, the boundaries of the investigation are formalized through a dedicated project scope matrix, clearly defining functional inclusions and deliberate exclusions before summarizing the foundational insights that pave the way for the subsequent literature review.

<!-- PAGE BREAK: SECTION 1.2 -->
<div style="page-break-before: always;"></div>

---

## 1.2. Sub Heading: Problem Background

Over the past decade, the rapid maturation of cloud computing has radically democratized access to enterprise-grade compute, storage, and networking resources. Applications that previously required dedicated on-premises physical data centers, complex procurement lifecycles, and specialized hardware teams can now be instantiated within minutes across globally distributed cloud infrastructure [1]. According to empirical telemetry published by the Cloud Native Computing Foundation (CNCF), over eighty-four percent of modern enterprise workloads now leverage containerized architectures, with multi-cloud and hybrid deployments representing the standard operational posture for contemporary digital platforms [3]. This seismic shift has established virtualization and containerization as non-negotiable foundations for modern software development.

However, the sheer breadth and velocity of cloud provider evolution have introduced severe cognitive friction and operational divergence between software developers and cloud infrastructure operations. Major hyperscale providers offer thousands of granular compute permutations; for instance, the Amazon Elastic Compute Cloud (EC2) catalog features compute-optimized (C-family), memory-optimized (R-family), general-purpose (T and M-families), and storage-optimized instances across dozens of virtualized generations [2], [6]. Each instance family possesses distinct underlying hardware attributes, varying ratios of virtual central processing units (vCPUs) to random-access memory (RAM), proprietary network performance tiers, and complex spot versus on-demand pricing schemas. Developers transitioning from local development environments to production clouds rarely possess the specialized systems engineering background required to profile their application's exact resource requirements against this vast matrix of options.

```
+-----------------------------------------------------------------------------------+
|                        THE CLOUD PROVISIONING DILEMMA                             |
+-----------------------------------------------------------------------------------+
|  Application Codebase  -->  Manual Developer Guesswork  -->  Inefficient Deployment|
|  (Express, FastAPI,        - Which instance size?            - Over-provisioning: |
|   Spring Boot, etc.)       - Which database tier?              35%-50% cost waste |
|                            - How to write Terraform?         - Under-provisioning:|
|                            - How to dockerize securely?        latency & crashes  |
+-----------------------------------------------------------------------------------+
```

Recent empirical studies reinforce the severe operational consequences of this provisioning dilemma. Industry benchmark surveys indicate that approximately sixty-eight percent of software engineering teams report persistent difficulties in accurately estimating compute sizing prior to deploying new web services [5]. In practice, developers routinely engage in defensive over-provisioning—allocating significantly more virtual CPU cores and memory overhead than the workload requires under typical operating conditions—simply to guarantee that application throughput does not degrade under unexpected load spikes. Extensive industry analyses from Flexera's State of the Cloud Report reveal that organizations waste an average of thirty-two percent of their total cloud expenditures, with idle and over-allocated compute resources representing the single largest contributor to unnecessary cloud billing [7].

Conversely, inadvertent under-provisioning precipitates catastrophic system failures, characterized by memory exhaustion faults (Out-Of-Memory termination), excessive garbage collection pauses in runtime virtual machines, and high tail latencies that directly harm user retention and business revenue [8]. To manage cloud infrastructure reliably, modern engineering organizations have widely adopted the Infrastructure as Code (IaC) paradigm, primarily utilizing HashiCorp Terraform to define declarative, immutable infrastructure topologies [4]. Furthermore, container runtimes managed via Docker have become the de facto standard for encapsulating application code, system libraries, and runtime dependencies into portable deployment artifacts [9].

Despite the clear architectural advantages of Terraform and Docker, their adoption introduces substantial operational overhead. Declarative configuration files require deep domain expertise in cloud networking semantics, security group policies, identity and access management (IAM) roles, and provider-specific syntax [10]. Software developers frequently copy unverified template snippets from public internet forums or third-party repositories, inadvertently embedding severe security smells, over-permissive ingress firewall rules, and plaintext secret exposures into their infrastructure definitions [11]. Furthermore, traditional IaC workflows lack automated lifecycle teardown mechanisms, resulting in orphan cloud resources—such as detached elastic storage volumes, idle load balancers, and running compute nodes—that persist unnoticed in cloud accounts, compounding financial waste indefinitely.

<!-- PAGE BREAK: SECTION 1.3 -->
<div style="page-break-before: always;"></div>

---

## 1.3. Sub Heading: Problem Statement

The foundational challenge addressed in this investigation arises from the structural disconnect between software application development and automated, cost-efficient cloud infrastructure provisioning. This research categorizes the dilemma into two distinct dimensions: the macro-level general industry problem, and the micro-level technical research gap that directly defines this project's scope.

### 1.3.1. Sub-Sub-Heading: General Problem

At an organizational and macroeconomic level, the absence of intelligent, pre-deployment infrastructure optimization results in acute financial inefficiency, reduced developer velocity, and severe operational vulnerability. Software engineering organizations expend millions of dollars annually on over-provisioned cloud instances that operate at less than ten percent average CPU utilization throughout their lifecycles [7]. This financial drain disproportionately impacts startup enterprises, small-to-medium businesses (SMBs), and independent developers who lack dedicated Site Reliability Engineering (SRE) departments to continuously audit and tune cloud resource allocations.

Simultaneously, the requirement for software developers to manually bridge the gap between their application logic and complex cloud infrastructure severely impedes time-to-market. Developers are forced to divert significant engineering bandwidth away from building core business features toward troubleshooting esoteric Infrastructure as Code syntax errors, resolving Docker container build failures, and configuring cloud networking policies [10]. When deployments inevitably encounter configuration mismatches or run-time exceptions, the absence of automated error-recovery workflows frequently leaves partially provisioned cloud resources active, generating continuous, unmonitored financial leakage without delivering functional application services.

### 1.3.2. Sub-Sub-Heading: Specific Problem and Research Gap

At a technical software engineering level, existing cloud management and deployment tools operate almost exclusively as post-deployment monitoring solutions or static, rigid template generators. Commercial tools such as AWS Compute Optimizer, Datadog, and New Relic require applications to be actively running in production for extended monitoring windows—often requiring days or weeks of telemetry collection—before offering reactive sizing recommendations [8], [12]. Consequently, developers have zero intelligent guidance during the critical pre-deployment phase, when initial infrastructure architectures and budget allocations must be established.

Furthermore, current template generation tools operate on disconnected, static forms that demand extensive manual parameter input from developers, defeating the goal of true automation. Crucially, existing frameworks fail to analyze the application's source code repository directly. They cannot autonomously inspect programming language constructs, framework dependencies (such as Express.js, FastAPI, or Spring Boot), inbound port configurations, or database connection signatures from Abstract Syntax Trees (AST) and dependency manifests [9], [13]. There is an absence of an end-to-end framework capable of statically parsing an application's codebase, inferring its runtime compute profile, evaluating live multi-cloud pricing matrices, generating production-hardened Terraform and Docker artifacts, and automatically compiling safe cloud teardown workflows. This acute void represents the specific research gap addressed by Code2Cloud.

<!-- PAGE BREAK: SECTION 1.4 -->
<div style="page-break-before: always;"></div>

---

## 1.4. Sub Heading: Research Questions and Hypotheses

To systematically investigate the research gap and guide the engineering development of the proposed solution, this research formulates a single primary research question supported by two targeted sub-research questions.

### 1.4.1. Sub-Sub-Heading: Primary Research Question

The overarching research inquiry driving this study is formulated as follows:

> *"How can static source code analysis, algorithmic cost-performance heuristics, and large language model reasoning be synthesized into a unified pre-deployment framework to automatically recommend optimal cloud compute instances and generate verified, deterministic Infrastructure as Code and container orchestration artifacts for modern web applications?"*

This primary question investigates whether it is technologically viable to eliminate manual developer guesswork by extracting application runtime requirements directly from software repositories, transforming raw source code into validated cloud deployment assets.

### 1.4.2. Sub-Sub-Heading: Specific Sub-Research Questions

To decompose the primary research inquiry into rigorous, measurable engineering facets, two sub-research questions are established:

* **Research Question 1 (RQ1 - Extraction Accuracy):** *To what degree of accuracy can static source code inspection and Abstract Syntax Tree parsing extract runtime language versions, framework types, inbound network ports, and persistent database requirements across polyglot web repositories without requiring runtime container execution?*
* **Research Question 2 (RQ2 - Optimization and Determinism):** *How effectively can a multi-criteria heuristic scoring model, operating in tandem with structured Large Language Model prompting, select the most cost-efficient compute instances across heterogeneous cloud providers (AWS and GCP) while generating syntax-valid, deployable Terraform configurations and automated lifecycle teardown workflows?*

<!-- PAGE BREAK: SECTION 1.5 -->
<div style="page-break-before: always;"></div>

---

## 1.5. Sub Heading: Research Motivation and Justification

The justification for undertaking this research is grounded in both practical software engineering imperatives and compelling economic motivations that directly impact modern digital industries.

### 1.5.1. Sub-Sub-Heading: Technical and Developer Productivity Drivers

From a technical perspective, the modern software industry is actively seeking to embrace the "Developer Experience" (DevEx) movement, aiming to minimize cognitive friction and empower product teams to ship software safely and autonomously. Currently, the transition between writing local application code and deploying production cloud infrastructure represents one of the steepest bottlenecks in the software development lifecycle [10]. Developers are expected to operate as full-stack engineers while simultaneously possessing deep mastery of cloud virtualization topologies, declarative IaC schemas, and security hardening protocols.

By automating the extraction of application metadata and synthesizing production-ready Terraform scripts, Dockerfiles, and CI/CD pipelines, Code2Cloud directly eliminates this operational tax. Software engineers can focus exclusively on application feature delivery, confident that their infrastructure will be provisioned adhering to industry best practices, minimal privilege principles, and deterministic container specifications. Furthermore, embedding self-healing teardown workflows directly into the generated artifacts prevents orphan infrastructure accumulation, substantially elevating software delivery agility.

### 1.5.2. Sub-Sub-Heading: Economic and Operational Impact

From an economic perspective, cloud cost optimization (FinOps) has transitioned from an operational afterthought into an urgent corporate mandate. With global cloud spending exceeding six hundred billion dollars annually, the elimination of compute waste represents massive financial savings for enterprises and startups alike [1], [7]. Inexperienced software teams frequently over-allocate cloud resources by factors of three to five times their baseline requirements, resulting in thousands of dollars in wasted capital monthly.

Code2Cloud provides immediate economic value by performing pre-deployment instance sizing, ensuring that provisioned compute capacity matches empirical application demands from day one. By evaluating hourly and monthly pricing data across Amazon Web Services and Google Cloud Platform, the system identifies the optimal cost-performance Pareto frontier for every unique repository. This capability enables organizations to achieve significant budget reductions, prevents cloud billing shock, and democratizes access to sophisticated multi-cloud architectures for engineering teams with constrained capital.

<!-- PAGE BREAK: SECTION 1.6 -->
<div style="page-break-before: always;"></div>

---

## 1.6. Sub Heading: Research Aim and Objectives

To provide clear methodological direction and enable objective evaluation upon completion, this section delineates the core aim and formal research objectives of the study.

### 1.6.1. Sub-Sub-Heading: Primary Research Aim

The primary aim of this research is to conceptualize, architect, develop, and empirically evaluate **Code2Cloud**, an automated, intelligent cloud infrastructure recommendation and code synthesis framework that bridges the divide between web application repositories and multi-cloud Infrastructure as Code deployments.

### 1.6.2. Sub-Sub-Heading: Specific Research Objectives

To accomplish the overarching research aim, four specific, measurable research objectives are defined in strict adherence to academic engineering standards:

* **Objective 1 (To Identify):** To identify the primary configuration parameters, architectural patterns, dependency footprints, and developer pain points inherent in modern web application deployments across diverse runtime ecosystems.
* **Objective 2 (To Analyze):** To analyze the structural characteristics of polyglot source code repositories via static Abstract Syntax Tree (AST) parsing and map extracted workload requirements against multi-cloud compute instance catalogs and pricing matrices.
* **Objective 3 (To Design and Develop):** To design and develop the end-to-end Code2Cloud software artifact, integrating an intelligent recommendation engine powered by Google Gemini AI, dynamic Jinja2 template synthesizers for Docker and Terraform, and automated cloud teardown workflow generators.
* **Objective 4 (To Evaluate):** To evaluate the functional accuracy, code generation throughput, syntactic validity, and real-world deployment success of the synthesized cloud infrastructure on Amazon Web Services, quantifying financial cost savings relative to conventional manual provisioning.

<!-- PAGE BREAK: SECTION 1.7 -->
<div style="page-break-before: always;"></div>

---

## 1.7. Sub Heading: Rich Picture of the Proposed Solution

The proposed Code2Cloud framework establishes an automated pipeline connecting developers, source code repositories, an intelligent analysis engine, and live cloud deployment environments. Figure 1.1 illustrates the comprehensive Rich Picture of the solution, visualizing the core architectural workflows, stakeholder touchpoints, and multi-cloud provisioning targets.

```
+---------------------------------------------------------------------------------------------------------+
|                                    CODE2CLOUD SOLUTION RICH PICTURE                                     |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-------------------+          +------------------------------------------------------------------+   |
|   |                   |          |                     CODE2CLOUD CORE BACKEND                      |   |
|   | Software Developer|          |                                                                  |   |
|   |                   |          |   +-----------------------+      +---------------------------+   |   |
|   +---------+---------+          |   | 1. Repository Scanner |      | 2. AI Recommendation      |   |   |
|             |                    |   | - Git Clone / Ingest  | ---> |    & Sizing Engine        |   |   |
|             | 1. Submits Repo    |   | - AST Parsing         |      | - Google Gemini LLM       |   |   |
|             |    URL or .env     |   | - Framework Detection |      | - Pricing Matrix Matcher  |   |   |
|             v                    |   | - Port & DB Extraction|      | - Deterministic Fallback  |   |   |
|   +-------------------+          |   +-----------------------+      +-------------+-------------+   |   |
|   | Code2Cloud Portal |          |                                                |                 |   |
|   | (Next.js / Web)   |          |                                                v                 |   |
|   +---------+---------+          |                                  +---------------------------+   |   |
|             ^                    |                                  | 3. Code Generation Engine |   |   |
|             | 4. Displays Sizing |                                  | - Terraform (main.tf)     |   |   |
|             |    & Downloads Zip |                                  | - Dockerfile / Compose    |   |   |
|             +--------------------+--------------------------------- | - GitHub Actions (.yml)   |   |   |
|                                  |                                  | - Teardown (destroy.jinja)|   |   |
|                                  |                                  +-------------+-------------+   |   |
|                                  +------------------------------------------------|-----------------+   |
|                                                                                   |                     |
|                                                                                   v 5. Executes IaC     |
|   +-------------------------------------------------------------------------------+-----------------+   |
|   |                                     TARGET CLOUD DEPLOYMENT ENVIRONMENTS                        |   |
|   |                                                                                                 |   |
|   |   +-----------------------------------+             +---------------------------------------+   |   |
|   |   | Amazon Web Services (AWS)         |             | Google Cloud Platform (GCP)           |   |   |
|   |   | - EC2 Instance Provisioning       |             | - Compute Engine VM Sizing            |   |   |
|   |   | - VPC / Security Group Ingress    |             | - Cloud Storage & Network Rules       |   |   |
|   |   | - Automated aws_destroy Workflow  |             | - Multi-cloud Terraform Parity        |   |   |
|   |   +-----------------------------------+             +---------------------------------------+   |   |
|   +-------------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 1.1:** Rich Picture of Code2Cloud Automation Workflow and Stakeholder Interactions
</div>

<br>

As depicted in Figure 1.1, the operational sequence initiates when an application developer provides a target repository link through the Code2Cloud web interface. The backend scanner clones and isolates the codebase, executing static Abstract Syntax Tree analysis to extract critical deployment telemetry, including primary runtime versions, application entry points, listening network ports, and persistent database requirements. This extracted metadata is securely routed to the recommendation engine, where workload characteristics are evaluated against cloud compute pricing feeds using a hybrid approach combining Google Gemini LLM structured outputs with deterministic fallback scoring rules.

Upon finalizing the optimal compute configuration, the code generation engine synthesizes a complete, deployable infrastructure package. This bundle includes modular Terraform scripts, containerization definitions, and GitHub Actions CI/CD workflows tailored to the target provider. Crucially, the engine automatically injects an `aws_destroy.jinja` teardown workflow, granting developers full lifecycle governance to decommission resources with a single click. Finally, the verified artifacts are either executed directly through connected cloud provider credentials or downloaded as a self-contained deployment bundle for local execution.

<!-- PAGE BREAK: SECTION 1.8 -->
<div style="page-break-before: always;"></div>

---

## 1.8. Sub Heading: Resource Requirements

To guarantee scientific rigor, experimental reproducibility, and transparent operational boundaries, the hardware and software resources utilized throughout the design, implementation, and evaluation of Code2Cloud are explicitly defined.

### 1.8.1. Sub-Sub-Heading: Hardware Requirements

The research development, local containerization testing, and static analysis benchmarking were executed across standardized hardware workstations. The primary development and benchmarking host configuration consisted of:

* **Processor / Compute:** Apple Silicon M-Series (8-Core CPU with 4 performance cores and 4 efficiency cores) providing high-concurrency local execution for repository parsing routines.
* **Random Access Memory (RAM):** 16 Gigabytes unified memory, ensuring sufficient headroom for simultaneous execution of Docker daemon containers, local PostgreSQL databases, and the FastAPI application server.
* **Persistent Storage:** 512 Gigabytes Solid-State Drive (SSD) delivering high-throughput read/write bandwidth necessary for rapid cloning, indexing, and AST scanning of large multi-file software repositories.
* **Network Connectivity:** High-speed broadband interface with symmetrical throughput exceeding 100 Mbps, required for continuous ingestion of remote Git repositories, cloud pricing APIs, and real-time provisioning requests on Amazon Web Services.

### 1.8.2. Sub-Sub-Heading: Software and Cloud Platform Requirements

The software environment leverages industry-standard open-source frameworks, programming languages, and cloud software development kits (SDKs):

* **Runtime & Backend Framework:** Python 3.10+ execution environment operating FastAPI, an asynchronous, high-performance web framework utilized for API routing, request validation, and AST parsing orchestration.
* **Data Validation & Schemas:** Pydantic v2 utilized for strict runtime data validation, deterministic data contracts, and LLM output parsing.
* **Templating & Code Generation:** Jinja2 template rendering engine utilized for deterministic compilation of Terraform configuration files, Dockerfiles, and GitHub Actions YAML workflows.
* **Containerization & IaC Tooling:** Docker Engine v24.0+ and HashiCorp Terraform CLI v1.5+ utilized for local container building, schema validation (`terraform validate`), and synthetic execution testing.
* **Artificial Intelligence Engine:** Google Gemini Pro API leveraged via the Google Generative AI Python SDK for structured JSON workload reasoning and compute instance recommendation.
* **Cloud Infrastructure Provider:** Amazon Web Services (AWS) utilized as the primary live validation cloud environment via the Boto3 SDK, including EC2, VPC, Security Groups, and IAM credential management.

<!-- PAGE BREAK: SECTION 1.9 -->
<div style="page-break-before: always;"></div>

---

## 1.9. Sub Heading: Project Scope and Boundary Analysis

To ensure the research remains methodologically rigorous and focused within undergraduate engineering boundaries, explicit operational boundaries were defined. Table 1.1 formalizes the functional scope, detailing components included in the implementation versus deliberate omissions.

<br>

| Architectural Dimension | In-Scope Functional Capabilities | Out-of-Scope Exclusions |
| :--- | :--- | :--- |
| **Application Ecosystems** | Web applications developed in Python (FastAPI, Flask, Django), Node.js (Express, Nest.js), and Java (Spring Boot). | Desktop GUI applications, native mobile applications (iOS/Android), embedded systems, and bare-metal firmware. |
| **Repository Architectures** | Single-service repositories and standard modular web architectures containing dedicated dependency manifests. | Complex distributed monorepos containing dozens of decoupled microservices across heterogeneous sub-directories. |
| **Cloud Providers** | In-depth instance sizing, dynamic pricing evaluation, and automated IaC synthesis for AWS and GCP. | Proprietary on-premises hypervisors (VMware vSphere), OpenStack private clouds, and niche regional providers. |
| **Live Cloud Deployment** | Full end-to-end automated deployment and teardown verified and validated live on Amazon Web Services (AWS). | Live execution of provisioned clusters on Microsoft Azure and Google Cloud Platform (modeled via template generation only). |
| **Environment Variables** | Static detection of `.env` configuration keys and secure in-memory secret masking during artifact synthesis. | Dynamic runtime UI for live interactive editing and hot-reloading of secret values inside active cloud containers. |
| **Lifecycle Management** | Synthesis of automated teardown workflows (`aws_destroy.jinja`) with GitHub Actions confirmation safeguards. | Real-time production application performance monitoring (APM) and autonomous runtime horizontal auto-scaling. |

<div align="center">

**Table 1.1:** In-Scope versus Out-of-Scope Functional Matrix
</div>

<br>

As detailed in Table 1.1, the functional scope concentrates squarely on modern web application architectures, which represent the overwhelming majority of cloud migration initiatives. The system focuses on static parsing of core web runtimes, where dependency structures, listening ports, and database drivers can be deterministically inferred. 

Importantly, while the system generates valid multi-cloud Terraform templates for both AWS and GCP, live cloud deployment verification is specifically conducted and proven upon Amazon Web Services (AWS). Furthermore, while the architecture provides comprehensive static detection of required environment variables, real-time dynamic runtime injection of secrets via a cloud UI represents an ongoing integration milestone that is formally tracked for future development.

<!-- PAGE BREAK: SECTION 1.10 -->
<div style="page-break-before: always;"></div>

---

## 1.10. Sub Heading: Chapter Summary

This introductory chapter has systematically established the context, problem statement, research questions, motivation, objectives, solution architecture, and operational boundaries of the Code2Cloud research project. The rapid expansion of cloud computing options, coupled with the steep learning curve of declarative Infrastructure as Code tools, has created a pervasive engineering bottleneck characterized by massive financial waste from over-provisioning and critical application failures from under-provisioning. Existing cloud optimization tools function almost entirely post-deployment, leaving software developers without automated guidance during the crucial pre-deployment phase.

To solve this dilemma, Code2Cloud introduces an automated framework that directly inspects application repositories using static AST analysis, infers runtime requirements, utilizes Google Gemini AI heuristics to match cost-efficient cloud compute instances, and synthesizes production-ready Terraform scripts, Dockerfiles, and CI/CD teardown workflows. Four formal research objectives have been defined to govern the identification of developer requirements, static code analysis, artifact development, and empirical evaluation on Amazon Web Services. With the foundational scope and boundaries established, the subsequent chapter presents a comprehensive critical review of contemporary academic literature and industrial frameworks governing automated cloud provisioning and Infrastructure as Code synthesis.
