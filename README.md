# Claim Companion

**Claim Companion** is a guided Small Claims Tribunals (SCT) preparation assistant for self-represented persons in Singapore.

It is designed to help users organise their claim information, understand SCT terminology and procedures, identify possible eligibility issues, challenge their own assumptions, and prepare a structured summary before filing.

> **Important:** Claim Companion provides procedural guidance and information only. It does not provide legal advice, predict case outcomes, or replace official Singapore Courts information or professional legal advice.

---

## Problem

Self-represented persons increasingly use publicly available generative AI tools to understand legal processes.

Generic AI tools can create several risks:

- hallucinated legal information
- overconfident answers
- reinforcement of a claimant's existing assumptions
- incomplete or poorly organised claims
- confusion between procedural guidance and legal advice

Claim Companion is designed to reduce these risks by separating deterministic rules, grounded procedural information, and narrowly scoped AI assistance.

---

## Core Features

### 1. Guided claim preparation

The user is guided through a structured intake rather than being asked to describe the entire dispute in an unrestricted chatbot.

The intake collects information such as:

- claim type
- respondent/service location
- line-item claim amounts
- Memorandum of Consent where relevant
- relevant dates
- desired outcome
- contract value where relevant
- timeline
- available evidence
- previous attempts to resolve the dispute

Answers are preserved when the user moves backwards and forwards.

---

### 2. Deterministic SCT eligibility checker

Hard eligibility screening is performed **client-side using deterministic JavaScript rules**, not by the language model.

The checker can flag issues involving:

- standard SGD 20,000 claim limit
- SGD 20,001–30,000 extended limit and Memorandum of Consent
- amounts above SGD 30,000
- general SCT 2-year filing period
- special CPFTA unfair-practice time-limit considerations
- respondent/service location
- employment disputes
- neighbour disputes
- motor-vehicle property damage
- motor-vehicle dealer deposit refunds
- contract-value screening for rescission and progress-payment claims

Possible statuses are:

- `ok`
- `attention`
- `likely_out_of_scope`

The checker is **advisory and non-blocking**. A warning never disables the user's ability to continue.

Every deterministic rule shown to the user includes a fixed source link to the relevant authoritative material.

---

### 3. Fact discrepancy detection

Before the final summary, Claim Companion checks for obvious factual inconsistencies.

For example:

> Claim amount entered: SGD 1,000  
> Narrative says: SGD 2,000

The Challenge stage can flag this immediately and ask the claimant to reconcile the figures against their evidence.

The deterministic discrepancy detector focuses on explicit money amounts written with `$`, `S$` or `SGD` to reduce false positives from years, quantities or model numbers.

---

### 4. Counter-perspective / confirmation-bias challenge

Claim Companion deliberately does **not** automatically take the claimant's side.

The AI Challenge stage asks the user to consider:

1. a possible respondent argument
2. a critical evidence gap
3. a hard but neutral Tribunal question

The user can optionally request up to two additional follow-up stress-test rounds based on their answers.

The user can also select **Skip / Proceed to Summary** at any time.

The model is instructed not to:

- decide who is right
- predict who will win
- invent evidence
- invent the respondent's position
- provide legal strategy
- recommend arguments

---

### 5. Evidence Preparation Readiness

The final screen includes a deterministic **Evidence Preparation Readiness** score.

Colour bands:

- **0–40:** Red — Needs substantial preparation
- **41–70:** Yellow — Needs some work
- **71–99:** Green — Well prepared
- **100:** Green — Perfect

The score measures organisation and evidentiary preparation only.

It **does not represent the probability of winning the claim**.

---

### 6. AI Helpdesk

A small floating AI Helpdesk remains visible while the user uses the application.

Its scope is deliberately limited to:

- explaining legal terminology in plain English
- explaining SCT procedures
- explaining filing rules contained in the tool's reference material

Examples:

- "What is jurisdiction?"
- "What is CJTS?"
- "What is a Memorandum of Consent?"
- "How much are the filing fees?"
- "Can I bring a lawyer?"
- "What is Lemon Law?"

The chat input supports:

- **Enter** — send
- **Shift + Enter** — new line / new paragraph

---

## No-Legal-Advice Guardrail

The AI Helpdesk is not a general legal chatbot.

Questions such as:

- "Will I win?"
- "Is my case strong?"
- "What should I argue?"
- "What should I say to convince the Magistrate?"

are rejected.

There are two guardrail layers:

1. **client-side deterministic pre-check** for obvious merits/strategy questions
2. **AI system prompt guardrail** for broader or less obvious requests for legal advice

This prevents obvious legal-advice requests from being sent to the model at all.

---

## Grounding and Hallucination Controls

Claim Companion does not ask the model to freely recall Singapore SCT procedure from general training knowledge.

Instead:

