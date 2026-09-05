<!--
================================================================================
DISSERTATION CHAPTER 02: LITERATURE REVIEW
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
- Personal critical reflection and justification against literature emphasized
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


<!-- PAGE BREAK: CHAPTER 2 MAIN HEADING -->
<div style="page-break-before: always;"></div>

<br>

# 2. MAIN HEADING: LITERATURE REVIEW

The continuous evolution of cloud computing has radically reorganized the architectural foundations of modern software deployment. While early cloud paradigms treated virtualized servers as direct replacements for on-premises bare-metal machines, contemporary software engineering relies on sophisticated distributed microservices, immutable containers, and declarative configuration models [1], [4]. As organizations increasingly migrate application workloads across multi-cloud environments, the technical challenge of accurately sizing compute resources and synthesizing reliable Infrastructure as Code (IaC) has become a primary focal point of academic and industrial research [2], [14].

However, despite substantial advancements in post-deployment monitoring and reactive auto-scaling, a critical software engineering dilemma persists during the pre-deployment phase. Software developers are routinely required to make complex infrastructure sizing, containerization, and networking decisions before their application is ever executed in production [5], [10]. This chapter conducts a comprehensive, critical literature review evaluating the state of the art in cloud resource allocation, static software repository analysis, declarative template synthesis, and multi-cloud cost optimization. Through rigorous comparative evaluation, this review highlights the fundamental limitations of existing commercial and academic tools, establishing the theoretical and practical justification for the **Code2Cloud** framework.

<!-- PAGE BREAK: SECTION 2.1 -->
<div style="page-break-before: always;"></div>

---

## 2.1. Sub Heading: Chapter Overview and Conceptual Map

This chapter is structured to provide a comprehensive, multi-dimensional critique of existing scholarly research, industrial frameworks, and algorithmic approaches pertinent to automated cloud provisioning. In strict alignment with academic research methodologies, the review does not merely summarize past work; rather, it actively assesses published methodologies against real-world engineering constraints, contrasting their underlying assumptions against the pre-deployment requirements of modern web applications. The conceptual taxonomy governing this literature review is visualized in Figure 2.1.

```
+---------------------------------------------------------------------------------------------------------+
|                    CONCEPTUAL TAXONOMY OF CLOUD PROVISIONING & IaC LITERATURE                           |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|       +------------------------------------+             +--------------------------------------+       |
|       | 1. Cloud & Containerization Domain |             | 2. Existing Provisioning Frameworks  |       |
|       | - IaaS, PaaS, and Multi-Cloud [1]  |             | - Commercial Platforms (CDK, Pulumi) |       |
|       | - Declarative IaC Models [4]       |             | - Reactive APM Monitoring [8], [12]  |       |
|       | - Security Smells in IaC [11]      |             | - Academic Sizing Prototypes [6], [7]|       |
|       +-----------------+------------------+             +------------------+-------------------+       |
|                         |                                                   |                           |
|                         +------------------------+--------------------------+                           |
|                                                  |                                                      |
|                                                  v                                                      |
|       +-----------------------------------------------------------------------------------------+       |
|       | 3. Technological & Algorithmic Analysis (Core Focus: ~60% Coverage)                     |       |
|       | - Static Source Code Analysis & AST Parsing Techniques [9], [13]                        |       |
|       | - Compute Sizing Algorithms, Cost-Performance Heuristics & Pareto Frontiers [2], [15]   |       |
|       | - Dynamic Template Compilation & Jinja2 Infrastructure Synthesizers [10]                |       |
|       +------------------------------------------+----------------------------------------------+       |
|                                                  |                                                      |
|                                                  v                                                      |
|       +-----------------------------------------------------------------------------------------+       |
|       | 4. Research Gap Synthesis & Critical Reflection                                         |       |
|       | - Absence of Pre-Deployment Automated Inference from Repositories                       |       |
|       | - Inability to Synthesize Verified Multi-Cloud IaC with Teardown Safeguards             |       |
|       | - Theoretical and Empirical Justification of Code2Cloud Novelty                         |       |
|       +-----------------------------------------------------------------------------------------+       |
+---------------------------------------------------------------------------------------------------------+
```
<div align="center">

