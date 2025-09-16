import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../../redux/store.ts"
import { setSelectedCampaign } from "../../redux/slices/authSlice.ts"
import { Link, useLocation } from "react-router-dom"

const BUCKET_AGENT = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      user_id
      buckets
    }
  }
`

const GET_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
    }
  }
`

type Bucket = {
  _id: string
  name: string
}

type User = {
  _id: string
  name: string
  user_id: string
  buckets: string[]

}

const QAAgentViews = () => {
  const {selectedCampaign} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const isQADashboard = location.pathname !== '/qa-agents-dashboard'

  const {data,refetch:bucketRefetching} = useQuery<{getTLBucket:Bucket[]}>(GET_BUCKET,{skip: isQADashboard, notifyOnNetworkStatusChange: true })
  const {data:agentData, refetch} = useQuery<{getBucketUser:User[]}>(BUCKET_AGENT,{variables: {bucketId: selectedCampaign}, skip: isQADashboard, notifyOnNetworkStatusChange: true})

  const newMapBucjket = useMemo(()=> {
    const newData = data?.getTLBucket || []
    return Object.fromEntries(newData.map(d => [d._id,d.name]))
  },[data])

  useEffect(()=> {
    const refetching = async()=> {
      await refetch()
      await bucketRefetching()
    }
    refetching()
  },[refetch,bucketRefetching])

  const dispatch = useAppDispatch()

  return (
    <div className="overflow-hidden flex h-full w-full flex-col">
      <div className="flex items-center justify-center p-2">
        {
          data && data?.getTLBucket?.length > 0 &&
          <select 
            name="campaign" 
            id="campaign"
            className="w-96 text-center border border-slate-500 rounded py-1.5"
            onChange={(e)=> {
              const value = e.target.value.trim() === "" ? null : e.target.value
              dispatch(setSelectedCampaign(value))
              }
            }
            value={selectedCampaign || ""}
            >
              <option value="">Selecte Campaign</option>
            {
              data.getTLBucket.map(bucket => 
                <option value={bucket._id} key={bucket._id}>{bucket.name}</option>
              )
            }
          </select>
        }
      </div>
      <div className="h-full w-full  p-5 overflow-hidden flex">
        <div className="w-full h-full overflow-auto">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 bg-blue-100">
              <tr >
                <td className="px-2 py-1">Name</td>
                <td className="px-2 py-1">SIP</td>
                <td className="px-2 py-1">Buckets</td>
              </tr>
            </thead>
            <tbody>
              {
                agentData?.getBucketUser.map(user => 
                
                  <tr key={user._id} className="even:bg-blue-50 cursor-pointer hover:bg-blue-200 select-none">
                    <td className="capitalize ">
                      <Link to='/agent-recordings' state={user._id} className="w-full h-full px-2 py-1 ">
                        {user.name}
                      </Link>
                      </td>
                    <td className="flex">
                      <Link to='/agent-recordings' className={`w-full h-full px-2 ${user.user_id ? "py-1" : "py-4"}  `}  state={user._id}>
                        {user.user_id}
                      </Link>
                    </td>
                    <td>
                      <Link to="/agent-recordings" className="w-full h-full px-2 py-1">
                        {
                          user.buckets.map(b => 
                            newMapBucjket[b]
                          ).join(', ')
                        }
                      </Link>
                    </td>
                  </tr>
                )
              }
            
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QAAgentViews