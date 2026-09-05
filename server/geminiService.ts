import { GoogleGenAI } from '@google/genai';
import {
  CandidateStrategy,
  CustomerContext,
  FailureDiagnosis,
  GuardrailCheckResult,
  RecoveryAction,
  TransactionRecord,
} from './types.js';

let aiClient: GoogleGenAI | null = null;
const explanationCache = new Map<string, any>();

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      aiClient = null;
    }
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

async function callGeminiWithResilience(
  genAI: GoogleGenAI,
  prompt: string
): Promise<string | null> {
  for (const modelName of CANDIDATE_MODELS) {
    // Attempt up to 2 times per candidate model with exponential backoff on transient spikes
    const maxAttempts = 2;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await genAI.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text ? response.text.trim() : '';
        if (text) {
          return text;
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        const isTransient =
          errorMsg.includes('503') ||
          errorMsg.includes('UNAVAILABLE') ||
          errorMsg.includes('high demand') ||
          errorMsg.includes('429') ||
          errorMsg.includes('ResourceExhausted');

        if (isTransient && attempt < maxAttempts - 1) {
          // Exponential backoff: 400ms for attempt 0, 800ms for attempt 1
          const backoffDelay = Math.pow(2, attempt) * 400;
          await new Promise((r) => setTimeout(r, backoffDelay));
          continue;
        }

        // On non-transient error or exhausted retry attempts for this model, cascade to next candidate model
        break;
      }
    }
  }

  return null;
}

export async function generateAiExplanation(
  tx: TransactionRecord,
  context: CustomerContext,
  diagnosis: FailureDiagnosis,
  strategies: CandidateStrategy[],
  recommended: RecoveryAction,
  guardrails: GuardrailCheckResult[]
): Promise<{
  summary: string;
  whyRecommended: string;
  whyAlternativesRejected: string;
  customerCommunicationDraft?: {
    channel: 'WHATSAPP' | 'EMAIL';
    message: string;
    subject?: string;
  };
  isAiGenerated: boolean;
}> {
  const cacheKey = `${tx.transactionId}_${recommended}_${diagnosis.failureCode}`;
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey);
  }

  const genAI = getGenAI();

  // Find candidate strategy details
  const recStrat = strategies.find((s) => s.action === recommended);
  const rejectedStrats = strategies.filter((s) => s.action !== recommended);

  // If Gemini is available, attempt call with multi-model resilience
  if (genAI) {
    try {
      const prompt = `
You are the explanation and customer communication engine for RecoverAI, an Indian fintech revenue recovery decision system.
The financial calculations, probabilities, and guardrails have ALREADY been deterministically computed by our risk engine.
DO NOT recalculate numbers, alter probabilities, or override guardrails.

TRANSACTION & CONTEXT:
- Amount: ₹${tx.amount.toLocaleString('en-IN')}
- Failure: ${diagnosis.failureCode} (${diagnosis.description}, Category: ${diagnosis.category})
- Customer Name: ${context.customerName}
- Previous Successes: ${context.previousSuccesses}, Failures: ${context.previousFailures} (Success Rate: ${Math.round(context.successRate * 100)}%)
- Attempt Count: ${tx.attemptCount}
- Customer Opt-out: ${tx.customerOptOut}
- Fraud Risk Score: ${tx.fraudScore.toFixed(2)}
- Channel Preference: ${context.preferredChannel}

ENGINE DECISION:
- Recommended Action: ${recommended}
- Strategy Expected Net Recovery: ₹${recStrat?.netExpectedValue || 0}
- Recovery Probability: ${Math.round((recStrat?.recoveryProbability || 0) * 100)}%
- Guardrails Status: ${guardrails.map((g) => `${g.ruleId} (${g.status})`).join(', ')}

ALTERNATIVES & REJECTION REASONS:
${rejectedStrats.map((s) => `- ${s.action}: ${s.rejectionReason || 'Lower net expected return or higher customer friction'}`).join('\n')}

TASK:
Provide a concise, executive-ready explanation in JSON format with exactly these keys:
{
  "summary": "1-2 sentences summarizing the situation and the recommended stance.",
  "whyRecommended": "Clear business rationale why this exact intervention was chosen (referencing failure taxonomy and customer history).",
  "whyAlternativesRejected": "Brief synthesis of why other candidate options (like immediate retry or notifications) were deemed sub-optimal or dangerous.",
  "customerCommunicationDraft": {
    "channel": "WHATSAPP" or "EMAIL",
    "message": "Friendly, polite, compliant Indian payment assistance message with placeholder [UPI Pay Link] or [Update Payment Method Link]. Do NOT sound accusatory. If NO_ACTION or HUMAN_REVIEW, provide a courteous internal ops note.",
    "subject": "Payment status update for your subscription (only for EMAIL)"
  }
}
Return ONLY pure JSON. No markdown fences.
`;

      const responseText = await callGeminiWithResilience(genAI, prompt);

      if (responseText) {
        const cleanJson = responseText.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanJson);

        const result = {
          summary: parsed.summary || buildFallbackExplanation(tx, context, diagnosis, recommended, recStrat).summary,
          whyRecommended: parsed.whyRecommended || buildFallbackExplanation(tx, context, diagnosis, recommended, recStrat).whyRecommended,
          whyAlternativesRejected: parsed.whyAlternativesRejected || buildFallbackExplanation(tx, context, diagnosis, recommended, recStrat).whyAlternativesRejected,
          customerCommunicationDraft: parsed.customerCommunicationDraft || buildFallbackExplanation(tx, context, diagnosis, recommended, recStrat).customerCommunicationDraft,
          isAiGenerated: true,
        };

        explanationCache.set(cacheKey, result);
        return result;
      }
    } catch {
      // Deterministic fallback engaged seamlessly
    }
  }

  // Deterministic Fallback
  const fallback = buildFallbackExplanation(tx, context, diagnosis, recommended, recStrat);
  explanationCache.set(cacheKey, fallback);
  return fallback;
}