**Figure 2.1:** Conceptual Taxonomy of Cloud Provisioning and Automated IaC Literature
</div>

<br>

As conceptualized in Figure 2.1, the review is organized into four logical quadrants that progressively narrow in focus. First, Section 2.2 establishes the foundational domain overview (comprising approximately ten percent of the chapter), evaluating the evolution of cloud virtualization, multi-cloud computing, containerization standards, and Infrastructure as Code paradigms. Next, Section 2.3 delivers a critical comparative analysis (approximately thirty percent coverage) of existing commercial cloud deployment platforms and academic sizing prototypes, analyzing their structural deficiencies when applied to developer-centric onboarding. 

Section 2.4 forms the core technical engine of this literature review (approximately sixty percent coverage), conducting an in-depth technological analysis across three critical software engineering pillars: Abstract Syntax Tree parsing mechanisms, multi-criteria resource optimization heuristics, and dynamic template synthesis algorithms. Finally, Section 2.5 synthesizes the identified research gap, presenting a critical personal reflection that contrasts existing academic assumptions against the novel pre-deployment capabilities engineered into Code2Cloud, followed by an executive summary in Section 2.6.

<!-- PAGE BREAK: SECTION 2.2 -->
<div style="page-break-before: always;"></div>

---

## 2.2. Sub Heading: Domain Overview

The modern paradigm of application hosting has undergone profound shifts over the past two decades. Understanding the strengths and shortcomings of automated provisioning necessitates an examination of the historical evolution of cloud infrastructure, virtualization topologies, container runtimes, and the declarative Infrastructure as Code movement.

### 2.2.1. Sub-Sub-Heading: Cloud Infrastructure Evolution and Multi-Cloud Paradigms

Cloud computing originally emerged as a utility computing model designed to convert capital expenditure into operational expenditure through elastic resource virtualization [1], [14]. In early Infrastructure as a Service (IaaS) deployments, cloud resources were provisioned as coarse-grained virtual machines that mirrored traditional bare-metal rack servers. Over time, cloud consumers demanded higher abstraction levels, driving the emergence of Platform as a Service (PaaS) environments such as Heroku and Google App Engine, which abstracted server management entirely at the cost of rigid architectural constraints, vendor lock-in, and exorbitant cost multipliers at scale [2], [10].

In response to vendor lock-in, modern enterprise architectures have aggressively transitioned toward multi-cloud and hybrid-cloud paradigms [9]. In a multi-cloud configuration, organizations distribute workloads across heterogeneous cloud providers—such as Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure—to prevent single-vendor dependency, exploit regional pricing arbitrage, and enhance disaster recovery resilience [15]. However, the primary impediment to multi-cloud adoption remains the acute operational heterogeneity among cloud providers. Each hyperscale provider utilizes proprietary API semantics, distinct identity and access governance models, unique compute instance naming conventions, and incompatible network peering topologies, which together impose a staggering cognitive tax on software engineering teams [3], [6].

### 2.2.2. Sub-Sub-Heading: Infrastructure as Code (IaC) and Containerization Principles

To manage the exponential complexity of multi-cloud environments, modern software engineering formalizes infrastructure management through the Infrastructure as Code (IaC) paradigm [4]. Rather than provisioning cloud resources through manual graphical web consoles or ad-hoc shell scripts, IaC defines infrastructure states using declarative, machine-readable configuration files. Declarative frameworks ensure immutability, idempotency, and version-controlled audibility, ensuring that identical configuration files yield strictly identical infrastructure topologies across staging, testing, and production environments [10]. 

