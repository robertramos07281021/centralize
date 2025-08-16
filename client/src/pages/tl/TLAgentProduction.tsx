// import { useQuery } from "@apollo/client"
// import gql from "graphql-tag"
// import { useEffect, useMemo } from "react"
// import { IoMdArrowDown,IoMdArrowUp  } from "react-icons/io";
// import { HiOutlineMinusSm } from "react-icons/hi";
// import { useAppDispatch } from "../../redux/store";
// import { setServerError } from "../../redux/slices/authSlice";

// type AgentDailies = {
//   user: string
//   count: number
//   ptp: number
//   pk: number
//   ac: number
//   rpc: number
//   y_ptp: number
//   y_pk: number
//   y_ac: number
// }

// const AGENT_DAILY_PROD = gql`
//   query AgentDispoDaily {
//     agentDispoDaily {
//       user
//       count
//       ptp
//       pk
//       ac
//       rpc
//       y_ptp
//       y_pk
//       y_ac
//     }
//   }
// `

// type Targets = {
//   daily: number
//   weekly: number
//   monthly: number
// }

// type Agent = {
//   _id: string
//   name: string
//   user_id: string
//   buckets: string[]
//   type: string
//   targets: Targets
// }

// const GET_DEPARTMENT_AGENT = gql`
//   query findAgents {
//     findAgents {
//       _id
//       name
//       user_id
//       buckets
//       type
//       targets {
//         daily
//         weekly
//         monthly
//       }
//     }
//   }
// `

// type Bucket = {
//   id:string
//   name: string
// }

// const TL_BUCKET = gql`
//   query getAllBucket {
//     getAllBucket {
//       id
//       name
//     }
//   }
// `
type ComponentProp = {
  bucket: string | null | undefined
}

const TLAgentProduction:React.FC<ComponentProp> = ({bucket}) => {
  console.log(bucket)

  // const dispatch = useAppDispatch()
  // const {data:agentDailyProd, refetch} = useQuery<{agentDispoDaily:AgentDailies[]}>(AGENT_DAILY_PROD)
  // const {data:agentBucketData, refetch:findAgentRefetch} = useQuery<{findAgents:Agent[]}>(GET_DEPARTMENT_AGENT)
  // const {data:tlBucketData, refetch:getDeptBucketRefetch} = useQuery<{getAllBucket:Bucket[]}>(TL_BUCKET)

  // useEffect(()=> {
  //   const timer = setTimeout(async()=> {
  //     try {
  //       await refetch()
  //       await findAgentRefetch()
  //       await getDeptBucketRefetch()
  //     } catch (error) {
  //       dispatch(setServerError(true))
  //     }
  //   })
  //   return () => clearTimeout(timer)
  // },[refetch,findAgentRefetch,getDeptBucketRefetch])

  // const bucketObject:{[key:string]:string} = useMemo(()=> {
  //   const tlBuckets = tlBucketData?.getAllBucket || []
  //   return Object.fromEntries(tlBuckets.map(e=> [e.id, e.name]))
  // },[tlBucketData])

  return (
    <div className='col-span-5 border border-slate-400 flex flex-col bg-white rounded-xl p-2 overflow-hidden'>
      <div className=' bg-white font-bold text-base text-slate-700'>Agent Production <span className="text-sm font-medium">(Daily)</span></div>
      <div className="w-full h-full overflow-auto relative">
        <div className='sticky min-w-12/8 top-0 grid grid-cols-16 text-base font-medium text-slate-600 bg-blue-100 py-1 items-center z-30'>
          <div className='col-span-2 pl-2 sticky left-0 bg-blue-100'>Name</div>
          <div>Bucket</div>
          <div>Contacted(RPC)</div>
          <div>Contacted(NRPC)</div>
          <div>Contact Rate</div>
          <div>PTP Count</div>
          <div>PTP Principal</div>
          <div>PTP Rate</div>
          <div>K Count</div>
          <div>K Principal</div>
          <div>BP Count</div>
          <div>BP Principal</div>
          <div>BP Rate</div>
          <div >Coll Count</div>
          <div >Coll Principal</div>
        </div>
      </div>
    </div>
  )
}

export default TLAgentProduction