# ICACT 2026 Conference Paper Submission Guidelines & Rules

## Overview
This document defines the strict submission checklist, formatting guidelines, rules, and compilation parameters for submitting research papers to the **28th International Conference on Advanced Communications Technology (ICACT 2026)**.

---

## Official Submission Checklist & Constraints

| Parameter | Rule / Specification | Enforcement Mechanism |
| :--- | :--- | :--- |
| **Target Page Count** | **Strictly 6 Pages** (IEEE 2-column layout) | Word count target ~3,200 – 4,000 words structured across 6 main sections. |
| **Plagiarism Budget** | **Maximum 30%** (excluding References) | Peer-reviewed originality check; requires self-contained phrasing and formal academic tone. |
| **Target Output Format** | **PDF** (`.pdf`) | Compiled from Markdown / LaTeX / MS Word template. |
| **Page Paper Size** | **A4 Size** ($210 \text{ mm} \times 297 \text{ mm}$) | Standard IEEE A4 page geometry ($0.75\text{"}$ top/bottom margins, $0.625\text{"}$ side margins). |
| **Primary Body Font** | **Times New Roman, 10pt** | Regular weight, single line spacing, justified alignment. |
| **Captions & Footnotes**| **Times New Roman, 8pt** | Italicized figure/table captions placed directly above (tables) or below (figures). |
| **Abstract Limit** | **Maximum 300 words** | Concise single-paragraph summary of problem, methodology, results, and impact. |
| **Keywords Limit** | **Maximum 5 keywords** | Formatted as comma-separated italicized terms following the abstract. |

---

## IEEE Two-Column Formatting Rules

### 1. Document Structure & Sectioning
- **Title**: 24pt Times New Roman, Bold, Centered. Capitalize first letter of major words.
- **Author Block**: 10pt Times New Roman, Centered. Include Author Name, Department, Institution, City, Country, and Email.
- **Abstract & Keywords**: 9pt Times New Roman, Bold heading (`Abstract—`), justified text.
- **Section Headings (Heading 1)**: Roman Numerals (`I. INTRODUCTION`, `II. RELATED WORK`), 10pt Small Caps, Centered.
- **Sub-headings (Heading 2)**: Capital Letters (`A. Technology Stack Analysis`), 10pt Italic, Left-aligned.
- **Sub-subheadings (Heading 3)**: Arabic numerals with parenthesis (`1) Prompt Engineering`), 10pt Italic, Indented.

### 2. Figures, Tables, and Equations
- **Figures**: Centered within the column width. Captions positioned **below** the figure using `Fig. X. Caption text.` in 8pt Times New Roman.
- **Tables**: Centered within the column width. Captions positioned **above** the table using `TABLE I. TABLE TITLE IN SMALL CAPS.` in 8pt Times New Roman.
- **Equations**: Centered on column width with equation numbers aligned flush right in parentheses, e.g., $(1)$.

### 3. Citations & References
- Citations must use standard IEEE bracketed notation sequentially numbered: `[1]`, `[2]`, `[3]–[6]`.
- References section must be formatted in 8pt Times New Roman adhering strictly to IEEE bibliographical standards.

---

## Guidelines for PDF Conversion
When converting the provided Markdown file (`ICACT2026_Research_Paper.md`) to final PDF for submission:
1. Ensure the PDF compiler (e.g., Pandoc with `pdfengine=xelatex`, VS Code IEEE Template, or MS Word) uses **A4 Paper Size**.
2. Verify that all embedded fonts are fully subsetted and embedded in the generated PDF.
3. Confirm that the total PDF page count is exactly **6 pages**.
4. Check that no orphan headings or dangling table lines appear across column boundaries.
