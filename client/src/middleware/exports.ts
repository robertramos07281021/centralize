export const disposition = [
  "Bill Dispute",
  "Follow Up Payment",
  "Failed Verification",
  "Hung Up",
  "In Capacity To Pay",
  "Leave Message",
  "Paid",
  "Promise To Pay",
  "RPC Call Back",
  "Refuse To Pay",
  "Undernego",
  "Answering Machine",
  "Wrong Number",
  "No Answer",
];

export const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const date: Record<string, number> = {
  January: 31,
  February: 29,
  March: 31,
  April: 30,
  May: 31,
  June: 30,
  July: 31,
  August: 31,
  September: 30,
  October: 31,
  November: 31,
  December: 31,
};

export const color = [
  "oklch(0.75 0.15 0)", // Red
  "oklch(0.75 0.15 18)", // Orange-red
  "oklch(0.75 0.15 36)", // Orange
  "oklch(0.75 0.15 54)", // Yellow-orange
  "oklch(0.75 0.15 72)", // Yellow
  "oklch(0.75 0.15 90)", // Yellow-green
  "oklch(0.75 0.15 108)", // Lime green
  "oklch(0.75 0.15 126)", // Green
  "oklch(0.75 0.15 144)", // Emerald
  "oklch(0.75 0.15 162)", // Cyan-green
  "oklch(0.75 0.15 180)", // Cyan
  "oklch(0.75 0.15 198)", // Aqua
  "oklch(0.75 0.15 216)", // Sky Blue
  "oklch(0.75 0.15 234)", // Blue
  "oklch(0.75 0.15 252)", // Indigo
  "oklch(0.75 0.15 270)", // Violet
  "oklch(0.75 0.15 288)", // Purple
  "oklch(0.75 0.15 306)", // Magenta
  "oklch(0.75 0.15 324)", // Pink
  "oklch(0.75 0.15 342)",
];

type tabs = {
  name: string;
  link: string;
};

type links = {
  name: string;
  link: string | null;
  tabs: tabs[] | null;
};