Simultaneously, operating-system-level virtualization through Docker containers has become the universal deployment standard for modern web applications [9]. By packaging application binaries, language runtimes, system libraries, and system configurations into lightweight, isolated execution units, containerization guarantees absolute environmental parity between a developer's local laptop and remote cloud clusters [3]. However, as demonstrated by empirical studies conducted by Rahman et al. [11], authoring declarative Terraform configurations and containerization definitions remains highly error-prone. In an empirical analysis of over one thousand open-source repositories, Rahman et al. discovered that over sixty percent of practitioner-authored IaC scripts contain critical "security smells," including hardcoded credentials, unrestricted firewall ingress rules (`0.0.0.0/0`), and missing integrity verifications [11].

<!-- PAGE BREAK: SECTION 2.3 -->
<div style="page-break-before: always;"></div>

---

## 2.3. Sub Heading: Critical Review of Existing Systems and Frameworks

To contextualize the contributions of this research, existing commercial and academic cloud provisioning frameworks were subjected to a rigorous comparative assessment. Each solution was evaluated against three essential criteria: its capacity to automate pre-deployment repository analysis, its ability to generate multi-cloud declarative IaC, and its support for lifecycle cost optimization and safe resource teardown.

### 2.3.1. Sub-Sub-Heading: Commercial Cloud Management Platforms

The contemporary commercial landscape features a variety of cloud deployment and management platforms, each embodying distinct architectural philosophies. Proprietary cloud-native frameworks, such as AWS CloudFormation and the AWS Cloud Development Kit (CDK), provide deep integration within the Amazon Web Services ecosystem [4]. While AWS CDK empowers developers to define cloud resources using familiar imperative programming languages (such as TypeScript or Python), it suffers from total vendor lock-in; configurations authored in CDK cannot be deployed to Google Cloud Platform or Microsoft Azure without a complete rewrite into foreign vendor primitives.

Multi-cloud commercial orchestrators, such as HashiCorp Terraform and Pulumi, overcome vendor lock-in by utilizing declarative domain-specific languages (HashiCorp Configuration Language - HCL) or universal programming languages targeting multi-cloud providers [10]. However, in my critical assessment, both Terraform and Pulumi operate solely as downstream execution engines. They require software engineers to manually conceptualize, design, and specify every individual cloud resource, subnet ID, security group ingress rule, and virtual machine sizing parameter before execution. Neither platform possesses the capability to inspect an application's codebase to determine what compute instance size or database tier is actually needed.

Modern PaaS platforms, including Heroku, Railway, and Render, deliver superior developer experience by automatically building containers directly from connected GitHub repositories [12]. However, these platforms represent architectural black boxes that operate on proprietary container clusters. Developers cannot export native, modular Terraform scripts to run on their own enterprise AWS or GCP accounts. Furthermore, their unit compute pricing is frequently marked up by three hundred to five hundred percent compared to raw IaaS compute instances, making them economically unviable for scaling organizations [7].

### 2.3.2. Sub-Sub-Heading: Academic and Open-Source Sizing Prototypes

Within the academic domain, numerous research prototypes have explored automated resource provisioning and performance prediction. Early pioneering work by Li et al. [2] introduced *CloudCmp*, a systematic benchmarking framework designed to compare public cloud providers in terms of compute throughput, disk I/O, and network latency. While CloudCmp provided foundational empirical data proving that identical virtual machine tiers across different cloud providers exhibit vast performance discrepancies, it functioned purely as a passive benchmarking utility and offered no mechanisms for code generation or automated repository analysis.

Sharma et al. [4] developed *Flint*, an interactive framework tailored for data-intensive processing that leveraged transient spot instances to reduce cloud costs. While Flint demonstrated significant cost reductions for batch jobs, its algorithmic architecture is unsuitable for modern stateful web applications that require sustained availability and deterministic compute baselines. More recently, Zhang and Wang [6] presented *CloudCostOpt*, a multi-objective cost optimization framework for cloud environments. However, CloudCostOpt relies exclusively on mathematical modeling of hypothetical workloads and lacks any capability to interact with real-world source code repositories or generate executable Infrastructure as Code templates.

