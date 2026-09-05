<!--
================================================================================
DISSERTATION CHAPTER 03: RESEARCH METHODOLOGY
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


<!-- PAGE BREAK: CHAPTER 3 MAIN HEADING -->
<div style="page-break-before: always;"></div>

<br>

# 3. MAIN HEADING: RESEARCH METHODOLOGY

Rigorous software engineering research requires a structured epistemological foundation and a disciplined methodological workflow to guarantee that developed artifacts are both scientifically valid and practically impactful [12]. In the domain of cloud infrastructure automation, research cannot rely exclusively on theoretical conjectures or passive statistical surveys. Rather, it demands the creation, operationalization, and empirical benchmarking of an executable software artifact capable of interacting with complex, heterogeneous external environments [10].

This chapter articulates the comprehensive research methodology governing the conceptualization, development, and evaluation of **Code2Cloud**. The investigation is philosophically situated within the Pragmatism research paradigm, adopting the established Design Science Research (DSR) framework pioneered by Peffers et al. [12]. The narrative delineates the deductive and constructive research approaches, data collection mechanisms, execution workflows, Agile/Scrum project management structures, and ethical considerations observed to protect intellectual property and credential security throughout the study.

<!-- PAGE BREAK: SECTION 3.1 -->
<div style="page-break-before: always;"></div>

---

## 3.1. Sub Heading: Chapter Overview

The objective of this chapter is to provide a transparent, repeatable methodological blueprint that steered the execution of this final year research project. By formalizing each stage of inquiry—from initial problem identification to empirical cloud validation—the methodology ensures that all engineering decisions, algorithmic models, and experimental findings are anchored in rigorous academic standards. The structural progression of the chapter is designed to transition logically from high-level philosophical underpinnings to granular procedural workflows.

The discussion commences in Section 3.2 by justifying the selection of the Pragmatism paradigm and establishing the Design Science Research (DSR) model as the guiding operational framework. Section 3.3 elaborates on the constructive and experimental research strategies utilized to formulate and benchmark the system. In Section 3.4, the fact-collection protocols, open-source benchmark repository datasets, and cloud provider pricing ingestion pipelines are cataloged in detail.

Section 3.5 formalizes the sequential DSR research methodology execution workflow, presenting an end-to-end mapping table that aligns research phases with analytical techniques and tangible deliverables. Section 3.6 outlines the Agile/Scrum project management framework, sprint cadences, and work breakdown structures, complemented by an implementation timeline. Finally, Section 3.7 addresses ethical protocols, software licensing adherence, and credential isolation practices, followed by a concise chapter summary in Section 3.8.

<!-- PAGE BREAK: SECTION 3.2 -->
<div style="page-break-before: always;"></div>

---

## 3.2. Sub Heading: Research Paradigm and Philosophy

Every scholarly inquiry is guided by underlying philosophical assumptions regarding the nature of reality (ontology), what constitutes acceptable knowledge (epistemology), and the systematic processes used to obtain that knowledge (methodology) [12]. Selecting an appropriate philosophical paradigm is paramount, as it determines the lens through which research questions are framed, artifacts are constructed, and empirical outcomes are validated.

### 3.2.1. Sub-Sub-Heading: Pragmatism Paradigm Justification

This research is situated within the **Pragmatism** paradigm. Traditional scientific research philosophies, such as Positivism, assert that objective reality exists independently of human observation and must be measured solely through quantitative, deductive experiments [12]. Conversely, Interpretivism argues that reality is socially constructed through human subjective experiences, emphasizing qualitative ethnographies and unstructured interviews. While Positivism provides rigorous mathematical metrics and Interpretivism offers rich contextual insights into human developer behavior, neither philosophy alone is sufficient for applied software engineering.

Pragmatism sidesteps the contentious ontological debate between pure objectivity and subjective interpretation by asserting that the value of knowledge is determined by its practical applicability and problem-solving efficacy in real-world contexts [10]. For software engineering disciplines, Pragmatism provides the ideal intellectual grounding because the ultimate measure of success is whether a developed technological artifact effectively resolves an observed engineering impediment. In the context of Code2Cloud, the philosophy allows this study to combine quantitative performance metrics (e.g., AST parsing latency, hourly compute pricing tariffs, and memory saturation thresholds) with qualitative developer experience factors (e.g., simplifying complex Terraform configuration syntax and mitigating developer cognitive load).

### 3.2.2. Sub-Sub-Heading: Design Science Research (DSR) Grounding

