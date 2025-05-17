import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import React from "react"

interface getAomDashboardDispoCollections {
  bucket: string
  ptp: number
  ptp_amount: number
  ptp_kept: number
  ptp_kept_amount: number
  amount_collected: number
  amount_collected_amount: number
}


const AOM_DASHBOARD_COLLECTIONS = gql`
  query GetAomDashboardDispoCollections {
    getAomDashboardDispoCollections {
      bucket
      ptp
      ptp_amount
      ptp_kept
      ptp_kept_amount
      amount_collected
      amount_collected_amount
    }
  }
`

const AOM_DASHBOARD_COLLECTIONS_TODAY = gql`
  query GetAomDashboardDispoCollectionsToday {
    getAomDashboardDispoCollectionsToday {
      bucket
      ptp
      ptp_amount
      ptp_kept
      ptp_kept_amount
      amount_collected
      amount_collected_amount
    }
  }
`

interface Bucket {
  id: string
  name: string
}

interface AomBucket {
  dept: string
  buckets: Bucket[]
}

const AOM_BUCKET = gql`
  query FindAomBucket {
    findAomBucket {
      dept
      buckets {
        id
        name
      }
    }
  }


`


const AomDashboard = () => {
  const {data:AOMDashboardData} = useQuery<{getAomDashboardDispoCollections:getAomDashboardDispoCollections[]}>(AOM_DASHBOARD_COLLECTIONS)
  const {data:AOMDashboardTodayData} = useQuery<{getAomDashboardDispoCollectionsToday:getAomDashboardDispoCollections[]}>(AOM_DASHBOARD_COLLECTIONS_TODAY)
  const {data:AOMBucketData} = useQuery<{findAomBucket:AomBucket[]}>(AOM_BUCKET)

  return (
    <div className="h-full p-2 flex flex-col bg-slate-200 gap-2 relative">
      <div className="w-full border bg-white border-slate-400 rounded-xl p-2  ">
        
        <table className="table-auto">
          <thead className="text-slate-500">
            <tr>
              <th rowSpan={3} className="text-xs  border sticky top-0 bg-white ">Buckets</th>
              <th colSpan={6} className="border">Total</th>
              <th colSpan={6} className="border">Today</th>
            </tr>
            <tr className="text-[0.8em] ">
         
              <th colSpan={2} className=" border py-1">PTP</th>
              <th colSpan={2} className="border">PTP Kept</th>
              <th colSpan={2} className="border">PAID</th>
              <th colSpan={2} className=" border py-1">PTP</th>
              <th colSpan={2} className="border">PTP Kept</th>
              <th colSpan={2} className="border">PAID</th>
            </tr>
            <tr className="text-[0.6em] text-center">
              <td className="border">Count</td>
              <td className="border">Amount</td>
              <td className="border">Count</td>
              <td className="border">Amount</td>
              <td className="border">Count</td>
              <td className="border">Amount</td>
              <td className="border">Count</td>
              <td className="border">Amount</td>
              <td className="border">Count</td>
              <td className="border">Amount</td>
              <td className="border">Count</td>
              <td className="border">Amount</td>
            </tr>
          </thead>
          <tbody>
            {
              AOMBucketData?.findAomBucket.map((ab,index) => {
                return (<React.Fragment key={index}>
                  <tr>
                    <th className="text-xs text-slate-600 border py-1 bg-blue-100" colSpan={13}> {ab.dept}</th>
                  </tr>
                  {
                    ab.buckets.map(b => {
                      const findCollections = AOMDashboardData?.getAomDashboardDispoCollections.find(e=> e.bucket === b.id)
                      const findCollectionsToday = AOMDashboardTodayData?.getAomDashboardDispoCollectionsToday.find(e => e.bucket === b.id)
                      return (
                        <tr key={b.id} className="text-xs text-slate-600 border">
                          <th className="text-[0.9em] px-10">{b.name}</th>
                          <td className=" text-center border px-5 py-0.5">{findCollections?.ptp || 0}</td>
                          <td className=" border text-center px-5 py-0.5">{findCollections?.ptp_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                          <td className=" text-center border px-5 py-0.5">{findCollections?.ptp_kept || 0}</td>
                          <td className=" border text-center px-5 py-0.5">{findCollections?.ptp_kept_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                          <td className=" text-center border px-5 py-0.5">{findCollections?.amount_collected || 0}</td>
                          <td className="border text-center px-5 py-0.5">{findCollections?.amount_collected_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                          <td className=" text-center border px-5 py-0.5">{findCollectionsToday?.ptp_kept || 0}</td>
                          <td className="border text-center px-5 py-0.5">{findCollectionsToday?.ptp_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                          <td className=" text-center border px-5 py-0.5">{findCollectionsToday?.ptp_kept || 0}</td>
                          <td className=" border text-center px-5 py-0.5">{findCollectionsToday?.ptp_kept_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                          <td className=" text-center border px-5 py-0.5">{findCollectionsToday?.amount_collected || 0}</td>
                          <td className="border text-center px-5 py-0.5">{findCollectionsToday?.amount_collected_amount.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) || (0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</td>
                       
                        </tr>
                      )
                    })
                  }
                  </React.Fragment>
                )
              })
            }
          </tbody>
        </table>

      </div>
      
    </div>
  )
}

export default AomDashboard
