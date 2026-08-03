// frontend/lib/glossary.js
// Pure client-side insurance jargon dictionary for hover/tap tooltips.

export const GLOSSARY = {
  "sum insured": "The maximum amount the insurer will pay — your total coverage ceiling.",
  "sub-limit": "A hidden inner cap: even when covered, this item pays only up to a fixed small amount.",
  "sub-limits": "Hidden inner caps: even when covered, these items pay only up to fixed small amounts.",
  "sub limit": "A hidden inner cap: even when covered, this item pays only up to a fixed small amount.",
  "sub limits": "Hidden inner caps: even when covered, these items pay only up to fixed small amounts.",
  "co-pay": "The % of every claim YOU must pay yourself (20% co-pay = you pay 1/5 of the bill).",
  "copay": "The % of every claim YOU must pay yourself (20% co-pay = you pay 1/5 of the bill).",
  "coinsurance": "The % of every claim YOU must pay yourself, same idea as a co-pay.",
  "deductible": "The fixed amount you must pay first before the insurer pays anything.",
  "deductibles": "Fixed amounts you must pay first before the insurer pays anything.",
  "waiting period": "A time window after buying the policy during which certain claims are NOT paid.",
  "waiting periods": "Time windows after buying the policy during which certain claims are NOT paid.",
  "pre-existing condition": "An illness you already had before the policy started — usually waits 2–4 years.",
  "pre-existing conditions": "Illnesses you already had before the policy started — usually wait 2–4 years.",
  "pre-existing disease": "An illness you already had before the policy started — usually waits 2–4 years.",
  "pre-existing diseases": "Illnesses you already had before the policy started — usually wait 2–4 years.",
  "ped": "Pre-Existing Disease — an illness you had before the policy; claims wait 2–4 years.",
  "room rent": "Daily hospital room cost — capping means the insurer pays only up to a limit (e.g. 1% of sum insured).",
  "room rent capping": "The insurer pays room rent only up to a limit; extra cost (and often proportional ICU/doctor fees) comes from you.",
  "room rent cap": "The limit up to which the insurer pays your hospital room cost.",
  "cashless": "The insurer settles the bill directly with the hospital — you don't pay and claim back.",
  "network hospital": "A hospital tied up with the insurer where cashless treatment works.",
  "network hospitals": "Hospitals tied up with the insurer where cashless treatment works.",
  "day care": "Procedures needing less than 24h hospital stay — covered without full admission.",
  "day-care": "Procedures needing less than 24h hospital stay — covered without full admission.",
  "no-claim bonus": "Reward for claim-free years: your sum insured grows (e.g. +50% over time).",
  "no claim bonus": "Reward for claim-free years: your sum insured grows (e.g. +50% over time).",
  "ncb": "No-Claim Bonus — reward for claim-free years: your sum insured grows.",
  "cumulative bonus": "Extra sum insured that accumulates for every claim-free year.",
  "restoration benefit": "If your sum insured runs out, the insurer refills it once for later claims.",
  "exclusion": "Something the policy will NEVER pay for — read this list first.",
  "exclusions": "Things the policy will NEVER pay for — read this list first.",
  "excluded": "Not payable by the policy, ever.",
  "premium": "The price you pay for the policy (yearly or monthly).",
  "premiums": "The prices you pay for the policy (yearly or monthly).",
  "claim": "Your formal request to the insurer to pay a hospital bill.",
  "claims": "Formal requests to the insurer to pay hospital bills.",
  "denial": "The insurer refusing to pay a claim.",
  "denied": "Refused by the insurer.",
  "eob": "Explanation of Benefits — the letter showing what was paid/denied and why.",
  "grace period": "Extra days after the due date to pay your premium without losing coverage.",
  "free look period": "A cooling-off window (15–30 days) to cancel a new policy for a refund.",
  "portability": "The right to switch insurers without re-serving your waiting periods.",
  "ambulance cover": "Pays (part of) the ambulance cost — often capped per trip.",
  "ayush": "Covers Ayurveda, Yoga, Unani, Siddha and Homeopathy treatment.",
  "opd": "Out-Patient Department: doctor visits without admission — most basic policies don't cover it.",
  "domiciliary": "Treatment taken at home when hospitalisation isn't possible — limited cover.",
  "in-patient": "Treatment with formal hospital admission (24h+) — the core of health insurance.",
  "inpatient": "Treatment with formal hospital admission (24h+) — the core of health insurance.",
  "hospitalization": "Being formally admitted to a hospital (24h+) — triggers most coverage.",
  "hospitalisation": "Being formally admitted to a hospital (24h+) — triggers most coverage.",
  "icu": "Intensive Care Unit — often has its own separate sub-limit.",
  "bariatric surgery": "Weight-loss surgery — commonly excluded in policies.",
  "rider": "An optional add-on cover bought for extra premium.",
  "riders": "Optional add-on covers bought for extra premium.",
  "tpa": "Third-Party Administrator — the company that processes claims between you, hospital and insurer.",
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest terms first so "room rent capping" wins over "room rent".
export function glossaryRegex() {
  const terms = Object.keys(GLOSSARY)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  return new RegExp("\\b(?:" + terms.join("|") + ")\\b", "gi");
}