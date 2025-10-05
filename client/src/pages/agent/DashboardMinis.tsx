import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "../../redux/store.ts"
import { useLocation } from "react-router-dom"

type DailyCollection = {
  ptp_amount: number
  ptp_count: number
  ptp_yesterday: number
  ptp_kept_amount: number
  ptp_kept_count: number
  ptp_kept_yesterday: number
  paid_amount: number
  paid_count: number
  paid_yesterday: number
}

const AGENT_DAILY_COLLECTIONS = gql`
  query GetAgentDailyCollection {
    getAgentDailyCollection {
      ptp_amount
      ptp_count
      ptp_yesterday
      ptp_kept_amount
      ptp_kept_count
      ptp_kept_yesterday
      paid_amount
      paid_count
      paid_yesterday
    }
  }
`


const AGENT_RPC_COUNT = gql`
  query getAgentRPCCount {
    getAgentRPCCount {
      dailyCount,
      totalCount
    }
  }
`
const AGENT_PRODUCTION = gql`
  query agentProduction {
    agentProduction {
      totalAmountPTP
      totalCountPTP
      totalAmountKept
      totalCountKept
    }
  }
`

type Production = {
  totalAmountPTP: number
  totalCountPTP: number
  totalAmountKept: number
  totalCountKept: number
}

const WEEKLY_AND_MONTLY_COLLECTION = gql`
  query monthlyWeeklyCollected {
    monthlyWeeklyCollected {
      monthly
      weekly
      monthlyCount
      weeklyCount
    }
  }
`

type WeeklyAndMontlyColl = {
  monthly: number
  weekly: number
  monthlyCount: number
  weeklyCount: number
}

