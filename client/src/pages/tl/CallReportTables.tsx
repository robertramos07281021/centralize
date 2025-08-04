
type DispositionType = {
  _id: string
  name: string
  code: string
  count: string
  amount: number
}

type Callfile = {
  _id: string
  name: string
  totalAccounts: number
  totalPrincipal: number
  totalOB: number
}

type ComponentsProps = {
  totalAccounts: number
  reportsData: DispositionType[]
  callfile: Callfile
}

const CallReportTables:React.FC<ComponentsProps> = ({totalAccounts, reportsData, callfile}) => {

  const allAccountsReportDataCount = reportsData.map(x=> x.count).reduce((t,v) => t + v)
  const allAccountsReportDataAmount = reportsData.map(x=> x.amount).reduce((t,v) => t + v)
  
  const positive = ['PTP','FFUP','UNEG','RTP','PAID','DISP','LM','HUP','WN']
  
  const positiveCalls = reportsData && reportsData.length > 0 ? reportsData?.filter(x=> positive.includes(x.code)) : []
  const negativeCalls = reportsData && reportsData?.length > 0 ? reportsData?.filter(x=> !positive.includes(x.code)) : []
  const negativeTotalPrincipal = callfile.totalPrincipal - positiveCalls.map(x=> x.amount).reduce((t,v) => t + v) 
  const filteredPositive = positiveCalls.length > 0 ? positiveCalls?.map(y=> y.count)?.reduce((t,v)=> t + v) : []

  const totalNegativeCount = totalAccounts - Number(filteredPositive)

  return (
    <>
      <table className="border-collapse border border-black w-2/6">
        <tbody>
          <tr className="border border-black">
            <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Total Endorsement</th>
            <td className="w-1/2 text-center font-medium text-slate-900">{totalAccounts ?? 0}</td>
          </tr>
          <tr className="border-black border">
            <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Total Principal</th>
            <td className="w-1/2 text-center font-medium text-slate-900">{callfile?.totalPrincipal?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) ?? (0).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
          </tr>
          <tr className="border-black border">
            <th className="w-1/2 py-0.5 bg-blue-600 text-white border-black border">Contactable Rate</th>
            <td className="w-1/2 text-center font-medium text-slate-900">{(Number(filteredPositive) / Number(totalAccounts) * 100).toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
      
      <table className="border border-collapse border-black w-2/6">
        <tbody className="text-center">
          <tr className="border-black border">
            <th className="w-1/3 py-0.5 bg-blue-600 text-white border-black border" rowSpan={2}>Calling Status</th>
            <td className="w-50 py-0.5 bg-blue-600 text-white border-black border font-medium ">Positive Call</td>
            <td className="w-50 border-black border bg-blue-600 text-white font-medium">Negative Calls</td>
          </tr>
          <tr className="border-black border">
            <td className="py-0.5 border text-slate-900 font-medium">{filteredPositive}</td>
            <td className="border text-slate-900 font-medium">{Number(callfile?.totalAccounts) - Number(filteredPositive)}</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead className="border-collapse border border-black">
          <tr>
            <th colSpan={5} className="border border-black bg-blue-600 text-white">Positive Calls Status</th>
          </tr>
        </thead>
        <tbody className="text-center">
          <tr className="text-gray-700">
            <th className="border border-black">Disposition</th>
            <th className="border border-black">Count</th>
            <th className="border border-black">Count Percentage</th>
            <th className="border border-black">Total Principal</th>
            <th className="border border-black">Principal Percentage</th>
          </tr>    
            {
            positiveCalls?.map((x,index) => {
              const reducerPositiveCallsAmount = positiveCalls.length > 0 ? positiveCalls.map(x=> x.amount).reduce((t,v)=> t + v) : 0
              const reducerPositiveCallsCount = positiveCalls.length > 0 ? positiveCalls.map(y=> y.count).reduce((t,v)=> t + v) : 0
              const principalPercent = (x.amount / reducerPositiveCallsAmount) * 100
              const countPersent = (Number(x.count) / Number(reducerPositiveCallsCount)) * 100
              return (
                <tr key={index}>
                  <td className="border border-black">{x.name}</td>
                  <td className="border border-black">{x.count}</td>
                  <td className="border border-black">{countPersent.toFixed(2)}%</td>
                  <td className="border border-black">{x.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
                  <td className="border border-black">{principalPercent.toFixed(2)}%</td>
                </tr>
              )
            })
          }
          <tr className="font-medium">
            <th className="border border-black bg-green-600 text-white">Total</th>
            <td className="border border-black">{filteredPositive}</td>
            <td className="border border-black">100%</td>
            <td className="border border-black">{positiveCalls?.map(x=> x.amount).reduce((t,v)=> t + v ).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) ?? 0}</td>
            <td className="border border-black">100%</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead className="border-collapse border border-black">
          <tr>
            <th colSpan={5} className="border border-black bg-blue-600 text-white">Negative Calls Status</th>
          </tr>
        </thead>
        <tbody className="text-center">
          <tr className="text-gray-700">
            <th className="border border-black">Disposition</th>
            <th className="border border-black">Count</th>
            <th className="border border-black">Count Percentage</th>
            <th className="border border-black">Total Principal</th>
            <th className="border border-black">Principal Percentage</th>
          </tr>    
            {
            negativeCalls?.map((x,index) => {
              const principalPercent = (x.amount / negativeTotalPrincipal) * 100
              const countPersent = (Number(x.count) / Number(totalNegativeCount)) * 100
              return (
                <tr key={index}>
                  <td className="border border-black">{x.name}</td>
                  <td className="border border-black">{x.count}</td>
                  <td className="border border-black">{countPersent.toFixed(2)}%</td>
                  <td className="border border-black">{x.amount.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'})}</td>
                  <td className="border border-black">{principalPercent.toFixed(2)}%</td>
                </tr>
              )
            })
          }
          <tr>
            <td className="border border-black">NO DISPOSITION</td>
            <td className="border border-black">{totalAccounts - Number(allAccountsReportDataCount)}</td>
            <td className="border border-black">{(((totalAccounts - Number(allAccountsReportDataCount)) / totalNegativeCount) * 100).toFixed(2) }%</td>
            <td className="border border-black">{((callfile.totalPrincipal - Number(allAccountsReportDataAmount))).toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) }</td>
            <td className="border border-black">{(((callfile.totalPrincipal - Number(allAccountsReportDataAmount)) / negativeTotalPrincipal) * 100).toFixed(2)}%</td>
          </tr>
          <tr className="font-medium">
            <th className="border border-black bg-green-600 text-white">Total</th>
            <td className="border border-black">{totalNegativeCount}</td>
            <td className="border border-black">100%</td>
            <td className="border border-black">{negativeTotalPrincipal.toLocaleString('en-PH', {style: 'currency',currency: 'PHP'}) || 0}</td>
            <td className="border border-black">100%</td>
          </tr>
        </tbody>
      </table>    
    
    </>
  )
}

export default CallReportTables