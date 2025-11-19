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
      link: "/tl-reports",
      tabs: null,
    },
    {
      name: "Call Monitoring",
      link: "/call-agents-logs",
      tabs: null,
    },
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
      name: "Full Time Employee",
      link: "/aom-fte-user",
      tabs: null,
    },
    {
      name: "Report",
      link: "/aom-reports",
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