const DashboardMinis = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const isAgentDashboard = location.pathname.includes('agent-dashboard')
  const {data:rpcCountData, refetch:rpcCountRefetch} = useQuery<{getAgentRPCCount:{dailyCount: number,totalCount: number}}>(AGENT_RPC_COUNT,{notifyOnNetworkStatusChange: true, skip: !isAgentDashboard})

  const {data,refetch} = useQuery<{getAgentDailyCollection:DailyCollection}>(AGENT_DAILY_COLLECTIONS,{notifyOnNetworkStatusChange: true, skip: !isAgentDashboard})

  const {data:agentProductionData,refetch:agentProductionRefetch} = useQuery<{agentProduction:Production}>(AGENT_PRODUCTION,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true })
  const prod = agentProductionData?.agentProduction || null;

  const {data:collectionsData, refetch:collectionsDataRefetch} = useQuery<{monthlyWeeklyCollected:WeeklyAndMontlyColl}>(WEEKLY_AND_MONTLY_COLLECTION,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true })

  useEffect(()=> {
    const refetching = async()=> {
      await refetch()
      await rpcCountRefetch()
      await agentProductionRefetch()
      await collectionsDataRefetch()
    }
    refetching()
  },[])
  
  return (
    <div className="lg:row-span-2 lg:col-span-3 grid grid-rows-3 grid-cols-3 gap-2">
      <div className="border border-yellow-500 text-yellow-500 bg-yellow-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">RPC <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Daily)</span></h1>
        <div className="text-4xl 2xl:text-5xl h-full flex items-center justify-center">
          <p className="text-center">
            {rpcCountData?.getAgentRPCCount?.dailyCount || 0}
          </p>
        </div>
      </div>
      <div className="border border-red-600 text-red-600 bg-red-300  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">PTP <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Daily)</span></h1>
        <div className=" h-full flex items-end flex-col justify-center lg:text-base 2xl:text-2xl">
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs">Count</p>
            <p className="text-base 2xl:text-xl font-black">
              {data?.getAgentDailyCollection?.ptp_count || 0 }
            </p>
          </div>
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs 2xl:block hidden">Amount</p>
            <p className="text-[0.6rem] 2xl:hidden block">AMT</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium"> { data?.getAgentDailyCollection?.ptp_amount?.toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) || (0).toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) }
          </p>
          </div>
        </div>
      </div>
      <div className="border border-blue-500 text-blue-500 bg-blue-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">KEPT <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Daily)</span></h1>
        <div className=" h-full flex items-end flex-col justify-center lg:text-base 2xl:text-2xl">
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs">Count</p>
            <p className="text-base 2xl:text-xl font-black">
              {data?.getAgentDailyCollection?.ptp_kept_count || 0 }
            </p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Target</p>
            <p className="2xl:hidden block text-[0.6rem]">TGT</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{ userLogged?.targets?.daily?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) }</p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Collected</p>
            <p className="2xl:hidden block text-[0.6rem]">COLL</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{data?.getAgentDailyCollection?.ptp_kept_amount?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0)?.toLocaleString('en-PH',{style: "currency",currency: "PHP"})}</p>
          </div>
          <div className="flex justify-between items-center w-full text-xs">
            <p className="2xl:block hidden">Variance</p>
            <p className="2xl:hidden block text-[0.6rem]">VAR</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{!isNaN(Number(userLogged?.targets?.daily) -  Number(data?.getAgentDailyCollection?.ptp_kept_amount)) ? (Number(userLogged?.targets?.daily) - Number(data?.getAgentDailyCollection?.ptp_kept_amount)).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) : (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) }</p>
          </div>
        </div>
      </div>
      <div className="border border-orange-500 text-orange-500 bg-orange-200  rounded-xl shadow shadow-black/50 flex flex-col p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">Total RPC <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Monthly)</span></h1>
        <div className="text-4xl 2xl:text-5xl h-full flex items-center justify-center">
          <p>
            {rpcCountData?.getAgentRPCCount?.totalCount || 0}
          </p>
        </div>
      </div>
      <div className="border border-pink-500 text-pink-500 bg-pink-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">Total PTP <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Monthly)</span></h1>
        <div className=" h-full flex items-end flex-col justify-center lg:text-base 2xl:text-2xl">
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs">Count</p>
            <p className="text-base 2xl:text-xl font-black">
              {prod?.totalCountPTP || 0 }
            </p>
          </div>
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs 2xl:block hidden">Amount</p>
            <p className="text-[0.6rem] 2xl:hidden block">AMT</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium"> { prod?.totalAmountPTP?.toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) || (0).toLocaleString('en-PH',{style: "currency",currency: 'PHP'}) }
          </p>
          </div>
        </div>
      </div>
      <div className="border border-sky-500 text-sky-500 bg-sky-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">KEPT <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Weekly)</span></h1>
        <div className=" h-full flex items-end flex-col justify-center lg:text-base 2xl:text-2xl">
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs">Count</p>
            <p className="text-base 2xl:text-xl font-black">
              {collectionsData?.monthlyWeeklyCollected?.weeklyCount || 0 }
            </p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Target</p>
            <p className="2xl:hidden block text-[0.6rem]">TGT</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{ userLogged?.targets?.weekly?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) }</p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Collected</p>
            <p className="2xl:hidden block text-[0.6rem]">COLL</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{collectionsData?.monthlyWeeklyCollected?.weekly?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0)?.toLocaleString('en-PH',{style: "currency",currency: "PHP"})}</p>
          </div>
          <div className="flex justify-between items-center w-full text-xs">
            <p className="2xl:block hidden">Variance</p>
            <p className="2xl:hidden block text-[0.6rem]">VAR</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">
              {
                !isNaN(Number(userLogged?.targets?.weekly) -  Number(collectionsData?.monthlyWeeklyCollected?.weekly)) ? (Number(userLogged?.targets?.weekly) - Number(collectionsData?.monthlyWeeklyCollected?.weekly)).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) : (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) 
              }
            </p>
          </div>
        </div>
      </div>
      <div className="col-span-3 flex gap-2 justify-center">

        {/* <div className="border border-green-500 text-green-500 bg-green-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2">
          <h1 className="lg:text-xs 2xl:text-base font-bold">PTP to KEPT <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Monthly)</span></h1>
          <div>
            {}
          </div>
        </div> */}

        <div className="border border-teal-500 text-teal-500 bg-teal-200  rounded-xl shadow shadow-black/50 flex flex-col p-1 2xl:p-2 w-1/2">
        <h1 className="lg:text-xs 2xl:text-base font-bold">KEPT <span className="lg:text-[0.7em] 2xl:text-xs font-normal">(Monthly)</span></h1>
        <div className=" h-full flex items-end flex-col justify-center lg:text-base 2xl:text-2xl">
          <div className="flex justify-between items-center w-full">
            <p className="text-[0.6rem] 2xl:text-xs">Count</p>
            <p className="text-base 2xl:text-xl font-black">
              {collectionsData?.monthlyWeeklyCollected?.monthlyCount || 0 }
            </p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Target</p>
            <p className="2xl:hidden block text-[0.6rem]">TGT</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{ userLogged?.targets?.monthly?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) }</p>
          </div>
          <div className="flex justify-between items-center w-full lg:text-[0.6rem] 2xl:text-xs">
            <p className="2xl:block hidden">Collected</p>
            <p className="2xl:hidden block text-[0.6rem]">COLL</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">{collectionsData?.monthlyWeeklyCollected?.monthly?.toLocaleString('en-PH',{style: "currency",currency: "PHP"}) || (0)?.toLocaleString('en-PH',{style: "currency",currency: "PHP"})}</p>
          </div>
          <div className="flex justify-between items-center w-full text-xs">
            <p className="2xl:block hidden">Variance</p>
            <p className="2xl:hidden block text-[0.6rem]">VAR</p>
            <p className="lg:text-[0.6rem] 2xl:text-base font-medium">
              {
                !isNaN(Number(userLogged?.targets?.monthly) -  Number(collectionsData?.monthlyWeeklyCollected?.monthly)) ? (Number(userLogged?.targets?.monthly) - Number(collectionsData?.monthlyWeeklyCollected?.monthly)).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) : (0).toLocaleString('en-PH',{style: "currency",currency: "PHP"}) 
              }
            </p>
          </div>
        </div>
      </div>
      </div>

   
  </div>
  )
}

export default DashboardMinis