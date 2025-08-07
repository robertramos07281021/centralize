
type RFD = {
  _id: string
  count: number
}

type ComponentProp = {
  RFD: RFD[]
}

const RFDReportTables:React.FC<ComponentProp> = ({RFD}) => {
  return (
     <table className="w-1/2">
      <thead>
        <tr>
          <th colSpan={3} className="border border-black bg-blue-600 text-white">EOD</th>
        </tr>
      </thead>
      <tbody className="text-center">
        <tr className="text-gray-700">
          <th className="border border-black">Reason For Delay</th>
          <th className="border border-black">Count</th>
          <th className="border border-black">Percentage</th>
        </tr>
          {
            RFD.map((x,index)=> {
              const filter = RFD.filter(x=> x._id !== null)
              const totals = filter.length > 0 ? filter.map(x=> x.count).reduce((t,v)=> t + v) : 0
              const percents = (x.count / totals) * 100
              return x._id && (
                <tr key={index} className="text-gray-700 text-center">
                  <td className="border border-black">{x._id}</td>
                  <td className="border border-black">{x.count}</td>
                  <td className="border border-black">{percents.toFixed(2)}%</td>
                </tr> 
              )
            })
          }
          <tr className="font-medium">
            <td className="border border-black bg-green-600 text-white">Total</td>
            <td className="border border-black">{RFD.length > 1 ?  RFD?.filter(x=> x._id !== null)?.map(x=> x.count)?.reduce((t,v)=> t + v) : 0}</td>
            <td className="border border-black">100%</td>
          </tr>
      </tbody>
    </table>
  )
}

export default RFDReportTables