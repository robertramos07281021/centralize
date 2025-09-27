import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";


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
type RateProps = {
  label: string;
  current: number;
  previous: number;
  color: string;
  count: number
};

const AGENT_RPC_COUNT = gql`
  query getAgentRPCCount {
    getAgentRPCCount {
      count
    }
  }
`

const RateIcon = ({ rate }: { rate: number }) => {
  if (isNaN(rate) || rate === -100 || rate === Infinity) {
    return <HiOutlineMinusSm className="text-blue-500 text-xs lg:text-base " />;
  }
  return rate > 0 ? (
    <IoMdArrowUp className="text-green-500 text-xs lg:text-base "  />
  ) : (
    <IoMdArrowDown className="text-red-500 text-xs lg:text-base " />
  );
};

const StatCard = ({ label, current, previous, color, count }: RateProps) => {
  const rate =
    previous === 0 ? -100 : ((current - previous) / previous) * 100;
  const formattedRate =
    isNaN(rate) || rate === -100 || rate === Infinity
      ? ""
      : `${rate.toFixed(2)}%`;
  const formattedValue =
    current > 0
      ? current.toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
        })
      : "-";

    const colorMap:{[key:string]:string} = {
      orange: "bg-orange-200 border-orange-400 text-orange-500",
      green: "bg-green-200 border-green-400 text-green-500",
      blue: "bg-blue-200 border-blue-400 text-blue-500",
    }

  return (
    <div
      className={` rounded-xl border ${colorMap[color]} p-2 shadow shadow-black/20 flex flex-col `}
    >
      <div className="flex gap-2">
        <h1 className="text-xs lg:text-sm font-bold">
          {label} <span className="text-[0.6em] lg:text-[0.7em]">(Daily)</span>
        </h1>

      </div>
      <div className="h-full flex flex-col justify-center">
        <div className="flex flex-col items-center">
          <div className="flex text-sm items-center justify-between w-full gap-1">
            <div >
              <div className="flex justify-between">
                <RateIcon rate={rate} />
                <span className="text-[0.7em] lg:text-xs">{formattedRate}</span>
              </div>
              <div>{count}</div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm lg:text-lg">{formattedValue}</h1>
              <h1 className="text-end text-[0.7em] lg:text-xs font-bold">Amount</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DailyCollections() {
  const location = useLocation()
  const isAgentDashboard = location.pathname.includes('agent-dashboard')
  const {data,refetch} = useQuery<{getAgentDailyCollection:DailyCollection}>(AGENT_DAILY_COLLECTIONS,{notifyOnNetworkStatusChange: true, skip: !isAgentDashboard})
  const {data:rpcCountData, refetch:rpcCountRefetch} = useQuery<{getAgentRPCCount:{count: number}}>(AGENT_RPC_COUNT,{notifyOnNetworkStatusChange: true, skip: !isAgentDashboard})

  const stats = data?.getAgentDailyCollection;

  useEffect(()=> {
    const timer = async()=> {
      await refetch()
      await rpcCountRefetch()
    }
    timer()
  },[refetch, rpcCountRefetch])

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className={` rounded-xl border bg-yellow-200 border-yellow-400 text-yellow-500 p-2 shadow shadow-black/20 flex flex-col `}>
        <div className="flex gap-2">
          <h1 className="text-xs lg:text-sm font-bold">
            RPC
          </h1>
        </div>
        <div className="h-full flex justify-between items-center">
          <h1 className="text-[0.7em] lg:text-xs font-medium">Count</h1>
          <p className="text-7xl font-bold">{rpcCountData?.getAgentRPCCount.count}</p>
        </div>
      </div>

      <StatCard
        label="PTP"
        current={stats?.ptp_amount || 0}
        previous={stats?.ptp_yesterday || 0}
        color="orange"
        count={stats?.ptp_count || 0}
      />

      <StatCard
        label="Kept"
        current={stats?.ptp_kept_amount || 0}
        previous={stats?.ptp_kept_yesterday || 0}
        count={stats?.ptp_kept_count || 0}
        color="green"
      />
    </div>
  )
}

