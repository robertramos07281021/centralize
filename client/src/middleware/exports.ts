
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