- deterministic eligibility rules use fixed logic
- procedural information is supplied through embedded reference material
- chatbot answers return a controlled `source_key`
- the browser maps the `source_key` to a fixed URL
- the AI is not allowed to invent URLs
- unsupported questions are redirected to authoritative sources
- no synthetic case precedents are generated

This creates a separation between:

**user-provided facts → deterministic legal-process checks → constrained AI explanation**

---

## Key Reference Material

The prototype was designed using selected material from:

- Singapore Courts — Cases eligible for a small claim
- Singapore Courts — How to file and serve a small claim
- Singapore Courts — Small Claims Tribunals information
- Small Claims Tribunals Act 1984
- Consumer Protection (Fair Trading) Act 2003
- State Courts — Orders of the Small Claims Tribunals
- Courts' Guide on the Use of Generative AI Tools by Court Users

Important information should still be independently verified against current official sources before filing.

---

## Responsible AI Design

Claim Companion applies the following principles:

- AI does not decide SCT jurisdiction
- deterministic rules handle identifiable SCT boundaries
- the tool distinguishes user-provided facts from procedural information
- the model is instructed not to invent facts or evidence
- the Challenge stage deliberately tests the claimant's assumptions
- legal-advice and merits questions are restricted
- important procedural information is linked to authoritative sources
- an offline/static fallback is available for recognised terminology if the AI service is unavailable
- users are reminded to independently verify important information

---

## Technical Architecture

```text
User
  |
  v
Structured Intake
  |
  v
Deterministic SCT Rules
  |
  +----> Source-linked eligibility notes
  |
  v
Fact Discrepancy Detection
  |
  v
Counter-Perspective AI
  |
  v
Evidence Preparation Readiness
  |
  v
Structured Preparation Summary


Floating AI Helpdesk
  |
  v
Client-side no-legal-advice pre-check
  |
  v
/api/claude
  |
  v
OpenRouter / Claude
  |
  v
Grounded answer + controlled source key
```

---

## Technology

- HTML
- CSS
- JavaScript
- Vercel
- Serverless API route
- OpenRouter
- Anthropic Claude
- GitHub

The API key is stored as a Vercel environment variable and is **not exposed to the browser**.

Environment variable:

```text
OPENROUTER_API_KEY
```

Do not place the API key directly inside `index.html` or commit it to GitHub.

---

## Repository Structure

```text
claim-companion/
├── index.html
├── api/
│   └── claude.js
├── README.md
├── .gitignore
└── .gitattributes
```

---

## Running the Project

The deployed application is intended to run through Vercel because AI requests are sent through the serverless `/api/claude` route.

### Development / deployment

1. Clone the GitHub repository.
2. Configure the `OPENROUTER_API_KEY` environment variable.
3. Deploy the repository to Vercel.
4. Open the deployed application.
5. Complete the guided SCT preparation flow or use the floating AI Helpdesk.

---

## Example User Flow

```text
Start
  ↓
Consent / disclaimer
  ↓
Claim category
  ↓
Respondent/service information
  ↓
Claim line items
  ↓
Conditional SCT checks
  ↓
Timeline and evidence
  ↓
Fact discrepancy check
  ↓
Counter-perspective stress test
  ↓
Evidence Preparation Readiness
  ↓
Structured summary
  ↓
Download / Print
```

---

## Output

The final preparation screen can include:

- preliminary eligibility notes
- claim summary
- claimant's timeline
- evidence listed
- counter-perspective challenges
- factual inconsistencies
- unsupported assertions
- Evidence Preparation Readiness
- next-step checklist
- source-linked procedural information
- Responsible AI Record

Users can:

- download a text preparation summary
- print / save the summary as PDF

The output is a **preparation aid**, not an official CJTS form and not a Court-certified document.

---

## Known Limitations

Claim Companion is a hackathon prototype.

It does not:

- determine legal rights
- determine whether a claim will succeed
- determine the legally correct cause-of-action date
- determine which legal remedy a claimant should pursue
- replace the official CJTS pre-filing assessment
- replace current Singapore Courts information
- replace professional legal advice
- automatically submit a claim to CJTS

The embedded legal reference material may also become outdated and should be maintained against authoritative sources.

---

## AI-Assisted Development Disclosure

Generative AI / AI-assisted coding tools were used during the design and development of this prototype.

AI assistance was used for activities including:

- interface prototyping
- JavaScript implementation support
- debugging
- wording refinement
- prompt design
- test scenario generation
- source-grounding review

The team reviewed, tested and iteratively refined the generated code and design.

The team should be prepared to explain the application architecture, deterministic rules, AI components, safety controls and implementation choices during judging.

---

## Hackathon

Developed for the **SMU LIT Legal-Tech Hackathon 2026**.

Problem focus:

> Helping self-represented persons use generative AI effectively and responsibly during Small Claims Tribunals pre-filing and case preparation.
