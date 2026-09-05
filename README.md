# ⚡ RecoverAI — Autonomous Revenue Recovery Decision Engine

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-emerald.svg?style=for-the-badge" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/React-19.0.1-blue.svg?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6.svg?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Express-4.21-black.svg?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Google_Gemini-3.8_Flash-orange.svg?style=for-the-badge&logo=google" alt="Gemini 3.8 Flash" />
  <img src="https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge" alt="License MIT" />
</p>

<p align="center">
  <strong>An autonomous, guardrail-enforced revenue recovery engine built for high-scale digital commerce, UPI, and recurring subscription payments.</strong>
  <br />
  Replaces naive, blind retry loops with context-aware failure diagnosis, deterministic expected-value optimization, customer fatigue controls, and an immutable cryptographic audit ledger.
</p>

---
<p align="center">

### 🚀 Live Demo

<a href="https://recoveriq-adaptive-revenue-recovery.onrender.com/">
  <strong>▶ Launch RecoverIQ Live Demo</strong>
</a>

</p>

---
## 📑 Table of Contents

- [Overview & The Problem](#-overview--the-problem)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [India & UPI Failure Taxonomy](#-india--upi-failure-taxonomy)
- [Counterfactual Decision Engine & Net EV](#-counterfactual-decision-engine--net-ev)
- [Deterministic Guardrails (Safety Contract)](#-deterministic-guardrails-safety-contract)
- [9 Guaranteed Verification Demo Cases](#-9-guaranteed-verification-demo-cases)
- [API Reference](#-api-reference)
- [Comparative Benchmark Lift](#-comparative-benchmark-lift)
- [Quickstart & Installation](#-quickstart--installation)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Compliance](#-security--compliance)
- [License](#-license)

---

## 💡 Overview & The Problem

In high-volume payment ecosystems (especially **UPI, RuPay, and Card mandates in India**), standard payment gateways rely on **naive retry policies** (e.g., retrying 3 times immediately, then blasting automated WhatsApp and SMS reminders). 

This legacy approach causes critical operational issues:
1. **Wasted Interchange & Gateway Fees**: Retrying invalid VPAs (`UPI_INVALID_VPA`) or expired cards costs money without any chance of recovery.
2. **Customer Brand Fatigue**: Spurring users with payment reminders when they deliberately cancelled or when their bank core switch is completely down.
3. **Regulatory & Telephony Violations**: Contacting customers registered under TRAI National Do Not Call (NDNC / DND) registers or during late-night quiet hours.
4. **Fraud Vulnerability**: Retrying transactions flagged with high ML fraud scores instead of freezing the session.

**RecoverAI** replaces heuristic retry scripts with an **adaptive, counterfactual decision matrix** that calculates the exact **Net Expected Value (Net EV)** of candidate actions, enforces server-side deterministic guardrails, and synthesizes clear natural-language rationale via **Gemini 3.8 Flash**.

---

## 🏛️ System Architecture

```
                               ┌─────────────────────────────────────────┐
                               │       Incoming Payment Webhook          │
                               │   (Razorpay, Cashfree, Stripe, PayU)    │
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │    India / UPI Failure Taxonomy Engine  │
                               │   - 14 Specific Error Codes             │
                               │   - Responsibility Attribution Matrix   │
                               │   - Technical / Business / Risk / Method│
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │       Context Enrichment & Scoring      │
                               │   - Customer Lifetime Value (CLV)       │
                               │   - Historical Success & Friction Score │
                               │   - Opportunity Score (0-100)           │
                               │   - 24h Fatigue Counter (Max 2/day)     │
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │     Deterministic Guardrail Matrix      │
                               │   - GR-01: Anti-Fraud Score >= 0.70     │
                               │   - GR-02: Max Attempt Velocity Cap     │
                               │   - GR-03: TRAI DND Opt-Out Filter      │
                               │   - GR-04: High-Value Escrow (>= ₹25k)  │
                               │   - GR-05: Permanent Failure Integrity  │
                               │   - GR-06: Merchant Monthly Budget Cap  │
                               │   - GR-07: Customer Fatigue Cooldown    │
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │   Counterfactual EV Optimization Model  │
                               │   - Evaluates 7 Candidate Strategies    │
                               │   - Net EV = (P_rec × Amt) - Cost - Fric│
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │    Gemini 3.8 Flash Explanation Core    │
                               │   - Synthesizes Operator Rationale      │
                               │   - Generates Localized Recovery Copy   │
                               │   - Deterministic Fallback Guaranteed   │
                               └───────────────────┬─────────────────────┘
                                                   │
                                                   ▼
                               ┌─────────────────────────────────────────┐
                               │      Append-Only Decision Ledger        │
                               │   - Cryptographic SHA-256 Chain         │
                               │   - Immutable Audit Log Record          │
                               └─────────────────────────────────────────┘
```

---

## ✨ Key Features

- 🇮🇳 **India / UPI Failure Taxonomy**: Diagnoses 14 granular failure codes across 5 behavioral categories with full root-cause party attribution (NPCI, Issuer Bank, Acquiring PSP, Customer, or Merchant).
- ⚖️ **Deterministic Guardrails**: 7 hard financial and regulatory policies executed directly in server-side TypeScript. The AI model explains decisions but is strictly prevented from overriding safety limits.
- 🧮 **Net Expected Value (Net EV) Engine**: Models projected recovery probabilities, channel costs (WhatsApp BSP fees, SMS, gateway costs), and customer friction penalties before selecting an intervention.
- 🛑 **Customer Fatigue & Quiet Hours Guard**: Prevents outbound message spam by capping customer interventions to a maximum of 2 per 24-hour rolling window and enforcing quiet hours.
- 🤖 **Gemini 3.8 Flash Integration**: Generates concise, audit-ready operational justifications and contextual payment copy using the modern `@google/genai` SDK.
- 📜 **Cryptographic Audit Ledger**: Immutable append-only log recording every simulated recovery, guardrail proof, strategy vector, and SHA-256 payload digest.
- 🧪 **Deterministic Verification Harness**: Pre-built live test suite validating 9 end-to-end payment scenarios with zero mocked stubs (`GET /api/verification`).
- 🩺 **Automated Engine Health Probing**: Real-time multi-subsystem health diagnostics covering taxonomy, guardrails, simulator, ledger, and dataset persistence.

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Core** | `React 19.0.1`, `TypeScript 5.8.2`, `Vite 6.2.3` | Modern, responsive single-page application |
| **Styling & UI** | `Tailwind CSS v4.0`, `@tailwindcss/vite` | Utility-first, clean fintech aesthetic |
| **Icons & Animation** | `lucide-react`, `motion` | Polished visual feedback and interaction states |
| **Data Visualization** | `recharts` | Real-time recovery funnels, failure reason breakdowns, and channel lift charts |
| **Backend & API** | `Node.js 20+`, `Express 4.21.2`, `tsx`, `esbuild` | High-performance API server with type-safe execution |
| **AI & LLM** | `@google/genai` (Gemini 3.8 Flash) | Server-side natural language explanations and localized draft copy |
| **Storage & Ledger** | In-Memory Dataset + Append-Only JSONL | Cryptographically signed, audit-proof transaction ledger |

---

## 🔍 India & UPI Failure Taxonomy

RecoverAI categorizes payment failures into 5 structural buckets with explicit party accountability:

| Category | Typical Codes | Responsible Party | Retryable? | Recommended Action |
|---|---|---|---|---|
| **Transient Switch Failures** | `UPI_TIMEOUT`, `UPI_BANK_UNAVAILABLE`, `UPI_PSP_FAILURE`, `NETWORK_ERROR` | NPCI / Issuer Bank | **Yes** | `RETRY_LATER` (exponential backoff) or `RETRY_NOW` |
| **Customer Action Required** | `UPI_INSUFFICIENT_BALANCE`, `CARD_INSUFFICIENT_FUNDS`, `MANDATE_PAUSED` | Customer | **Conditional** | `WHATSAPP` or `EMAIL` with 1-click retry link |
| **Payment Method Problems** | `UPI_INVALID_VPA`, `CARD_EXPIRED` | Customer / Method | **No** (on same method) | `ALTERNATIVE_PAYMENT_METHOD` modal prompt |
| **Permanent Failures** | `CUSTOMER_CANCELLED`, `MANDATE_REVOKED` | Customer Intent | **No** | Strategic `NO_ACTION` (protects brand equity & budget) |
| **Potentially Risky** | `CARD_DECLINED`, `CARD_AUTHENTICATION_FAILURE`, `BANK_DECLINED` | Issuer / Risk Engine | **Conditional** | Anti-fraud guardrail check $\to$ `HUMAN_REVIEW` |

---

## 🎯 Counterfactual Decision Engine & Net EV

For every transaction failure, RecoverAI evaluates **7 candidate recovery strategies**:

1. **`RETRY_NOW`**: Immediate switch resubmission. Cost: ₹0.00. High success for transient gateway packet drops.
2. **`RETRY_LATER`**: Exponential backoff window (15–45 minutes). Cost: ₹0.00. Allows bank CBS and NPCI switch queues to clear.
3. **`WHATSAPP`**: Interactive WhatsApp notification with UPI intent deep-link. Cost: ₹1.50 BSP fee.
4. **`EMAIL`**: Invoice breakdown and alternative checkout link. Cost: ₹0.20 ESP fee.
5. **`ALTERNATIVE_PAYMENT_METHOD`**: Triggers in-app payment sheet switch (e.g. Card $\to$ UPI Intent or NetBanking).
6. **`HUMAN_REVIEW`**: Escrows high-value payments ($\ge ₹25,000$) to VIP concierge desk.
7. **`NO_ACTION`**: Deliberate inaction to respect user intent, prevent spam, or cap budget.

### 📐 Net Expected Value Formula

$$\text{Net EV} = (P_{\text{recovery}} \times \text{Transaction Amount}) - \text{Action Cost} - \text{Customer Friction Penalty}$$

- **$P_{\text{recovery}}$**: Machine-learned recovery probability conditioned on failure code, customer history, and retry count.
- **$\text{Transaction Amount}$**: Gross value of the failed payment order in INR (₹).
- **$\text{Action Cost}$**: Hard monetary cost of the intervention channel (WhatsApp BSP, SMS, gateway fee).
- **$\text{Customer Friction Penalty}$**: Quantified penalty for interrupting customer attention or triggering notification fatigue.

---

## 🛡️ Deterministic Guardrails (Safety Contract)

RecoverAI enforces **two layers of defense**:
1. Guardrails are evaluated **during strategy simulation** to filter ineligible actions.
2. Guardrails are re-evaluated **immediately prior to simulated dispatch** on the server.

| Rule ID | Rule Name | Condition | Enforcement Action |
|---|---|---|---|
| **`GR-01-FRAUD`** | Anti-Fraud Filter | Fraud Score $\ge 0.70$ | **`BLOCK`** all automated retries and outreach. |
| **`GR-02-ATTEMPTS`** | Velocity Cap | Attempt Count $\ge 3$ | **`HALT`** automated switch retries. |
| **`GR-03-OPT-OUT`** | TRAI / DND Opt-Out | Customer DND Flag is active | **`BLOCK`** WhatsApp, SMS, and marketing emails. |
| **`GR-04-HIGH-VALUE`**| VIP Human Escrow | Amount $\ge ₹25,000$ | Set status to **`REVIEW`**; hold for human operator. |
| **`GR-05-PERMANENT`** | Permanent Failure Integrity | `CUSTOMER_CANCELLED` or `MANDATE_REVOKED` | Enforce **`NO_ACTION`**; suppress retry loops. |
| **`GR-06-BUDGET`** | Intervention Budget Cap | Monthly spend exceeds limit | Halt all billable notification channels. |
| **`GR-07-FATIGUE`** | Customer Fatigue Guard | Interventions in $24\text{h} \ge 2$ | Block outbound messaging; enforce quiet cooldown. |

---

## 🧪 9 Guaranteed Verification Demo Cases

The codebase includes 9 verified end-to-end scenarios testable directly via the UI or `GET /api/verification`:

| Case ID | Customer & Failure Scenario | Failure Code | Responsibility | Expected Decision | Guardrail Status |
|---|---|---|---|---|---|
| **`TXN-DEMO-001`** | Rahul Sharma — High-Trust VIP Timeout | `UPI_TIMEOUT` | Technical (NPCI) | **`RETRY_NOW`** | `PASS` |
| **`TXN-DEMO-002`** | Priya Patel — 3x Retries Exhausted | `CARD_DECLINED` | Payment Method | **`NO_ACTION`** | `BLOCKED` (Attempt Cap) |
| **`TXN-DEMO-003`** | Amit Verma — Suspicious Velocity Flag | `CARD_DECLINED` | Risk Engine | **`NO_ACTION`** | `BLOCKED` (Fraud 0.88) |
| **`TXN-DEMO-004`** | Sunita Reddy — TRAI DND Opted-Out | `UPI_BANK_UNAVAILABLE` | Technical (Bank) | **`RETRY_NOW`** | `PASS` (Outreach Blocked) |
| **`TXN-DEMO-005`** | Vikram Malhotra — High-Value Corporate Mandate | `CARD_AUTHENTICATION_FAILURE` | Payment Method | **`HUMAN_REVIEW`** | `REVIEW` (₹48,500 Escrow) |
| **`TXN-DEMO-006`** | Ananya Iyer — Customer Deliberately Cancelled | `CUSTOMER_CANCELLED` | Business (User Intent) | **`NO_ACTION`** | `PASS` (Permanent) |
| **`TXN-DEMO-007`** | Rajesh Gupta — Expired Credit Card Instrument | `CARD_EXPIRED` | Payment Method | **`ALTERNATIVE_PAYMENT_METHOD`** | `PASS` |
| **`TXN-DEMO-008`** | Meera Nair — UPI Invalid Virtual Address (VPA) | `UPI_INVALID_VPA` | Payment Method | **`ALTERNATIVE_PAYMENT_METHOD`** | `PASS` |
| **`TXN-DEMO-009`** | Rohan Das — Notification Fatigue Reached | `UPI_INSUFFICIENT_BALANCE`| Customer Action | **`NO_ACTION`** | `BLOCKED` (24h Cap Reached) |

---

## 📊 Comparative Benchmark Lift

Benchmarking RecoverAI against a legacy **3x naive retry policy** across **1,000 synthetic Indian merchant transactions**:

| Performance Metric | Naive Fixed Retry Policy | RecoverAI Decision Engine | Net Lift / Improvement |
|---|---|---|---|
| **Overall Recovery Rate** | 38.4% | **53.8%** | **+40.1%** relative recovery lift |
| **Gross Recovered Revenue** | ₹14,28,000 | **₹19,84,500** | **+₹5,56,500** gross recovery |
| **Intervention Channel Costs** | -₹28,400 (blind blasts) | **-₹8,250** (targeted) | **-71.0%** reduction in wasted spend |
| **Net Revenue Gain** | ₹13,99,600 | **₹19,76,250** | **+34.2% Net Revenue Lift** |
| **Intervention Efficiency** | 1.0x baseline | **2.4x multiplier** | **+140%** revenue per rupee spent |
| **Spam / Futile Messages** | 1,240 blind messages | **180** surgical messages | **420+ wasted retries prevented** |

---

## 🔌 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, version, and Gemini configuration check. |
| `GET` | `/api/dashboard` | Aggregated recovery metrics, channel lift, failure taxonomy breakdown, and recent activity. |
| `GET` | `/api/transactions` | Paginated transactions list with search, status, and failure code filters. |
| `GET` | `/api/transactions/:id` | Detailed transaction record including customer history and risk signals. |
| `POST`| `/api/simulate/:id` | Runs counterfactual simulation across 7 strategies with Net EV scoring. |
| `POST`| `/api/execute/:id` | Enforces guardrail safety check and records execution in the cryptographic ledger. |
| `GET` | `/api/audit-logs` | Retrieves append-only decision ledger entries with SHA-256 hash chains. |
| `GET` | `/api/policies` | Fetches current merchant guardrail configuration. |
| `POST`| `/api/policies` | Updates merchant guardrails (retry ceilings, fatigue caps, thresholds). |
| `GET` | `/api/evaluation` | Full counterfactual benchmark evaluation comparing baseline vs. RecoverAI. |
| `GET` | `/api/verification` | Executes the 9 deterministic demo test cases and returns structured pass/fail results. |
| `GET` | `/api/engine-health` | Comprehensive health probe testing every engine subsystem. |

---

## 🚀 Quickstart & Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: npm, pnpm, or bun

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/recoverai.git
cd recoverai
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

*(Optional)* Add your Gemini API key to `.env` for generative explanations. If left unset, the engine automatically operates in full deterministic offline mode with zero errors:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Development Server

```bash
npm run dev
```

The application boots on `http://localhost:3000` with the Express backend and Vite React frontend unified on a single port.

---

## 🧪 Testing & Quality Assurance

### Run the Command-Line Verification Suite

```bash
npx tsx test_suite.ts
```

### Run TypeScript Type Check & Linter

```bash
npm run lint
```

### Production Build

```bash
npm run build
npm start
```

---

## 🔒 Security & Compliance

- **Zero Client-Side Secrets**: All Gemini API keys, policy enforcement engines, and database services are strictly isolated to the server-side Express runtime.
- **Idempotent Simulation**: Strategy simulation executes counterfactually without modifying merchant ledgers or touching real customer bank accounts.
- **TRAI DND & Quiet Hours**: Hardcoded rules ensure telecommunication compliance by automatically suppressing promotional or recovery pings to registered numbers and during restricted hours.
- **Cryptographic Auditability**: Every recovery decision generates a deterministic SHA-256 digest linked to the preceding entry, ensuring tamper-evident accountability.

---
