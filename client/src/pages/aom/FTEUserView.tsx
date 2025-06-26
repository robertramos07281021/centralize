import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useState } from "react"
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

interface Dept {
  _id: string
  branch: string
  name: string
}

interface User {
  isOnline: boolean
  user_id: string
  name: string
  buckets: string[]
}

interface AOMFTE {
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

interface Bucket {
  _id: string
  name: string
}

interface Object {
  [key:string] : string
}


const FTEUserView = () => {
  const {data:AOMFTEData} = useQuery<{getAOMCampaignFTE:AOMFTE[]}>(AOM_CAMPAIGN_FTE)
  const {data:allBucket} = useQuery<{getAllBucket:Bucket[]}>(GET_ALL_BUCKET)
  const [bucketObject,setBucketObject] = useState<Object>({})
  
  useEffect(()=> {
    if(allBucket) {
      const newObject:Object= {}
      allBucket.getAllBucket.forEach(e=> {
        newObject[e._id] = e.name
      })
      setBucketObject(newObject)
    }
  },[allBucket])

  console.log(bucketObject)

  return (
    <div className="flex w-full h-full overflow-hidden  gap-2 p-2">
      <div className="flex flex-wrap h-full w-full overflow-y-auto gap-2 justify-center py-5">
     
      {
        AOMFTEData?.getAOMCampaignFTE.map((e)=> {
          return (
            <div key={e.department._id} className="border h-150 w-150 rounded-md border-slate-300 bg-white flex flex-col p-2 overflow-hidden shadow shadow-black/30">
              <h1 className="font-bold text-gray-600">{e.department.name}</h1>
              <div className="grid grid-cols-6 bg-slate-100 px-2 font-medium text-gray-500">
                <div className="col-span-3">Name</div>
                <div>SIP ID</div>
                <div>Bucket</div>
                <div>Status</div>
              </div>
              <div className="h-full w-full  overflow-y-auto flex flex-col px-2">
                {
                  e.users.map((u,index)=> {
                    return (
                      <div className="grid grid-cols-6 text-sm py-0.5 even:bg-slate-50 text-gray-500" key={index}>
                        <div className="col-span-3 capitalize">{u.name}</div>
                        <div>{u.user_id}</div>
                        <div>{u.buckets.map(e=> bucketObject[e]).join(', ')}</div>
                        <div>
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