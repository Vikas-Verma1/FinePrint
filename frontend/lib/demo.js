export const DEMO = {
  patient: {
    name: "Arjun Mehta",
    chips: ["Age 34", "Type 2 Diabetes · since 2019", "Hypertension", "BMI 31", "3 medications", "Policy: SecureHealth Gold · $118/mo"],
  },
  score: 46,
  verdicts: [
    { v: "conditional", verdict: "Conditional", clause: "§4.2 — Pre-existing disease waiting period: 36 months (p.7)", record: "Type 2 Diabetes, diagnosed 2019",
      why: "Any diabetes-related hospitalization is refused during the first 36 continuous months of the policy. Arjun was diagnosed 7 years ago — but the clock restarts at policy inception. Years 1–3 diabetes claims: denied." },
    { v: "capped", verdict: "Capped", clause: "§7.1 — Cardiac sub-limit: $5,000 per year (p.12)", record: "Hypertension + BMI 31",
      why: "All cardiac procedures capped at $5,000/year. An average bypass costs $12,000+ — Arjun pays the difference. His hypertension and BMI put him at ~2.4× baseline cardiac risk." },
    { v: "excluded", verdict: "Excluded", clause: "§9.3(k) — Exclusion: bariatric surgery (p.15)", record: "BMI 31",
      why: "Weight-loss surgery is excluded under all circumstances, including medically necessary cases with BMI > 30." },
    { v: "covered", verdict: "Covered", clause: "§5.4 — Outpatient pharmacy: 80% reimbursement (p.9)", record: "Monthly diabetes medication",
      why: "Current medication (~$60/month) reimbursed at 80% ≈ $48/month, after the $100 annual deductible." },
    { v: "covered", verdict: "Covered", clause: "§6.1 — ICU: $1,500/day (p.11)", record: "—",
      why: "Standard in-network ICU runs ~$1,200/day — fully inside the daily limit." },
  ],
  scenarios: [
    { icon: "🫁", name: "Pneumonia hospitalization", when: "Year 1", payout: 92,
      why: "Acute infection unrelated to pre-existing conditions. No waiting period applies; standard room and ICU charges fall within policy limits.", clauses: ["§6.1 ICU", "§5.1 Hospitalization"] },
    { icon: "❤️", name: "Heart attack", when: "Year 2", payout: 40,
      why: "The cardiac sub-limit caps payout at $5,000 against a ~$12,000 typical cost — and the PED waiting period is still active for related complications in year 2.", clauses: ["§7.1 Cardiac sub-limit", "§4.2 PED waiting period"] },
    { icon: "🦵", name: "Knee replacement", when: "Year 4", payout: 85,
      why: "The 36-month waiting period has expired by year 4. Orthopedic procedure falls within standard limits, minus deductible and 10% co-pay.", clauses: ["§4.2 PED (expired)", "§5.1 Hospitalization"] },
  ],
};

export const DEMO_APPEAL = [
  { h: "Re: Appeal of Denied Claim #HD-2291", p: [
    "To: SecureLife Insurance Corp., Appeals Department",
    "From: Arjun Mehta · Policy #SHG-88213",
    "Claim #HD-2291 · Cardiac hospitalization · $11,842.00 · Denied March 14, 2026" ] },
  { h: "I. Statement of Facts", p: [
    "On February 28, 2026, I was hospitalized for an acute myocardial infarction and underwent emergency coronary artery bypass surgery. The claim for $11,842.00 was denied in full by letter dated March 14, 2026.",
    "My policy has been in continuous force since January 12, 2023 — 41 months at the time of service." ] },
  { h: "II. The Denial Misapplies the Policy's Own Language", p: [
    "The denial cites §4.2, the 36-month pre-existing condition waiting period. The policy's own text reads:" ],
    quote: "§4.2 — \"No benefits shall be payable for a pre-existing condition during the first thirty-six (36) months of continuous coverage.\"",
    p2: [ "At the date of service, this policy had been in force for 41 months. The waiting period expired on January 12, 2026 — 47 days before my admission. The denial is therefore void under the policy's own terms." ] },
  { h: "III. The Correct Clause — and What It Owes", p: [
    "The applicable provision is §7.1, which mandates cardiac benefits up to $5,000 per policy year. To date, $0.00 has been paid. A minimum of $5,000 is immediately due." ] },
  { h: "IV. Medical Necessity", p: [
    "The emergency procedure was medically necessary under standard cardiology guidelines (ACC/AHA Class I indication). Emergency care cannot be conditioned on prior authorization, consistent with §6.3 of the policy and applicable emergency-care regulations." ] },
  { h: "V. Relief Requested", p: [
    "1. Immediate reversal of the denial of Claim #HD-2291;",
    "2. Payment of $5,000 under §7.1;",
    "3. Reconsideration of the balance under the policy's emergency care provisions (§6.3).",
    "This appeal is submitted within the applicable appeal window. I reserve all rights under ERISA §502(a) and applicable state insurance regulations.",
    "Sincerely,  Arjun Mehta" ] },
];

export const M1_LOG = [
  "> Ingesting policy document… SecureHealth Gold (38 pages)",
  "> Extracting 214 clauses… waiting periods · sub-limits · exclusions ✓",
  "> Ingesting medical records… Arjun Mehta, 34",
  "> Identified 3 conditions · 3 medications · HbA1c 7.8%",
  "> Cross-referencing conditions × clauses…",
  "! CONFLICT: §4.2 PED waiting period ↔ Type 2 Diabetes (2019)",
  "! CONFLICT: §7.1 cardiac sub-limit ↔ hypertension + BMI 31",
  "> Computing payout simulations…",
  "> Report ready.",
];

export const M2_LOG = [
  "> Ingesting denial letter… Claim #HD-2291 · $11,842.00",
  "> Insurer cites §4.2 — pre-existing condition exclusion",
  "> Pulling policy §4.2… cross-checking policy timeline…",
  "! MISAPPLICATION DETECTED: policy in force 41 months > 36-month waiting period",
  "> §4.2 does not apply. Correct clause: §7.1 (cardiac sub-limit)",
  "> Drafting appeal… citing policy language + medical necessity guidelines",
  "> Appeal packet ready.",
];