To operationalize the Pragmatism philosophy into a structured engineering process, this research adopts the **Design Science Research (DSR)** methodology formalized by Peffers et al. [12]. Unlike behavioral science—which seeks to discover and explain empirical truths about human behavior—Design Science Research focuses on creating and evaluating innovative technological artifacts designed to solve identified business and organizational problems. A DSR artifact can take the form of constructs, models, methods, or instantiations.

```
+---------------------------------------------------------------------------------------------------------+
|                              PEFFERS ET AL. DSR METHODOLOGY LIFECYCLE                                   |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   1. Problem Identification  -->  2. Define Objectives  -->  3. Design & Development                    |
|   - Over-provisioning waste      - Pre-deployment sizing     - Fast AST parser                          |
|   - IaC authoring friction       - Multi-cloud IaC output    - Gemini recommendation                    |
|   - Orphan cloud resource leaks  - Lifecycle teardown        - Jinja2 IaC synthesizers                  |
|                                                                                                         |
|                                                                             |                           |
|                                                                             v                           |
|                                                                                                         |
|   6. Communication           <--  5. Evaluation         <--  4. Demonstration                           |
|   - Dissertation document        - Latency benchmarks        - Live deployment on AWS                   |
|   - IEEE ICACT2026 conference    - Terraform validation      - Automated resource teardown              |
|   - Open-source codebase         - Cost savings analysis     - Multi-framework ingestion                |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

Code2Cloud represents an **instantiation artifact**—an operational software system realized to address the concrete problem of pre-deployment cloud misconfiguration. As illustrated in the DSR lifecycle model above, the research executes systematically across six iterative stages: identifying the core problem, defining precise objective targets, designing the underlying algorithms, demonstrating the prototype through live provisioning, evaluating performance against industry baselines, and communicating findings through academic publications and this dissertation [12]. This methodological alignment ensures that the research maintains academic rigor while delivering an impactful engineering solution.

<!-- PAGE BREAK: SECTION 3.3 -->
<div style="page-break-before: always;"></div>

---

## 3.3. Sub Heading: Research Approach and Strategy

Translating high-level philosophical foundations into tangible software deliverables requires establishing clear research approaches and experimental execution strategies.

### 3.3.1. Sub-Sub-Heading: Deductive and Constructive Research Approach

This study employs a combined **deductive and constructive research approach**. The deductive facet begins with established theoretical principles in cloud elasticity, multi-tenant virtualization, compiler theory, and declarative configuration models [1], [4]. From these foundational theories, specific testable hypotheses were deduced—namely, that static AST inspection of web application manifests and source code files is sufficient to infer runtime compute footprints, and that multi-criteria heuristics can deterministically map these footprints to optimal cloud compute instances without requiring active container execution.

Simultaneously, the constructive research methodology governed the tangible creation of the Code2Cloud software artifact. Constructive research in software engineering requires that the proposed solution not only possesses theoretical novelty but is also fully realized as an engineered artifact capable of functioning within existing technological ecosystems [10]. The construction phase involved implementing asynchronous backend microservices in Python, designing modular Jinja2 configuration templates, formalizing Pydantic schemas, and interfacing with commercial cloud APIs across Amazon Web Services and Google Cloud Platform.

### 3.3.2. Sub-Sub-Heading: Experimental and Prototyping Strategy

To empirically validate the constructive artifacts, an **evolutionary prototyping and experimental benchmarking strategy** was executed. Prototyping enabled rapid, iterative refinement of the system based on immediate feedback loops. Initial prototypes focused on basic static string scanning of dependency manifests; however, experimental feedback revealed that simple lexical scanning was inadequate for detecting complex, dynamically allocated server ports or parameterized database connection strings.

Consequently, the prototyping strategy evolved into full Abstract Syntax Tree parsing and structured Large Language Model integration. The experimental strategy utilized controlled synthetic test suites alongside real-world open-source repositories. By executing comparative experiments—measuring code synthesis latency, configuration syntax validity (`terraform validate`), and deployment success rates under real-world Amazon Web Services provisioning cycles—the research obtained verifiable, quantitative proof of artifact efficacy.

<!-- PAGE BREAK: SECTION 3.4 -->
<div style="page-break-before: always;"></div>

---

## 3.4. Sub Heading: Fact Collection Mechanisms and Data Sources

To inform the design of the recommendation engine and validate its algorithmic accuracy, empirical data was collected from two primary sources: public open-source software repositories and commercial cloud provider telemetry feeds.

### 3.4.1. Sub-Sub-Heading: Public Repository Benchmarks and Open-Source Codebases

A primary challenge in pre-deployment analysis is ensuring that the static scanner reliably interprets diverse software architectures and dependency conventions. To establish a robust fact-collection baseline, a curated dataset of open-source web application repositories was assembled from GitHub. The selection criteria mandated that repositories must:
1. Represent real-world production web applications rather than trivial "Hello World" exercises.
2. Span the primary targeted backend languages and web frameworks: Python (FastAPI, Flask, Django), Node.js (Express.js, Nest.js), and Java (Spring Boot).
3. Possess complete dependency manifests (`requirements.txt`, `package.json`, or `pom.xml`) and explicit application entry points.

This repository dataset served as the empirical foundation for tuning the AST parsing heuristics. Analyzing the AST structures of these diverse repositories exposed edge-case syntax patterns—such as parameterized environment variable bindings and multi-stage build scripts—enabling the development of robust, error-tolerant extraction logic within `service_analyzer.py`.

### 3.4.2. Sub-Sub-Heading: Cloud Service Provider API Metrics and Pricing Feeds

To ensure that compute instance recommendations reflect real-world operational economics, empirical pricing and hardware specifications were continuously ingested from hyperscale cloud provider APIs. For Amazon Web Services, instance telemetry was retrieved using the AWS Price List API and Boto3 SDK, capturing hourly tariffs, vCPU core allocations, physical memory capacities, and network performance ratings for general-purpose (t3, m5), compute-optimized (c5), and memory-optimized (r5) instance families across multiple deployment regions (e.g., `us-east-1`, `eu-west-1`).

Similarly, Google Cloud Platform compute specifications were mapped for E2, N2, and C2 instance classes. These empirical pricing feeds were normalized into a unified, machine-readable JSON catalog within the Code2Cloud backend. Collecting real-time pricing data ensured that the heuristic scoring algorithm evaluated true market rates, enabling the system to identify the optimal cost-performance Pareto frontier for any analyzed application workload.

<!-- PAGE BREAK: SECTION 3.5 -->
<div style="page-break-before: always;"></div>

---

## 3.5. Sub Heading: Research Methodology Execution Workflow

In adherence to the Design Science Research guidelines, the research was executed through an iterative, phased workflow. Table 3.1 formalizes the mapping between each DSR research phase, the specific methodological techniques deployed, the data sources utilized, and the resulting academic and software deliverables.

<br>

| DSR Research Phase | Methodological Techniques Applied | Primary Data Sources | Tangible Deliverables / Outputs |
| :--- | :--- | :--- | :--- |
| **1. Problem Identification** | Literature survey, empirical industry report analysis, developer friction evaluation. | Peer-reviewed publications, CNCF reports, Flexera State of Cloud surveys. | Formal Problem Statement, Research Questions (RQ1, RQ2), Proposal Document. |
| **2. Objectives Definition** | Requirement operationalization, goal decomposition, scope boundary analysis. | Academic curriculum guidelines, supervisory consultations with Mr. Diluka Wijesinghe. | Four formal Research Objectives, Scope Matrix (`Table 1.1`), SRS Document. |
| **3. Design & Development** | AST grammar construction, heuristic algorithm modeling, Jinja2 template engineering. | Python AST libraries, AWS/GCP API documentation, Terraform HCL specifications. | Code2Cloud Core Engine (`service_analyzer.py`, `service_generator.py`, Jinja templates). |
| **4. Demonstration** | Live cloud infrastructure provisioning, automated CI/CD pipeline execution. | Public GitHub benchmark repositories, live AWS cloud credentials. | Validated AWS EC2/ECS provisioning, automated teardown execution (`aws_destroy.jinja`). |
| **5. Empirical Evaluation** | Benchmarking synthesis latency, syntax validation (`terraform validate`), cost analysis. | Empirical AWS billing matrices, experimental test cases (TC-01 to TC-25). | Latency charts, accuracy scores, cost savings matrix (`Table 6.2`), Chapter 6. |
| **6. Scholarly Communication** | Academic thesis documentation, conference paper publication, code archival. | Experimental telemetry, system diagrams, algorithmic pseudocode. | Complete Draft Thesis, ICACT2026 Conference Paper (`docs/ICACT2026/`). |

<div align="center">

**Table 3.1:** Mapping of DSR Phases to Methodological Techniques, Data Sources, and Deliverables
</div>

<br>

To visualize the procedural execution of these phases, Figure 3.1 details the sequential DSR lifecycle adopted throughout this research project, highlighting the continuous feedback loops connecting evaluation results back to architectural refinement.

```
+---------------------------------------------------------------------------------------------------------+
|                        SEQUENTIAL DESIGN SCIENCE RESEARCH (DSR) LIFECYCLE                               |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   [ PHASE 1: AWARENESS OF PROBLEM ]                                                                     |
|   - Literature Review on Cloud Over-provisioning & IaC Complexity                                       |
|   - Empirical Analysis of Developer Misconfiguration Statistics                                         |
|                                    |                                                                    |
|                                    v                                                                    |
|   [ PHASE 2: SUGGESTION & OBJECTIVES ]                                                                  |
|   - Formulation of Research Questions (RQ1: Extraction, RQ2: Optimization)                             |
|   - Definition of 4 Research Objectives & Scope Matrix Boundaries                                       |
|                                    |                                                                    |
|                                    v                                                                    |
|   [ PHASE 3: DEVELOPMENT & ARTIFACT CREATION ] <----------------------------------------+               |
|   - Static AST Analyzer Engine (`service_analyzer.py`)                                  | Iterative     |
|   - Gemini AI Recommendation Service (`recommendation_service.py`)                      | Refinement    |
|   - Jinja2 Synthesizers for Terraform, Docker, and Teardown Workflows                   | Feedback      |
|                                    |                                                    | Loop          |
|                                    v                                                    |               |
|   [ PHASE 4: DEMONSTRATION & PROTOTYPING ]                                              |               |
|   - Ingestion of Real-world Web Application Repositories                                |               |
|   - Live Deployment & Resource Teardown on Amazon Web Services (AWS)                    |               |
|                                    |                                                    |               |
|                                    v                                                    |               |
|   [ PHASE 5: EVALUATION & BENCHMARKING ] -----------------------------------------------+               |
|   - Syntactic Validation (`terraform validate`) & Generation Latency Testing                            |
|   - Cost-Efficiency Benchmarking against Expert DevOps Baselines                                        |
|                                    |                                                                    |
|                                    v                                                                    |
|   [ PHASE 6: CONCLUSION & COMMUNICATION ]                                                               |
|   - Complete Draft Thesis Submission to NSBM Faculty of Computing                                       |
|   - Research Paper Submission to ICACT 2026 Conference                                                  |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 3.1:** Sequential Design Science Research (DSR) Methodology Lifecycle for Code2Cloud
</div>