export function buildFallbackExplanation(
  tx: TransactionRecord,
  context: CustomerContext,
  diagnosis: FailureDiagnosis,
  recommended: RecoveryAction,
  recStrat?: CandidateStrategy
): {
  summary: string;
  whyRecommended: string;
  whyAlternativesRejected: string;
  customerCommunicationDraft?: {
    channel: 'WHATSAPP' | 'EMAIL';
    message: string;
    subject?: string;
  };
  isAiGenerated: boolean;
} {
  const probPercent = Math.round((recStrat?.recoveryProbability || 0) * 100);
  const netRecovery = recStrat?.expectedRecoveredRevenue || 0;

  let summary = '';
  let whyRecommended = '';
  let whyAlternativesRejected = '';

  switch (recommended) {
    case 'RETRY_LATER':
      summary = `The ${diagnosis.failureCode} failure is transient (bank or switch congestion). Postponing retry preserves customer trust and clears switch throttling.`;
      whyRecommended = `A delayed retry in ${diagnosis.recommendedWaitMinutes} minutes yields a ${probPercent}% expected recovery rate (₹${netRecovery.toLocaleString('en-IN')}) with zero customer friction and ₹0 cost.`;
      whyAlternativesRejected = `Immediate retry was rejected because repeating during bank downtime causes cascading failures; notifications were deferred as customer intervention is not yet required.`;
      break;

    case 'WHATSAPP':
      summary = `Customer action is needed for ${diagnosis.failureCode}. WhatsApp is their preferred channel with high mobile engagement.`;
      whyRecommended = `Direct WhatsApp messaging with an instant UPI intent link delivers a ${probPercent}% recovery rate, resolving payment without support overhead.`;
      whyAlternativesRejected = `Automated retries were rejected because ${diagnosis.description} requires the payer to add funds or authorize the app; email has lower conversion.`;
      break;

    case 'ALTERNATIVE_PAYMENT_METHOD':
      summary = `The current payment instrument (${tx.paymentMethod}) failed permanently or suffered multiple declines (${diagnosis.failureCode}).`;
      whyRecommended = `Offering an alternative payment method (such as UPI or NetBanking) provides an expected recovery probability of ${probPercent}%.`;
      whyAlternativesRejected = `Retrying the existing ${tx.paymentMethod} would repeatedly fail against bank rules; human review would be disproportionately expensive.`;
      break;

    case 'HUMAN_REVIEW':
      summary = `Transaction of ₹${tx.amount.toLocaleString('en-IN')} flagged for high-value VIP ops oversight.`;
      whyRecommended = `Manual verification prevents unwanted customer churn and ensures proper mandate alignment for key accounts.`;
      whyAlternativesRejected = `Automated retries and generic notifications were blocked to protect enterprise relationship integrity.`;
      break;

    case 'NO_ACTION':
      summary = `Recovery halted or skipped under safety policies (e.g. opt-out, cancellation, or low net expected return).`;
      whyRecommended = `Strategic inaction avoids wasting merchant intervention budget and prevents customer annoyance when recovery likelihood is negligible.`;
      whyAlternativesRejected = `All active interventions (messaging and retries) fail guardrail checks or produce negative net margin.`;
      break;

    default:
      summary = `Engine selected ${recommended} based on constrained expected value optimization.`;
      whyRecommended = `Highest net expected value across all eligible strategies (${probPercent}% recovery probability).`;
      whyAlternativesRejected = `Competing strategies exhibited either lower expected recovery or higher operational friction.`;
  }

  const customerCommunicationDraft = {
    channel: (context.preferredChannel === 'EMAIL' ? 'EMAIL' : 'WHATSAPP') as 'WHATSAPP' | 'EMAIL',
    subject: `Payment update for your ₹${tx.amount.toLocaleString('en-IN')} transaction`,
    message:
      context.preferredChannel === 'EMAIL'
        ? `Hi ${context.customerName},\n\nWe noticed your recent payment of ₹${tx.amount.toLocaleString('en-IN')} could not be completed (${diagnosis.description}).\n\nPlease click below to complete your payment or switch payment methods:\nhttps://pay.example.in/retry/${tx.transactionId}\n\nWarm regards,\nPayments Team`
        : `Hi ${context.customerName}, we noticed your ₹${tx.amount.toLocaleString('en-IN')} payment experienced a temporary issue (${diagnosis.description}). Tap below to retry via UPI or Card in 1-tap: https://pay.example.in/u/${tx.transactionId}`,
  };

  return {
    summary,
    whyRecommended,
    whyAlternativesRejected,
    customerCommunicationDraft,
    isAiGenerated: false,
  };
}