Kim et al. [7] proposed *TerraGen*, a prototype aimed at automatically generating Terraform configurations from high-level abstract system specifications. While TerraGen validated the feasibility of automated HCL synthesis, it required developers to manually fill out extensive JSON schema descriptions defining memory bounds, vCPU counts, and port allocations. In my critical reflection, requiring manual parameter specification severely undermines the utility of automated generation; if a developer already knows the precise vCPU, RAM, and port parameters of their application, the primary cognitive barrier has already been breached. Table 2.1 provides a systematic comparative synthesis of these existing systems against Code2Cloud.

<br>

| Solution / Framework | Pre-Deployment Static Repo Scanning | Multi-Cloud IaC Synthesis (Terraform) | Containerization Automation (Docker) | Pre-Deployment Instance Sizing | Automated Cloud Teardown Workflows | Cloud Vendor Portability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AWS CloudFormation / CDK [4]** | No | No (AWS Only) | No | No (Manual Input) | Partial | None (AWS Lock-in) |
| **HashiCorp Terraform CLI [10]** | No | Yes (Manual Code) | No | No (Manual Input) | Yes (CLI command) | High |
| **Heroku / Railway / Render [12]** | Partial (Buildpacks) | No | Yes (Implicit) | Coarse / Fixed Tiers | No (Manual Console) | None (Platform Lock-in) |
| **CloudCmp (Li et al.) [2]** | No | No | No | Benchmark Only | No | Multi-Cloud |
| **CloudCostOpt (Zhang et al.) [6]** | No | No | No | Theoretical Sim | No | Theoretical |
| **TerraGen (Kim et al.) [7]** | No (Manual JSON) | Yes | No | Manual Input | No | Multi-Cloud |
| **Code2Cloud (This Research)** | **Yes (AST Analysis)** | **Yes (Deterministic)** | **Yes (Multi-Stage)** | **Yes (Gemini + Sizing)** | **Yes (aws_destroy.jinja)** | **High (AWS & GCP)** |

<div align="center">

**Table 2.1:** Comparative Analysis of State-of-the-Art Cloud Recommendation Frameworks
</div>

<br>

As evidenced by the comparative matrix in Table 2.1, existing frameworks exhibit significant functional bifurcation. Tools that provide robust Infrastructure as Code generation lack intelligent repository analysis and compute sizing, while tools that attempt performance prediction operate as disconnected academic simulations or reactive post-deployment monitors. Code2Cloud is uniquely positioned at the intersection of static code analysis, AI-driven instance sizing, and deterministic multi-cloud IaC synthesis.

<!-- PAGE BREAK: SECTION 2.4 -->
<div style="page-break-before: always;"></div>

---

## 2.4. Sub Heading: Technological and Algorithmic Analysis

To design an automated, pre-deployment recommendation and synthesis engine, it is necessary to examine the underlying technologies and algorithms that power static code parsing, resource optimization, and template compilation. This section details the theoretical and algorithmic mechanics governing these three technical pillars.

### 2.4.1. Sub-Sub-Heading: Static Code Analysis and Abstract Syntax Tree (AST) Parsing

Static program analysis examines software without executing the underlying source code on a physical or virtual processor [13]. Within modern compiler design, source code is converted through lexical scanning and tokenization into an Abstract Syntax Tree (AST)—a structural, hierarchical graph representing the syntactic and semantic constructs of the program [9]. In web application engineering, AST parsing enables deterministic identification of application behavior, including HTTP server initialization, route handlers, network socket bindings, database connection drivers, and environment variable lookups.

