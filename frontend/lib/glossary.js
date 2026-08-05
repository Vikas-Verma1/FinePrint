// frontend/lib/glossary.js
// Client-side insurance jargon dictionary with English + Hindi definitions.

const C = {
  sumInsured: {
    en: "The maximum amount the insurer will pay — your total coverage ceiling.",
    hi: "बीमाकर्ता द्वारा दी जाने वाली अधिकतम राशि — आपकी कुल कवरेज सीमा।",
  },
  subLimit: {
    en: "A hidden inner cap: even when covered, this item pays only up to a fixed small amount.",
    hi: "छिपी हुई अंदरूनी सीमा — कवर होने के बावजूद इस मद में केवल तय राशि तक भुगतान।",
  },
  coPay: {
    en: "The % of every claim YOU must pay yourself (20% co-pay = you pay 1/5 of the bill).",
    hi: "हर क्लेम का वह % जो आपको खुद देना होता है (20% co-pay = बिल का 1/5 आपका)।",
  },
  deductible: {
    en: "The fixed amount you must pay first before the insurer pays anything.",
    hi: "तय राशि जो बीमाकर्ता के भुगतान से पहले आपको खुद चुकानी होती है।",
  },
  waitingPeriod: {
    en: "A time window after buying the policy during which certain claims are NOT paid.",
    hi: "पॉलिसी शुरू होने के बाद की वह अवधि जिसमें कुछ क्लेम का भुगतान नहीं होता।",
  },
  ped: {
    en: "Pre-Existing Disease/condition — an illness you had before the policy; claims wait 2–4 years.",
    hi: "पहले से मौजूद बीमारी — आमतौर पर 2–4 साल की प्रतीक्षा के बाद ही कवर होती है।",
  },
  roomRent: {
    en: "Daily hospital room cost — the insurer pays only up to a limit (e.g. 1% of sum insured).",
    hi: "कमरे का दैनिक खर्च — बीमाकर्ता केवल सीमा तक देता है (जैसे sum insured का 1%)।",
  },
  roomRentCapping: {
    en: "The limit up to which the insurer pays room rent; extra cost (and often proportional ICU/doctor fees) comes from you.",
    hi: "कमरे के किराए की सीमा — ऊपर का खर्च आपका; कई बार ICU/डॉक्टर फीस भी अनुपात में कटती है।",
  },
  cashless: {
    en: "The insurer settles the bill directly with the hospital — you don't pay and claim back.",
    hi: "बीमाकर्ता सीधे अस्पताल से बिल निपटाता है — आपको पहले पैसे देकर क्लेम नहीं करना पड़ता।",
  },
  networkHospital: {
    en: "A hospital tied up with the insurer where cashless treatment works.",
    hi: "बीमाकर्ता से जुड़े अस्पताल जहाँ cashless सुविधा मिलती है।",
  },
  dayCare: {
    en: "Procedures needing less than 24h hospital stay — covered without full admission.",
    hi: "24 घंटे से कम भर्ती वाली प्रक्रियाएँ — बिना पूरे एडमिशन के कवर।",
  },
  ncb: {
    en: "No-Claim Bonus — reward for claim-free years: your sum insured grows (e.g. +50%).",
    hi: "क्लेम-मुक्त सालों का इनाम — आपकी sum insured बढ़ती है (जैसे +50%)।",
  },
  cumulativeBonus: {
    en: "Extra sum insured that accumulates for every claim-free year.",
    hi: "हर क्लेम-मुक्त साल पर जुड़ने वाली अतिरिक्त sum insured।",
  },
  restoration: {
    en: "If your sum insured runs out, the insurer refills it once for later claims.",
    hi: "sum insured खत्म होने पर बीमाकर्ता बाद के क्लेम के लिए उसे एक बार फिर भर देता है।",
  },
  exclusion: {
    en: "Something the policy will NEVER pay for — read this list first.",
    hi: "ऐसी मद जिसका भुगतान पॉलिसी कभी नहीं करती — यह सूची सबसे पहले पढ़ें।",
  },
  excluded: {
    en: "Not payable by the policy, ever.",
    hi: "पॉलिसी द्वारा कभी देय नहीं।",
  },
  premium: {
    en: "The price you pay for the policy (yearly or monthly).",
    hi: "पॉलिसी की कीमत (सालाना या मासिक)।",
  },
  claim: {
    en: "Your formal request to the insurer to pay a hospital bill.",
    hi: "अस्पताल का बिल चुकाने के लिए बीमाकर्ता से आपकी औपचारिक माँग।",
  },
  denial: {
    en: "The insurer refusing to pay a claim.",
    hi: "बीमाकर्ता द्वारा क्लेम ठुकराया जाना।",
  },
  denied: {
    en: "Refused by the insurer.",
    hi: "बीमाकर्ता द्वारा ठुकराया गया।",
  },
  eob: {
    en: "Explanation of Benefits — the letter showing what was paid/denied and why.",
    hi: "Explanation of Benefits — पत्र जिसमें दिखता है कि क्या देय हुआ, क्या नहीं, और क्यों।",
  },
  gracePeriod: {
    en: "Extra days after the due date to pay your premium without losing coverage.",
    hi: "प्रिमियम भरने के लिए नियत तारीख के बाद के अतिरिक्त दिन — कवरेज नहीं टूटता।",
  },
  freeLook: {
    en: "A cooling-off window (15–30 days) to cancel a new policy for a refund.",
    hi: "नई पॉलिसी रद्द कर पूरी राशि वापस पाने की अवधि (15–30 दिन)।",
  },
  portability: {
    en: "The right to switch insurers without re-serving your waiting periods.",
    hi: "बिना waiting period दोबारा काटे एक बीमाकर्ता से दूसरे में जाने का अधिकार।",
  },
  ambulance: {
    en: "Pays (part of) the ambulance cost — often capped per trip.",
    hi: "एम्बुलेंस खर्च का (आंशिक) भुगतान — अक्सर प्रति ट्रिप सीमा तय।",
  },
  ayush: {
    en: "Covers Ayurveda, Yoga, Unani, Siddha and Homeopathy treatment.",
    hi: "आयुर्वेद, योग, यूनानी, सिद्ध और होम्योपैथी उपचार का कवरेज।",
  },
  opd: {
    en: "Out-Patient: doctor visits without admission — most basic policies don't cover it.",
    hi: "बिना भर्ती वाले डॉक्टर विज़िट — ज़्यादातर बेसिक पॉलिसियाँ कवर नहीं करतीं।",
  },
  domiciliary: {
    en: "Treatment at home when hospitalisation isn't possible — limited cover.",
    hi: "जब अस्पताल संभव न हो तो घर पर उपचार — सीमित कवरेज।",
  },
  inpatient: {
    en: "Treatment with formal hospital admission (24h+) — the core of health insurance.",
    hi: "औपचारिक भर्ती (24 घंटे+) के साथ उपचार — स्वास्थ्य बीमा का मूल हिस्सा।",
  },
  hospitalization: {
    en: "Being formally admitted to a hospital (24h+) — triggers most coverage.",
    hi: "अस्पताल में औपचारिक भर्ती (24 घंटे+) — इसी से ज़्यादातर कवरेज शुरू होता है।",
  },
  icu: {
    en: "Intensive Care Unit — often has its own separate sub-limit.",
    hi: "गहन चिकित्सा इकाई — अक्सर इसकी अपनी अलग sub-limit होती है।",
  },
  bariatric: {
    en: "Weight-loss surgery — commonly excluded in policies.",
    hi: "वज़न घटाने की सर्जरी — आमतौर पर excluded।",
  },
  rider: {
    en: "An optional add-on cover bought for extra premium.",
    hi: "अतिरिक्त प्रिमियम पर लिया जाने वाला वैकल्पिक add-on कवर।",
  },
  tpa: {
    en: "Third-Party Administrator — the company that processes claims between you, hospital and insurer.",
    hi: "आप, अस्पताल और बीमाकर्ता के बीच क्लेम निपटाने वाली कंपनी (Third-Party Administrator)।",
  },
};

