import React from "react"

type DispositionType = {
  _id: string
  name: string
  code: string
  count: string
  amount: number
}
type ComponentProp = {
  totalAccounts: number
  dispo: DispositionType[]
  firstTitle: string,
  secondTitle: string
  color: string
}


const ReportsTables:React.FC<ComponentProp> = ({totalAccounts, dispo,secondTitle, firstTitle, color}) => {

  const sortedDispo =  [...dispo].sort((a,b)=> Number(b.count) - Number(a.count)) 
  const totalCount = [...dispo].map(x=> x.count)?.reduce((t,v)=> t+ v)
  const totalAmount = [...dispo].map(x=> x.amount)?.reduce((t,v)=> t+ v) 

  const colorObject:{[key:string]:string} = {
    indigo : "bg-indigo-500",
    cyan : 'bg-cyan-500',
    blue : 'bg-blue-500',
    yellow : 'bg-yellow-300'
  }

  return (
     <>
      <table className="border border-collapse border-black w-2/6">
        <tbody className="text-center">
          <tr className="border-black border">
            <th className={`w-1/3 py-0.5 ${colorObject[color as keyof typeof colorObject]} border-black border`} rowSpan={2}>{firstTitle}</th>
            <td className={`w-50 py-0.5 ${colorObject[color as keyof typeof colorObject]} border-black border font-medium`}>Response Count</td>
            <td className={`w-50 border-black border ${colorObject[color as keyof typeof colorObject]} font-medium`}>Not Responded</td>
          </tr>
          <tr className="border-black border">
            <td className="py-0.5 border text-slate-900 font-medium">{totalCount}</td>
            <td className="border text-slate-900 font-medium">{totalAccounts - Number(totalCount)}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th colSpan={5} className={`border border-black ${colorObject[color as keyof typeof colorObject]}`}>{secondTitle}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-gray-700">
            <th className="border border-black">Disposition</th>
            <th className="border border-black">Count</th>
            <th className="border border-black">Count Percentage</th>
            <th className="border border-black">Total Principal</th>
            <th className="border border-black">Principal Percentage</th>
          </tr>
          {
            sortedDispo.map(x=> {
              const totalAmount = x.amount / sortedDispo.map(x=> x.amount).reduce((t,v)=> t + v) * 100
              return <tr key={x._id} className="text-center"> 
                <td className="border border-black">{x.name}</td>
                <td className="border border-black">{x.count}</td>
                <td className="border border-black">{(Number(x.count)/Number(totalCount) * 100).toFixed(2)}%</td>
                <td className="border border-black">{x.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
                <td className="border border-black">{totalAmount.toFixed(2)}%</td>
              </tr>
            })
          }
          <tr className="text-center font-medium">
            <td className="border border-black bg-green-600 text-white">Total</td>
            <td className="border border-black">{totalCount}</td>
            <td className="border border-black">100%</td>
            <td className="border border-black">{totalAmount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
            <td className="border border-black">100%</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default ReportsTables