Compared to dynamic analysis—which requires executing applications within isolated sandboxes, spinning up auxiliary databases, and intercepting network sockets—static AST inspection offers immense operational advantages for cloud onboarding pipelines. Dynamic analysis requires significant initialization latency, risks executing untrusted arbitrary code on host runners, and frequently fails if essential runtime environment variables or external API keys are missing during container boot [10]. Conversely, static AST inspection executes in milliseconds, safely operates on untrusted codebases without arbitrary code execution vulnerabilities, and accurately extracts structural metadata (e.g., detecting `app.listen(3000)` in Node.js or `uvicorn.run(..., port=8000)` in Python FastAPI) directly from source text [13].

### 2.4.2. Sub-Sub-Heading: Infrastructure Sizing and Cost-Optimization Algorithms

Translating extracted application characteristics into optimal cloud compute instances requires robust multi-criteria optimization algorithms [15]. A web application's computational footprint is governed by multiple competing constraints: virtual CPU core requirements, memory saturation thresholds, persistent storage throughput, network bandwidth, and monthly financial budget ceilings [8]. Mathematically, this challenge maps to a multi-objective optimization problem along a Pareto frontier, where the objective function seeks to minimize total financial cost while maximizing compute headroom to prevent performance degradation [6].

Formally, let $\mathcal{I} = \{i_1, i_2, \dots, i_n\}$ represent the universe of available cloud compute instances across target cloud providers. Each instance $i \in \mathcal{I}$ is defined by a tuple:

$$i = \langle v_i, m_i, p_i, \mathcal{C}_i \rangle$$

where $v_i$ denotes virtual CPU count, $m_i$ denotes physical RAM capacity in gigabytes, $p_i$ represents the hourly pricing tariff in USD, and $\mathcal{C}_i$ denotes the cloud service provider ($\mathcal{C}_i \in \{\text{AWS}, \text{GCP}\}$). Given an application workload profile extracted via static analysis, denoted as $W = \langle v_{\text{req}}, m_{\text{req}}, \tau \rangle$, where $\tau$ signifies the architectural concurrency tier (low, medium, high), the sizing scoring function $\mathcal{S}(i, W)$ can be formulated as:

$$\mathcal{S}(i, W) = w_1 \cdot \left( \frac{v_i - v_{\text{req}}}{v_{\text{req}}} \right) + w_2 \cdot \left( \frac{m_i - m_{\text{req}}}{m_{\text{req}}} \right) - w_3 \cdot \left( \frac{p_i}{p_{\max}} \right)$$

subject to the strict feasibility constraints $v_i \ge v_{\text{req}}$ and $m_i \ge m_{\text{req}}$. The weighting parameters $w_1, w_2, w_3 \in [0, 1]$ satisfy $\sum_{j=1}^3 w_j = 1$, enabling dynamic balancing between compute headroom and financial expenditure. By coupling this mathematical scoring model with Google Gemini AI structured schema inference, the recommendation engine achieves nuanced reasoning capable of accounting for specialized runtime characteristics, such as JVM memory overhead in Spring Boot or single-threaded event loop characteristics in Node.js [5].

### 2.4.3. Sub-Sub-Heading: Template Synthesis and Jinja2 Dynamic Orchestration

Once compute instances and architectural parameters are finalized, the infrastructure definitions must be synthesized deterministically. In software engineering, code generation frameworks generally utilize either programmatic Document Object Model (DOM) tree emitters or text-based template rendering engines [10]. Programmatic DOM emitters require complex, tightly coupled internal representations for every target language, making multi-cloud extensions prohibitively expensive to maintain.

In contrast, text-based templating engines—predominantly Jinja2 in the Python ecosystem—utilize declarative template files augmented with control flow expressions, variable interpolation, and conditional evaluation filters [4]. Jinja2 provides clean separation between architectural templates and runtime application metadata. By maintaining modular, security-hardened Jinja2 template definitions for Terraform (`main.tf`, `variables.tf`, `outputs.tf`), Docker container specifications, and GitHub Actions workflows, the generation engine can dynamically compile valid, syntactically pristine Infrastructure as Code bundles. Crucially, this templating architecture allows seamless injection of automated lifecycle routines, including the `aws_destroy.jinja` workflow, ensuring that generated deployments are accompanied by self-contained decommissioning capabilities.

