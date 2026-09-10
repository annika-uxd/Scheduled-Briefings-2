import type { Article } from "@/lib/types";

/**
 * Fictionalised coverage for a Pfizer comms tenant. Headlines, outlets and
 * figures are invented for the prototype — no real reporting, no real people.
 * Analyst and spokesperson references are generic by design.
 */

export const ARTICLES: Record<string, Article> = {
  "art-q2-revenue": {
    id: "art-q2-revenue",
    headline: "Pfizer posts Q2 revenue of $15.2B, ahead of consensus by 12%",
    publication: "Reuters",
    date: "Sep 9",
    summary:
      "Revenue reached $15.2B for the quarter against a $13.6B consensus, with oncology up 34% year over year. Management raised full-year guidance and pointed to the specialty care portfolio as the quarter's most durable growth line.",
    whyItMatters:
      "The beat resets the narrative from patent-cliff anxiety to portfolio execution. Expect follow-up questions on whether oncology growth is durable past 2027.",
    sentiment: "positive",
    reach: "2.4M",
    topic: "Financial",
  },
  "art-oncology-pipeline": {
    id: "art-oncology-pipeline",
    headline:
      "Phase III readout for lead oncology candidate lands ahead of schedule",
    publication: "STAT News",
    date: "Sep 9",
    summary:
      "The trial met its primary endpoint with a 41% reduction in disease progression. Investigators described the safety profile as consistent with earlier phases, and the company confirmed it will file with regulators before year end.",
    whyItMatters:
      "This is the strongest proof point available for the pipeline story and should anchor the next two weeks of proactive outreach.",
    sentiment: "positive",
    reach: "890K",
    topic: "R&D",
  },
  "art-pricing-hearing": {
    id: "art-pricing-hearing",
    headline:
      "Senate committee schedules September hearing on insulin and specialty drug pricing",
    publication: "Politico",
    date: "Sep 10",
    summary:
      "The committee confirmed a hearing for late September covering list-price growth across insulin and specialty categories. Three manufacturers have been asked to send witnesses; invitations have not been made public.",
    whyItMatters:
      "A hearing invitation would force a public position on list pricing within two weeks. Government affairs should confirm witness status before the next edition.",
    sentiment: "negative",
    reach: "1.1M",
    topic: "Policy",
  },
  "art-eu-access": {
    id: "art-eu-access",
    headline:
      "EU regulator opens consultation on accelerated access pathway for rare disease therapies",
    publication: "Financial Times",
    date: "Sep 8",
    summary:
      "The consultation proposes a conditional approval route with mandatory post-market evidence generation. Industry groups have until November to respond, and several manufacturers have signalled support.",
    whyItMatters:
      "A favourable pathway would shorten time to market for two rare disease programmes. Worth a proactive comment before the consultation closes.",
    sentiment: "positive",
    reach: "1.6M",
    topic: "Policy",
  },
  "art-medicare-negotiation": {
    id: "art-medicare-negotiation",
    headline:
      "Analysts model 2027 Medicare negotiation impact across large-cap pharma",
    publication: "Bloomberg",
    date: "Sep 9",
    summary:
      "A sell-side note estimates a mid-single-digit revenue headwind across the sector by 2027, with variation driven by portfolio concentration. The note names diversification as the primary mitigation.",
    whyItMatters:
      "Reporters are using this note as a framing device. Have the diversification proof points ready for inbound questions this week.",
    sentiment: "neutral",
    reach: "2.0M",
    topic: "Policy",
  },
  "art-competitor-launch": {
    id: "art-competitor-launch",
    headline:
      "Rival announces direct-to-patient distribution for its cardiometabolic portfolio",
    publication: "The Wall Street Journal",
    date: "Sep 10",
    summary:
      "The programme bypasses traditional pharmacy channels for three products, with pricing set below current list. Executives framed it as an affordability measure and declined to give volume targets.",
    whyItMatters:
      "This resets the affordability conversation on competitor terms. Expect \u201cwhy not you\u201d questions within 48 hours.",
    sentiment: "negative",
    reach: "3.1M",
    topic: "Competitive",
  },
  "art-competitor-trial": {
    id: "art-competitor-trial",
    headline: "Competitor halts mid-stage obesity trial over tolerability signal",
    publication: "Endpoints News",
    date: "Sep 9",
    summary:
      "The trial was stopped after an independent monitoring board flagged a tolerability signal. The company said it will share detail at an upcoming medical meeting and did not commit to restarting.",
    whyItMatters:
      "Creates near-term share-of-voice room in metabolic coverage, but commenting invites comparison. Recommend monitoring only.",
    sentiment: "neutral",
    reach: "420K",
    topic: "Competitive",
  },
  "art-manufacturing": {
    id: "art-manufacturing",
    headline:
      "Company confirms $1.2B expansion of North Carolina manufacturing site",
    publication: "Associated Press",
    date: "Sep 8",
    summary:
      "The expansion adds sterile injectable capacity and an estimated 650 roles over three years. State officials attended the announcement and referenced a workforce training partnership.",
    whyItMatters:
      "The strongest available domestic-investment proof point. Pairs well with any pricing question that comes out of the Senate hearing.",
    sentiment: "positive",
    reach: "4.2M",
    topic: "Operations",
  },
  "art-vaccine-uptake": {
    id: "art-vaccine-uptake",
    headline:
      "Autumn respiratory vaccine uptake tracking below last season in key markets",
    publication: "NBC News",
    date: "Sep 10",
    summary:
      "Pharmacy data shows first-month uptake running 14% below the prior season across several states. Public health officials attributed the gap to messaging fatigue rather than supply.",
    whyItMatters:
      "Softening uptake pressures the respiratory franchise narrative heading into Q4 and invites questions about demand assumptions.",
    sentiment: "negative",
    reach: "2.8M",
    topic: "Commercial",
  },
  "art-patient-access": {
    id: "art-patient-access",
    headline:
      "Patient advocacy coalition publishes scorecard on assistance programme access",
    publication: "Kaiser Health News",
    date: "Sep 7",
    summary:
      "The scorecard rates manufacturers on eligibility clarity and enrolment friction. Reviewers praised the breadth of the programme while flagging application complexity as a barrier.",
    whyItMatters:
      "A mixed but engageable finding. The enrolment redesign already underway is the natural response if asked.",
    sentiment: "neutral",
    reach: "760K",
    topic: "Access",
  },
  "art-supply-chain": {
    id: "art-supply-chain",
    headline:
      "Sector faces renewed scrutiny over active ingredient sourcing concentration",
    publication: "The Economist",
    date: "Sep 7",
    summary:
      "The piece maps single-source dependencies across common therapeutic categories and argues that resilience investment has lagged public commitments made three years ago.",
    whyItMatters:
      "Thematic rather than company-specific, but it establishes the frame reporters will use for any future supply disruption.",
    sentiment: "neutral",
    reach: "1.4M",
    topic: "Operations",
  },
  "art-esg-report": {
    id: "art-esg-report",
    headline: "Annual health equity report cited in sector sustainability review",
    publication: "Forbes",
    date: "Sep 6",
    summary:
      "The review named the company's access reporting among the more specific disclosures in the sector, while noting that outcome data still lags commitment data across all manufacturers reviewed.",
    whyItMatters:
      "Useful third-party validation for investor and employee audiences. Low media risk.",
    sentiment: "positive",
    reach: "980K",
    topic: "Reputation",
  },
  "art-vaccine-pipeline-alt": {
    id: "art-vaccine-pipeline-alt",
    headline:
      "Combination respiratory vaccine candidate advances to registrational study",
    publication: "Nature Biotechnology",
    date: "Sep 9",
    summary:
      "The candidate combines two respiratory antigens in a single dose and showed comparable immunogenicity to sequential administration. The registrational study is expected to enrol by the end of the quarter.",
    whyItMatters:
      "A direct counterweight to the softening uptake story — the pipeline answer to a demand problem.",
    sentiment: "positive",
    reach: "310K",
    topic: "R&D",
  },
  "art-biosimilar": {
    id: "art-biosimilar",
    headline: "Biosimilar entrant clears regulatory review in two EU markets",
    publication: "Financial Times",
    date: "Sep 8",
    summary:
      "Approval covers two indications with launch expected in the first quarter. Analysts expect list-price erosion of 20–30% in the affected categories within a year of entry.",
    whyItMatters:
      "Adds pricing pressure to a category already under negotiation scrutiny, and gives reporters a European data point for the wider affordability story.",
    sentiment: "negative",
    reach: "1.6M",
    topic: "Competitive",
  },
  "art-clinical-diversity": {
    id: "art-clinical-diversity",
    headline:
      "Trial diversity data draws favourable comparison in medical journal editorial",
    publication: "JAMA",
    date: "Sep 5",
    summary:
      "The editorial compared enrolment demographics across recent late-stage oncology trials and singled out two programmes for representation that tracked closer to disease prevalence.",
    whyItMatters:
      "Credible, hard-to-buy validation from a clinical audience. Strong candidate for the executive summary if space allows.",
    sentiment: "positive",
    reach: "540K",
    topic: "R&D",
  },
};

export const ALL_ARTICLES = Object.values(ARTICLES);

export function getArticle(id: string): Article {
  const article = ARTICLES[id];
  if (!article) throw new Error(`Unknown article: ${id}`);
  return article;
}

export function getArticles(ids: string[]): Article[] {
  return ids.map(getArticle);
}