<br>

As depicted in Figure 3.1, the evaluation phase in Phase 5 continuously feeds back into the development phase in Phase 3. For example, when preliminary AWS deployment demonstrations encountered cloud resource leaks during failed provisioning runs, the design was iteratively enhanced by engineering the automated `aws_destroy.jinja` teardown workflow, directly fulfilling the DSR mandate for evolutionary artifact improvement.

<!-- PAGE BREAK: SECTION 3.6 -->
<div style="page-break-before: always;"></div>

---

## 3.6. Sub Heading: Project Management Methodology and Governance

The execution of a multi-disciplinary software engineering project involving compiler analysis, machine learning heuristics, and cloud orchestration requires structured project management to ensure milestone adherence.

### 3.6.1. Sub-Sub-Heading: Agile/Scrum Framework Adaptation

The development of Code2Cloud was governed by an adapted **Agile/Scrum framework**. Rather than relying on a rigid, sequential Waterfall approach—which postpones testing and deployment until the final stages—Agile facilitated rapid two-week sprint iterations. Each sprint encompassed backlog refinement, sprint planning, feature implementation, integration testing, and a retrospective review.

This Agile adaptation was particularly vital when integrating the Google Gemini recommendation engine. Early implementations utilized basic static prompt strings; however, sprint review feedback highlighted that unstructured LLM responses caused unpredictable JSON parsing errors. Through sprint iteration, the architecture was pivoted to enforce rigid Pydantic JSON schemas alongside deterministic fallback scoring, dramatically improving system reliability.

