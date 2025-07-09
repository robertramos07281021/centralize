import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useMemo } from "react"
import { FaCircle } from "react-icons/fa";


const AOM_CAMPAIGN_FTE = gql`
  query getAOMCampaignFTE {
    getAOMCampaignFTE {
      department {
        _id
        branch
        name
      }
      users {
        isOnline
        user_id
        name
        buckets
      }
    }
  }
`

type Dept = {
  _id: string
  branch: string
  name: string
}

type AOMFTE = {
  department:Dept
  users: User[]
}


const GET_ALL_BUCKET = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`

type Bucket = {
  _id: string
  name: string
}


const ACCOUNT_HELPER = gql`
  query getHelperAgent {
    getHelperAgent {
      name
      buckets
      departments
      isOnline
      user_id
    }
  }
`

type User = {
  name: string
  buckets: string[]
  departments: string[]
  isOnline: boolean
  user_id: string
}

const GET_AOM_CAMPAIGN = gql`
  query getAomDept {
    getAomDept {
      name
      _id
    }
  }
`
type Campaign = {
  name: string
  _id: string
}

const FTEUserView = () => {
  const {data:AOMFTEData} = useQuery<{getAOMCampaignFTE:AOMFTE[]}>(AOM_CAMPAIGN_FTE)
  const {data:allBucket} = useQuery<{getAllBucket:Bucket[]}>(GET_ALL_BUCKET)
  const {data:aomCampaign} = useQuery<{getAomDept:Campaign[]}>(GET_AOM_CAMPAIGN)
  
  const campaignObject:{[key:string]:string} = useMemo(()=> {
    const campaign = aomCampaign?.getAomDept || []
    return Object.fromEntries(campaign.map((c)=> [c._id, c.name]))
  },[aomCampaign])

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const bucketArray = allBucket?.getAllBucket || []
    return Object.fromEntries(bucketArray.map((ba)=> [ba._id, ba.name]))
  },[allBucket])

  const {data:helperData} = useQuery<{getHelperAgent:User[]}>(ACCOUNT_HELPER)

  return (
    <div className="flex w-full h-full overflow-hidden  gap-2 p-2">
      <div className="flex flex-wrap h-full w-full overflow-y-auto gap-2 justify-center py-5">
      {
        (helperData && helperData?.getHelperAgent.length > 0) && 
        <div className="border h-150 w-150 rounded-lg border-slate-300 bg-white flex flex-col p-2 overflow-hidden shadow-sm shadow-black/20">
          <h1 className="font-bold text-gray-600">HELPER</h1>
          <div className="grid grid-cols-8 bg-slate-100 px-2 font-medium text-gray-500">
            <div className="col-span-3">Name</div>
            <div>SIP ID</div>
            <div>Bucket</div>
            <div className="col-span-2">Campaign</div>
            <div>Status</div>
          </div>
          <div className="h-full w-full overflow-y-auto flex flex-col px-2">
            {
              helperData.getHelperAgent.map((ha)=> {
                return (
                  <div className="cursor-default grid grid-cols-8 text-sm py-0.5 even:bg-slate-50 text-gray-500">
                    <div className="col-span-3 capitalize">{ha.name}</div>
                    <div>{ha.user_id}</div>
                    <div className="truncate pr-2 " title={ha.buckets.map((e)=> bucketObject[e]).join(', ')}>{ha.buckets.map((e)=> bucketObject[e]).join(', ')}</div>
                    <div className="col-span-2 truncate pr-2" title={ha.departments.map(e=> campaignObject[e]).join(', ')}>{ha.departments.map(e=> campaignObject[e]).join(', ')}</div>
                    <div className="flex items-center">
                      <FaCircle className={`${ha.isOnline ? "text-green-400" : "text-gray-700"} `} />
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      }
      {
        AOMFTEData?.getAOMCampaignFTE.map((e)=> {
          return (
            <div key={e.department._id} className="border h-150 w-150 rounded-lg border-slate-300 bg-white flex flex-col p-2 overflow-hidden shadow-sm shadow-black/20">
              <h1 className="font-bold text-gray-600">{e.department.name}</h1>
              <div className="grid grid-cols-6 bg-slate-100 px-2 font-medium text-gray-500">
                <div className="col-span-3">Name</div>
                <div>SIP ID</div>
                <div>Bucket</div>
                <div>Status</div>
              </div>
              <div className="h-full w-full overflow-y-auto flex flex-col px-2">
                {
                  e.users.map((u,index)=> {
                    return (
                      <div className="grid grid-cols-6 text-sm py-0.5 even:bg-slate-50 text-gray-500" key={index}>
                        <div className="col-span-3 capitalize">{u.name}</div>
                        <div>{u.user_id}</div>
                        <div>{u.buckets.map(e=> bucketObject[e]).join(', ')}</div>
                        <div className="flex items-center">
                          <FaCircle className={`${u.isOnline ? "text-green-400" : "text-gray-700"} `} />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>
          )
        })
      }
      </div>
    </div>
  )
}

export default FTEUserView