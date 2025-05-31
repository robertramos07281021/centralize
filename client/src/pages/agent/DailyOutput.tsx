import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"

type Disposition = {
  _id: string
  count : number
}
const TODAY_DISPOSITION = gql`
  query GetProductions {
    getProductions {
      _id
      count
    }
  }
`

type DispositionType = {
  id: string
  code: string
  name: string
}
const DISPO_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

export default function DailyOutput () {
  const {data:dispotypeData, refetch:DispoTypeRefetch} = useQuery<{getDispositionTypes:DispositionType[]}>(DISPO_TYPES)

  const {data:productionData, refetch:ProductionRefetch} = useQuery<{getProductions:Disposition[]}>(TODAY_DISPOSITION)

  useEffect(()=> {
    ProductionRefetch()
    DispoTypeRefetch()
  },[ProductionRefetch,DispoTypeRefetch])


  return (
    <>
      <h1 className="text-lg font-medium text-slate-500">Daily Production</h1>
      <div className="flex flex-col lg:h-98 2xl:h-115 overflow-y-auto relative" >
        <div className="grid grid-cols-3 text-center text-sm font-medium text-slate-400 sticky top-0  py-1 bg-blue-100">
          <div>Type</div>
          <div>Code</div>
          <div>Count</div>
        </div>
        {
          dispotypeData?.getDispositionTypes.map((e) => {
            const findDispoProd = productionData?.getProductions.find(p=> p._id === e.id )
            return findDispoProd && (
              <div key={e.id} className="grid grid-cols-3 text-center text-xs text-slate-400 sticky top-0  py-1 odd:bg-slate-100">
                <div className="font-medium">{e.name}</div>
                <div>{e.code}</div>
                <div>{findDispoProd.count}</div>
              </div>
            )
          })
        }
 
      </div>
    </>
  )
}