export const GLOSSARY = {
  "sum insured": C.sumInsured,
  "sub-limit": C.subLimit,
  "sub-limits": C.subLimit,
  "sub limit": C.subLimit,
  "sub limits": C.subLimit,
  "co-pay": C.coPay,
  "copay": C.coPay,
  "coinsurance": C.coPay,
  "deductible": C.deductible,
  "deductibles": C.deductible,
  "waiting period": C.waitingPeriod,
  "waiting periods": C.waitingPeriod,
  "pre-existing condition": C.ped,
  "pre-existing conditions": C.ped,
  "pre-existing disease": C.ped,
  "pre-existing diseases": C.ped,
  "ped": C.ped,
  "room rent": C.roomRent,
  "room rent capping": C.roomRentCapping,
  "room rent cap": C.roomRentCapping,
  "cashless": C.cashless,
  "network hospital": C.networkHospital,
  "network hospitals": C.networkHospital,
  "day care": C.dayCare,
  "day-care": C.dayCare,
  "no-claim bonus": C.ncb,
  "no claim bonus": C.ncb,
  "ncb": C.ncb,
  "cumulative bonus": C.cumulativeBonus,
  "restoration benefit": C.restoration,
  "exclusion": C.exclusion,
  "exclusions": C.exclusion,
  "excluded": C.excluded,
  "premium": C.premium,
  "premiums": C.premium,
  "claim": C.claim,
  "claims": C.claim,
  "denial": C.denial,
  "denied": C.denied,
  "eob": C.eob,
  "grace period": C.gracePeriod,
  "free look period": C.freeLook,
  "portability": C.portability,
  "ambulance cover": C.ambulance,
  "ayush": C.ayush,
  "opd": C.opd,
  "domiciliary": C.domiciliary,
  "in-patient": C.inpatient,
  "inpatient": C.inpatient,
  "hospitalization": C.hospitalization,
  "hospitalisation": C.hospitalization,
  "icu": C.icu,
  "bariatric surgery": C.bariatric,
  "rider": C.rider,
  "riders": C.rider,
  "tpa": C.tpa,
};