### 3.6.2. Sub-Sub-Heading: Sprint Cadence, Milestones, and Work Breakdown Structure

The research project was scheduled across six major work packages, spanning an eight-month development and evaluation lifecycle. Figure 3.2 illustrates the project implementation timeline and Work Breakdown Structure (WBS) via a Gantt chart representation.

```
+---------------------------------------------------------------------------------------------------------+
|                                  PROJECT IMPLEMENTATION GANTT CHART                                     |
+---------------------------------------------------------------------------------------------------------+
| Task / Work Package            | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | Status                     |
+--------------------------------+----+----+----+----+----+----+----+----+----------------------------+
| WP1: Literature Review & DSR   | XX | XX |    |    |    |    |    |    | 100% Completed             |
| WP2: AST Parser & Ingestion    |    | XX | XX |    |    |    |    |    | 100% Completed             |
| WP3: Recommendation & Pricing  |    |    | XX | XX |    |    |    |    | 100% Completed             |
| WP4: IaC Synthesis & Teardown  |    |    |    | XX | XX |    |    |    | 100% Completed (AWS Flow)  |
| WP5: Evaluation & Benchmarks   |    |    |    |    |    | XX | XX |    | In Progress / Finalizing   |
| WP6: Dissertation & Submission |    |    |    |    |    |    | XX | XX | Complete Draft Phase       |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 3.2:** Project Implementation Timeline and Work Breakdown Structure (Gantt Chart)
</div>

<br>

As outlined in Figure 3.2, Work Packages 1 through 4—encompassing the theoretical foundation, static AST analyzer, AI pricing recommender, and automated AWS Terraform/teardown generation engine—have reached full operational completion. Work Package 5 (Evaluation & Benchmarks) is currently active, executing extended microservice test suites to finalize Chapter 6. Work Package 6 is actively progressing through the compilation of this complete draft dissertation for submission to the Faculty of Computing, NSBM Green University.

<!-- PAGE BREAK: SECTION 3.7 -->
<div style="page-break-before: always;"></div>

---

## 3.7. Sub Heading: Ethical Considerations and Data Integrity

In modern software engineering research, ethical compliance, intellectual property protection, and information security standards must be rigorously enforced, particularly when interacting with remote codebases and cloud environments.

### 3.7.1. Sub-Sub-Heading: Repository Licensing and Intellectual Property Compliance

The ingestion of software repositories introduces significant intellectual property considerations. In this research, all external codebases utilized during training, testing, and benchmarking were restricted strictly to public repositories licensed under permissive open-source frameworks (e.g., MIT, Apache 2.0, and BSD-3-Clause licenses). 

The Code2Cloud platform enforces non-destructive static analysis; it clones repositories into ephemeral local storage buffers, executes in-memory AST analysis, and immediately deletes temporary repository artifacts post-analysis. At no point is a developer's private source code permanently archived, indexed for external machine learning models, or redistributed, ensuring complete compliance with global intellectual property and copyright laws.

### 3.7.2. Sub-Sub-Heading: Cloud Security and Credential Isolation Standards

Interacting with commercial cloud provider APIs introduces acute security risks regarding identity credentials, access keys, and environment variables. To mitigate data leakage, Code2Cloud strictly adheres to the principle of least privilege and credential isolation:

1. **In-Memory Secret Handling:** As implemented in `secrets_handler.py`, detected application environment variables (`.env`) are held strictly in transient memory buffers during template synthesis. Secret values are injected directly into the user's downloadable archive and are never persisted in backend databases or written to application log streams.
2. **Ephemeral Cloud Permissions:** Cloud provisioning on Amazon Web Services utilizes scoped IAM roles with tightly bounded policy boundaries. Users are guided to configure deployment credentials possessing only resource-level permissions necessary for EC2, VPC, and Security Group provisioning, completely eliminating the exposure of root account credentials.
3. **Safe Teardown Verification:** To eliminate accidental financial liability, the synthesized `aws_destroy.jinja` workflow enforces an explicit manual confirmation input (`confirm_destroy == 'DESTROY'`), preventing unauthorized or inadvertent infrastructure deletion while guaranteeing cost-leak prevention.

<!-- PAGE BREAK: SECTION 3.8 -->
<div style="page-break-before: always;"></div>

---

## 3.8. Sub Heading: Chapter Summary

This chapter has established the formal research methodology, philosophical paradigm, and operational workflows governing the execution of the Code2Cloud research project. Situating the study within the Pragmatism paradigm and adopting the Design Science Research (DSR) methodology ensured that the research focused on delivering a scientifically validated, practically actionable software artifact. The combined deductive and constructive research strategies enabled the formulation of testable hypotheses regarding static AST extraction accuracy, which were systematically implemented and evaluated across iterative Agile/Scrum sprints.

The chapter detailed the fact-collection mechanisms governing open-source repository harvesting and real-time cloud pricing API ingestion, formalizing the sequential DSR execution lifecycle in Table 3.1 and Figure 3.1. Furthermore, project governance was documented through a structured Work Breakdown Structure and Gantt chart, tracking milestones from inception to the current draft submission. Finally, comprehensive ethical safeguards governing open-source licensing, in-memory credential isolation, and automated cloud teardown verification were articulated. Building upon these methodological foundations, the subsequent chapter presents the comprehensive System Requirement Specification (SRS) and architectural modeling of the Code2Cloud platform.