export const accountsNavbar: { [key: string]: links[] } = {
  AGENTFIELD: [
    { name: "Dashboard", link: "/agent-field-dashboard", tabs: null },
    { name: "Customer Sorting", link: "/customer-sorting", tabs: null },
    // { name: "Messenger", link: "/message-center", tabs: null },
  ],
  TLFIELD: [
    { name: "Dashboard", link: "/tl-field-dashboard", tabs: null },
    { name: "assigning", link: "/tl-field-production", tabs: null },
    { name: "Enrollment", link: "/tl-field-enrollment", tabs: null },
  ],
  ADMIN: [
    {
      name: "Dashboard",
      link: "/admin-dashboard",
      tabs: null,
    },
    {
      name: "Accounts",
      link: "/accounts",
      tabs: null,
    },
    {
      name: "Branch & Depts",
      link: "/setup",
      tabs: null,
    },
    {
      name: "Disposition Configuration",
      link: "/disposition-settings",
      tabs: null,
    },
    {
      name: "Callfile Configuration",
      link: "/callfile-configurations",
      tabs: null,
    },
    {
      name: "Logs",
      link: null,
      tabs: [
        {
          name: "Agent Logs",
          link: "/agent-attendance-logs",
        },
        {
          name: "Call Monitoring",
          link: "/all-call-logs",
        },
      ],
    },
    {
      name: "Selectives",
      link: "/selectives",
      tabs: null,
    },
    {
      name: "Updates & News",
      link: "/update-news",
      tabs: null,
    },
    {
      name: "CCS Flow",
      link: "/ccs-flow",
      tabs: null,
    },
    {
      name: "EOD",
      link: "/eod",
      tabs: null,
    },
  ],
  AGENT: [
    {
      name: "Dashboard",
      link: "/agent-dashboard",
      tabs: null,
    },
    {
      name: "Customer Interaction Panel",
      link: "/agent-cip",
      tabs: null,
    },
    {
      name: "Report",
      link: "/agent-report",
      tabs: null,
    },
    { name: "FAQs", link: "/agent-faqs", tabs: null },
  ],
  TL: [
    {
      name: "Dashboard",
      link: "/tl-dashboard",
      tabs: null,
    },
    {
      name: "Customer Interaction Panel",
      link: "/tl-cip",
      tabs: null,
    },
    {
      name: "Task Manager",
      link: "/tl-task-manager",
      tabs: null,
    },
    {
      name: "Production Manager",
      link: "/tl-production-manager",
      tabs: null,
    },
    {
      name: "Agent Production",
      link: "/agent-production",
      tabs: null,
    },
    {
      name: "Reports",
      link: null,
      tabs: [
        {
          name: "Callfile Performance",
          link: "/tl-callfile-reports",
        },
        {
          name: "Agent Performance",
          link: "/tl-agent-reports",
        },
      ],
    },
    {
      name: "Logs",
      link: null,
      tabs: [
        {
          name: "Agent Logs",
          link: "/tl-agent-attendance",
        },
        {
          name: "Call Monitoring",
          link: "/call-agents-logs",
        },
      ],
    },
    { name: "Field Status", link: "/tl-field-status", tabs: null },
    { name: "FAQs", link: "/tl-faqs", tabs: null },
  ],
  MIS: [
    {
      name: "Dashboard",
      link: "/mis-dashboard",
      tabs: null,
    },
    {
      name: "Customer Interaction Panel",
      link: "/tl-cip",
      tabs: null,
    },
    {
      name: "Task Manager",
      link: "/tl-task-manager",
      tabs: null,
    },
    {
      name: "Production Manager",
      link: "/tl-production-manager",
      tabs: null,
    },
    {
      name: "Agent Production",
      link: "/agent-production",
      tabs: null,
    },
    {
      name: "Reports",
      link: "/tl-reports",
      tabs: null,
    },
  ],
  AOM: [
    {
      name: "Dashboard",
      link: "/aom-dashboard",
      tabs: null,
    },
    {
      name: "Approval",
      link: "/aom-field-dashboard",
      tabs: null,
    },
  ],
  QA: [
    {
      name: "Agents Dashboard",
      link: "/qa-dashboard",
      tabs: null,
    },
    {
      name: "Agents Recordings",
      link: "/qa-agents-dashboard",
      tabs: null,
    },
    {
      name: "Logs",
      link: null,
      tabs: [
        {
          name: "Agent Logs",
          link: "/qa-agent-attendance",
        },
        {
          name: "Call Monitoring",
          link: "/qa-call-all-agent-logs",
        },
      ],
    },
    {
      name: "Reports",
      link: null,
      tabs: [
        {
          name: "Callfile Performance",
          link: "/qa-callfile-reports",
        },
        {
          name: "Agent Performance",
          link: "/qa-agent-reports",
        },
      ],
    },
    {
      name: "Score Sheet",
      link: "/score-card",
      tabs: null,
    },
  ],
  QASUPERVISOR: [
    {
      name: "QA Dashboard",
      link: "/qasv-dashboard",
      tabs: null,
    },
    {
      name: "QA Accounts",
      link: "/qasv-accounts",
      tabs: null,
    },
    {
      name: "Agent Recordings",
      link: "/qasv-recordings",
      tabs: null,
    },
    {
      name: "Logs",
      link: null,
      tabs: [
        {
          name: "Agent Logs",
          link: "/qasv-agent-attendance",
        },
        {
          name: "Call Monitoring",
          link: "/qasv-call-all-agent-logs",
        },
      ],
    },
    {
      name: "Reports",
      link: null,
      tabs: [
        {
          name: "Callfile Performance",
          link: "/qasv-callfile-reports",
        },
        {
          name: "Agent Performance",
          link: "/qasv-agent-reports",
        },
      ],
    },
    {
      name: "Score Sheet",
      link: null,
      tabs: [
        {
          name: "Score Sheet Overview",
          link: "/scorecard-overview",
        },
        {
          name: "Default Score Sheet",
          link: "/default-score-card",
        },
        {
          name: "UB Cards Score Sheet",
          link: "/ub-score-card",
        },
        {
          name: "Eastwest Score Sheet",
          link: "/eastwest-score-card",
        },
        {
          name: "UB Mortgage Score Sheet",
          link: "/ub-mortgage-score-card",
        },
      ],
    },
  ],
  COMPLIANCE: [
    {
      name: "dashboard",
      link: "/compliance-dashboard",
      tabs: null,
    },
    {
      name: "QA Accounts",
      link: "/compliance-agent-account",
      tabs: null,
    },
    {
      name: "tab3",
      link: "/tantado",
      tabs: null,
    },
  ],
};