<!-- PAGE BREAK: SECTION 2.5 -->
<div style="page-break-before: always;"></div>

---

## 2.5. Sub Heading: Identification of the Research Gap and Critical Reflection

A comprehensive synthesis of the surveyed academic literature and industrial frameworks reveals a significant research gap in the pre-deployment phase of cloud software engineering. This section summarizes these critical limitations and articulates the scholarly justification for the Code2Cloud architecture.

### 2.5.1. Sub-Sub-Heading: Synthesis of Literature Limitations

The critical analysis of existing literature highlights three primary shortcomings:

1. **The Pre-Deployment Blindspot:** Existing performance modeling and cost optimization tools [2], [8], [12] operate reactively. They depend upon active production telemetry collected over days or weeks of runtime execution. Consequently, software developers initiating greenfield deployments or migrating new microservices have zero automated assistance when making foundational infrastructure choices.
2. **Disconnected Infrastructure Code Authoring:** Current Infrastructure as Code tools (Terraform, Pulumi, CloudFormation) operate in complete isolation from the software application codebase [4], [10]. They require human developers to manually translate their application's runtime demands into complex declarative configuration scripts, creating a breeding ground for security misconfigurations and fiscal waste [11].
3. **Absence of Lifecycle Teardown Governance:** Automated deployment frameworks focus overwhelmingly on provisioning resources, neglecting the decommissioning lifecycle. The literature demonstrates that unmonitored orphan resources account for significant enterprise cloud waste [7], yet existing template generators fail to synthesize automated, self-contained teardown workflows alongside deployment assets.

### 2.5.2. Sub-Sub-Heading: Justification and Novelty of the Code2Cloud Approach

In my critical reflection, bridging these gaps requires an end-to-end framework that unifies repository-level static code analysis with intelligent instance sizing and automated IaC synthesis. Code2Cloud directly resolves the pre-deployment blindspot by extracting structural telemetry directly from code repositories before deployment, eliminating manual guesswork. By coupling static AST parsing with the multi-criteria scoring algorithm and Gemini AI reasoning, the system generates optimized instance sizing tailored to specific frameworks.

Furthermore, Code2Cloud resolves the IaC disconnect by automatically emitting security-hardened, multi-cloud Terraform templates and Dockerfiles that embed best practices directly into the output. The automatic synthesis of the `aws_destroy.jinja` workflow introduces crucial lifecycle governance, ensuring developers can decommission test environments in a single click. By unifying these disjointed software engineering domains into a coherent pipeline, Code2Cloud delivers a novel, scientifically grounded, and practically viable contribution to cloud software engineering.

<!-- PAGE BREAK: SECTION 2.6 -->
<div style="page-break-before: always;"></div>

---

## 2.6. Sub Heading: Chapter Summary

This chapter has provided a critical, comprehensive review of the academic literature, industrial frameworks, and technological algorithms governing cloud infrastructure provisioning, containerization, and Infrastructure as Code. The domain overview demonstrated how the transition to containerized and multi-cloud architectures has magnified configuration complexity for application developers. A comparative analysis of commercial platforms (AWS CDK, Terraform, PaaS tools) and academic prototypes (CloudCmp, Flint, TerraGen) established that existing solutions either require extensive manual configuration, introduce platform lock-in, or operate exclusively as reactive post-deployment monitors.

The technological analysis explored the mechanics of static Abstract Syntax Tree analysis, mathematical Pareto frontier scoring models for compute sizing, and dynamic template synthesis using Jinja2. Finally, the synthesis of literature limitations justified the architectural novelty of Code2Cloud as an integrated pre-deployment framework capable of analyzing codebases, optimizing multi-cloud compute instances, and generating deterministic Terraform, Docker, and teardown workflows. Having established the conceptual and theoretical grounding of the study, the subsequent chapter details the research methodology, paradigm, and experimental design governing the realization of the Code2Cloud artifact.