// entry may be {en, hi} or a plain string (legacy)
export function getGlossDef(entry, lang = "en") {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  return entry[lang] || entry.en || "";
}

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









// // frontend/lib/glossary.js
// // Pure client-side insurance jargon dictionary for hover/tap tooltips.

// export const GLOSSARY = {
//   "sum insured": "The maximum amount the insurer will pay — your total coverage ceiling.",
//   "sub-limit": "A hidden inner cap: even when covered, this item pays only up to a fixed small amount.",
//   "sub-limits": "Hidden inner caps: even when covered, these items pay only up to fixed small amounts.",
//   "sub limit": "A hidden inner cap: even when covered, this item pays only up to a fixed small amount.",
//   "sub limits": "Hidden inner caps: even when covered, these items pay only up to fixed small amounts.",
//   "co-pay": "The % of every claim YOU must pay yourself (20% co-pay = you pay 1/5 of the bill).",
//   "copay": "The % of every claim YOU must pay yourself (20% co-pay = you pay 1/5 of the bill).",
//   "coinsurance": "The % of every claim YOU must pay yourself, same idea as a co-pay.",
//   "deductible": "The fixed amount you must pay first before the insurer pays anything.",
//   "deductibles": "Fixed amounts you must pay first before the insurer pays anything.",
//   "waiting period": "A time window after buying the policy during which certain claims are NOT paid.",
//   "waiting periods": "Time windows after buying the policy during which certain claims are NOT paid.",
//   "pre-existing condition": "An illness you already had before the policy started — usually waits 2–4 years.",
//   "pre-existing conditions": "Illnesses you already had before the policy started — usually wait 2–4 years.",
//   "pre-existing disease": "An illness you already had before the policy started — usually waits 2–4 years.",
//   "pre-existing diseases": "Illnesses you already had before the policy started — usually wait 2–4 years.",
//   "ped": "Pre-Existing Disease — an illness you had before the policy; claims wait 2–4 years.",
//   "room rent": "Daily hospital room cost — capping means the insurer pays only up to a limit (e.g. 1% of sum insured).",
//   "room rent capping": "The insurer pays room rent only up to a limit; extra cost (and often proportional ICU/doctor fees) comes from you.",
//   "room rent cap": "The limit up to which the insurer pays your hospital room cost.",
//   "cashless": "The insurer settles the bill directly with the hospital — you don't pay and claim back.",
//   "network hospital": "A hospital tied up with the insurer where cashless treatment works.",
//   "network hospitals": "Hospitals tied up with the insurer where cashless treatment works.",
//   "day care": "Procedures needing less than 24h hospital stay — covered without full admission.",
//   "day-care": "Procedures needing less than 24h hospital stay — covered without full admission.",
//   "no-claim bonus": "Reward for claim-free years: your sum insured grows (e.g. +50% over time).",
//   "no claim bonus": "Reward for claim-free years: your sum insured grows (e.g. +50% over time).",
//   "ncb": "No-Claim Bonus — reward for claim-free years: your sum insured grows.",
//   "cumulative bonus": "Extra sum insured that accumulates for every claim-free year.",
//   "restoration benefit": "If your sum insured runs out, the insurer refills it once for later claims.",
//   "exclusion": "Something the policy will NEVER pay for — read this list first.",
//   "exclusions": "Things the policy will NEVER pay for — read this list first.",
//   "excluded": "Not payable by the policy, ever.",
//   "premium": "The price you pay for the policy (yearly or monthly).",
//   "premiums": "The prices you pay for the policy (yearly or monthly).",
//   "claim": "Your formal request to the insurer to pay a hospital bill.",
//   "claims": "Formal requests to the insurer to pay hospital bills.",
//   "denial": "The insurer refusing to pay a claim.",
//   "denied": "Refused by the insurer.",
//   "eob": "Explanation of Benefits — the letter showing what was paid/denied and why.",
//   "grace period": "Extra days after the due date to pay your premium without losing coverage.",
//   "free look period": "A cooling-off window (15–30 days) to cancel a new policy for a refund.",
//   "portability": "The right to switch insurers without re-serving your waiting periods.",
//   "ambulance cover": "Pays (part of) the ambulance cost — often capped per trip.",
//   "ayush": "Covers Ayurveda, Yoga, Unani, Siddha and Homeopathy treatment.",
//   "opd": "Out-Patient Department: doctor visits without admission — most basic policies don't cover it.",
//   "domiciliary": "Treatment taken at home when hospitalisation isn't possible — limited cover.",
//   "in-patient": "Treatment with formal hospital admission (24h+) — the core of health insurance.",
//   "inpatient": "Treatment with formal hospital admission (24h+) — the core of health insurance.",
//   "hospitalization": "Being formally admitted to a hospital (24h+) — triggers most coverage.",
//   "hospitalisation": "Being formally admitted to a hospital (24h+) — triggers most coverage.",
//   "icu": "Intensive Care Unit — often has its own separate sub-limit.",
//   "bariatric surgery": "Weight-loss surgery — commonly excluded in policies.",
//   "rider": "An optional add-on cover bought for extra premium.",
//   "riders": "Optional add-on covers bought for extra premium.",
//   "tpa": "Third-Party Administrator — the company that processes claims between you, hospital and insurer.",
// };

// function escapeRegExp(s) {
//   return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // Longest terms first so "room rent capping" wins over "room rent".
// export function glossaryRegex() {
//   const terms = Object.keys(GLOSSARY)
//     .sort((a, b) => b.length - a.length)
//     .map(escapeRegExp);
//   return new RegExp("\\b(?:" + terms.join("|") + ")\\b", "gi");
// }