export enum BreakEnum {
  LUNCH = "LUNCH",
  COFFEE = "COFFEE",
  MEETING = "MEETING",
  TECHSUPP = "TECHSUPP",
  CRBREAK = "CRBREAK",
  COACHING = "COACHING",
  HRMEETING = "HRMEETING",
  HANDSETNEGO = "HANDSETNEGO",
  SKIPTRACING = "SKIPTRACING",
  CLINIC = "CLINIC",
  PROD = "PROD",
  WELCOME = "WELCOME",
  REPORT = "REPORT",
  LOGOUT = "LOGOUT",
}

type Breaks = {
  name: string;
  value: keyof typeof BreakEnum;
};

export const breaks: Breaks[] = [
  {
    name: "Lunch Break",
    value: BreakEnum.LUNCH,
  },
  {
    name: "Coffee",
    value: BreakEnum.COFFEE,
  },
  {
    name: "Meeting",
    value: BreakEnum.MEETING,
  },
  {
    name: "Technical Support",
    value: BreakEnum.TECHSUPP,
  },
  {
    name: "Cr Break",
    value: BreakEnum.CRBREAK,
  },
  {
    name: "Coaching",
    value: BreakEnum.COACHING,
  },
  {
    name: "HR Meeting",
    value: BreakEnum.HRMEETING,
  },
  {
    name: "Handset Nego",
    value: BreakEnum.HANDSETNEGO,
  },
  {
    name: "Skip Tracing",
    value: BreakEnum.SKIPTRACING,
  },
  {
    name: "Clinic",
    value: BreakEnum.CLINIC,
  },
  {
    name: "Report",
    value: BreakEnum.REPORT,
  },
];

export const colorDispo: { [key: string]: string } = {
  DISP: "oklch(0.704 0.191 22.216)",
  FFUP: "oklch(0.75 0.183 55.934)",
  FV: "oklch(0.828 0.189 84.429)",
  HUP: "oklch(0.852 0.199 91.936)",
  ITP: "oklch(0.841 0.238 128.85)",
  LM: "oklch(0.792 0.209 151.711)",
  PAID: "oklch(0.765 0.177 163.223)",
  PTP: "oklch(0.777 0.152 181.912)",
  RPCCB: "oklch(0.789 0.154 211.53)",
  RTP: "oklch(0.746 0.16 232.661)",
  UNEG: "oklch(0.707 0.165 254.624)",
  ANSM: "oklch(0.673 0.182 276.935)",
  WN: "oklch(0.702 0.183 293.541)",
  NOA: "oklch(0.714 0.203 305.504)",
  KOR: "oklch(0.74 0.238 322.16)",
  OCA: "oklch(0.73 0.195 45.0)",
  NIS: "oklch(0.7 0.2 340.0)",
  BUSY: "oklch(0.73 0.19 10.0)",
  DEC: "oklch(0.76 0.185 30.0)",
  UNK: "oklch(0.78 0.18 350.0)",
  SET: "oklch(0.76 0.19 20.0)",
};

