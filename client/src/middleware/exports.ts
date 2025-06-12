
export const disposition = ["Bill Dispute","Follow Up Payment","Failed Verification", "Hung Up", "In Capacity To Pay", "Leave Message", "Paid", "Promise To Pay", "RPC Call Back", "Refuse To Pay", "Undernego", "Answering Machine", "Wrong Number", "No Answer"]


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
  "December"
]

export const date:Record<string, number> = {
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
  December: 31
}

export const options = { 
  plugins: {
    datalabels: {
      color: 'oklch(0 0 0)',
      font: {
        weight: "bold", 
        size: 10,
      } as const,
    },
  },
  responsive: true, 
  maintainAspectRatio: false
}

export const color = [
  "oklch(0.75 0.15 0)",     // Red
  "oklch(0.75 0.15 18)",     // Orange-red
  "oklch(0.75 0.15 36)",     // Orange
  "oklch(0.75 0.15 54)",     // Yellow-orange
  "oklch(0.75 0.15 72)",     // Yellow
  "oklch(0.75 0.15 90)",     // Yellow-green
  "oklch(0.75 0.15 108)",     // Lime green
  "oklch(0.75 0.15 126)",     // Green
  "oklch(0.75 0.15 144)",     // Emerald
  "oklch(0.75 0.15 162)",     // Cyan-green
  "oklch(0.75 0.15 180)",     // Cyan
  "oklch(0.75 0.15 198)",     // Aqua
  "oklch(0.75 0.15 216)",     // Sky Blue
  "oklch(0.75 0.15 234)",     // Blue
  "oklch(0.75 0.15 252)",     // Indigo
  "oklch(0.75 0.15 270)",     // Violet
  "oklch(0.75 0.15 288)",     // Purple
  "oklch(0.75 0.15 306)",     // Magenta
  "oklch(0.75 0.15 324)",     // Pink
  "oklch(0.75 0.15 342)", 
]


interface links {
  name: string
  link: string
}

export const accountsNavbar:{[key:string]:links[]} = {
  ADMIN: [
    {
      name: "Dashboard",
      link: "/admin-dashboard"
    },
    {
      name: "Accounts",
      link: "/accounts"
    },
    {
      name: "Branch & Depts",
      link: "/setup"
    },
  ],
  AGENT: [
    {
      name: "Dashboard",
      link: "/agent-dashboard"
    },
    {
      name: "Customer Interaction Panel",
      link: "/agent-cip"
    },
    {
      name: "Report",
      link: "/agent-report"
    },
  ],
  TL: [
    {
      name: "Dashboard",
      link: "/tl-dashboard"
    },
    {
      name: "Customer Interaction Panel",
      link: "/tl-cip"
    },
    {
      name: "Task Manager",
      link: "/tl-task-manager"
    },
    {
      name: "Production Manager",
      link: '/tl-production-manager'
    },
    {
      name: "Reports",
      link: "/tl-reports"
    },
  ],
  AOM: [
    {
      name: "Dashboard",
      link: "/aom-dashboard"
    },
    {
      name: "Report",
      link: "/aom-reports"
    }

  ]
}