export const scoreCardDropdownOptions: Record<string, string[]> = {
  "opening-introduction": [
    "1. Agent should respond and engage promptly within 10 seconds once the call is connected and use appropriate greeting/s.",
    "2. Agent must introduce first in case of customer refusal of identity.",
    "2.1 Agents may introduce by using their First name, Last name of Full name, incase the agents have 2(Two) first names, the agents may use either of the names.",
    "2.2 Agents are not allowed to use aliases or nicknames.",
    "3. Agent must introduce that we are calling from Bernales & Associates and state the reason for calling.",
  ],
  "opening-account-overview": [
    "1. Agent must set the importance and or urgency of the customers account by providing account status.",
  ],
  "negotiation-probing": [
    "1. Agent must assess the customer’s current financial situation by probing the customer’s reason for delay of payments.",
    "2. Agent must establish the source of funds to assess the customer’s capacity to pay on the agreement.",
  ],
  "negotiation-hierarchy": [
    "1. Agent should ask the customer to settle in full today.",
    "2. Agent should be able to offer payment option/s to the customer based on the customer’s ability to pay as identified during probing.",
    "3. Agent must follow the limit of payment period and should not go beyond the allotted days without a valid reason and approval from a Supervisor/Manager.",
    "4. Agent should not offer payment plans all at once.",
  ],
  "negotiation-solidifying": [
    "1. Agent should recap the highlights of negotiation by stating the MAD “Method, Amount and Date of payment",
    "2. Agent must state the benefits/WIIFM (What’s In It For Me) for settling the balance or consequence for not making a payment based on the agreed arrangement",
    "3. Agent should ask the client to send a promissory note as confirmation of the PTP during the negotiation, otherwise we will be sending the details via SMS/Email to the client and they need to reply as acknowledgement",
  ],
  "negotiation-listening": [
    "1. Avoid repetitive, unnecessary questions and off topic responses, except either of parties experience technical issues",
    "2. Agent should ask a follow up/clarifying questions if the customers statement is vague or line is distorted",
  ],
  "negotiation-words": [
    "1.Agent should use appropriate empathy/acknowledgement statements",
    "2. Agent used inappropriate tone/volume",
  ],
  "negotiation-control": [
    "1. Agent must not interrupt while the customer is talking, except either of parties experience technical issues",
    "2. Agent should attempt to de-escalate the complaint once, if the customer threatens to file a complaint despite de-escalation, agent must escalate the call to a Supervisor",
    "3. If the customer mentioned that the call happened at an unexpected time and sounded in a hurry, agent must attempt to explain that the call will only last a few minutes to avoid early termination, except when the customers safety is at risk ",
    "4. If the customer experience technical difficulties (choppy/distorted line), agent must attempt to request for the customer to move to location with better reception",
    "5. Agent owned and control the call at the beginning and throughout the call",
    "6. Lengthily explanations that causes confusion and agitate the client",
  ],
  "negotiation-education": [
    "1. Agent must ask the customer if they still have access to their account and provide assistance to the customer if necessary",
    "2. Agent must acknowledge and answers customers collection and or payment concerns, and ensure that information provided is complete and accurate",
    "3. In the event if applicable the customer asked for repeat loan/account activation eligibility, agent must advise the customer that repeat loan/account activation are subject for approval",
    "4. For Medical and serious health related reasons, agent must ask first the customers consent before proceeding with the call",
    "5. For RTP, NIOP and Partial payment calls, agent must set the customer’s expectation on follow-up collection calls to lessen the risk of irate customers due to frequent calling",
  ],
  "closing-third-party": [
    "1. Agent must obtain any of the following when talking to a Third Party: name, whereabouts of the customer, other contacts of the customer and relationship to the customer.",
    "2. Agent must not insist on proceeding with the call if the Third Party refused to disclose any information.",
    "3. If the customer is not available, agent must advise the third party that the customer may contact us via email and/or our inbound number.",
    "4. In case the client is deceased, agent must advise the third party to send a certified true copy of Death Certificate.",
  ],
  "closing-spiel": [
    "1. Did not follow proper closing spiel/no proper closing spiel.",
  ],
  "call-disposition": [
    "1. Team members must use proper disposition based on what was transcribed on the call",
  ],
  "confidentiality-of-information": [
    "1. Any infraction or violation under SEC: SEC – Unfair Debt Collection Practices / BSP: BSP Circular 454 Sec 7",
    "2. Account disclosure to unverified/unauthorized parties",
  ],
  "unfair-debt-collection-practices": [
    "1. Any infraction or violation under SEC: SEC – Unfair Debt Collection Practices / BSP: BSP Circular 454 Sec 7",
    "2. When Agent obtains sensitive, personal information including but not limited to Medical, Political, Marital, Religious belief, connections and affiliations",
  ],
  "information-accuracy": [
    "1. Agent must provide correct information from the amount due, policies and procedures of the Financial Companies/Lending Companies",
    "2. When an Agent provides false information intended to deceive the customers just to gain payment",
    "3. Whether intentional or unintentional as long as the agent provides false information unless the agent was able to correct his/her statement on the same call and was acknowledged and understood by the customer.",
  ],
  "call-recording-statement": [
    "1. Agents must state the call recording statement on the onset of the call",
  ],
  "incomplete-attempt-to-negotiate": [
    "1. Agent should attempt to negotiate accounts in every call as possible",
    "2. Agent must complete the negotiation process.",
  ],
  "call-avoidance-early-termination": [
    "1. Agent deliberately ended the call while the customer is talking.",
    "2. Agent does not respond to the customer until the customer disconnected the call, unless there is a technical issue.",
    "3. Agent intentionally ended the call after delivering the opening spiel or at any part of the call.",
    "4. Agent should release the call for not more than 1 minute after the customer acknowledges the closing spiel.",
  ],
  professionalism: ["1. Agent shows disrespect and or rudeness to customer."],
};
