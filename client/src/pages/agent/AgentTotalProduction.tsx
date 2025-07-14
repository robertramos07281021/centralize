import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const AGENT_PRODUCTION = gql`
  query agentProduction {
    agentProduction {
      dtcCurrent
      dtcPrevious
      ytCurrent
      ytPrevious
    }
  }
`

const WEEKLY_AND_MONTLY_COLLECTION = gql`
  query monthlyWeeklyCollected {
    monthlyWeeklyCollected {
      monthly
      weekly
    }
  }
`

type Production = {
  dtcCurrent: number
  dtcPrevious: number
  ytCurrent: number
  ytPrevious: number
}

type Divition = {
  label: string;
  current: number;
  previous: number;
  color: keyof typeof colorsObject;
}

const colorsObject:{[key:string]:string} = {
  purple: 'border-purple-500 text-purple-500 bg-purple-200',
  teal: 'border-teal-500 text-teal-500 bg-teal-200'
}

const RateIcon = ({ rate }: { rate: number }) => {
  if (isNaN(rate) || rate === -100 || rate === Infinity) {
    return <HiOutlineMinusSm className="text-blue-500" />;
  }
  return rate > 0 ? (
    <IoMdArrowUp className="text-green-500" />
  ) : (
    <IoMdArrowDown className="text-red-500" />
  );
};

const Divition = ({label, current, previous, color }: Divition ) => {
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

  return (
    <div className={`rounded-xl border ${colorsObject[color]} p-2 shadow shadow-black/20 flex flex-col`}>
      <h1 className="lg:text-xs 2xl:text-sm font-bold">
        {label} <span className="lg:text-[0.7em] 2xl:text-xs"></span>
      </h1>
       <div className="h-full flex flex-col justify-center">
        <div className="flex justify-between items-center">
          <h1 className="flex text-sm items-center gap-1">
            <RateIcon rate={rate} />
            <span className="text-xs">{formattedRate}</span>
          </h1>
          <h1 className="text-lg">{formattedValue}</h1>
        </div>
        <h1 className="text-end text-xs font-bold">Amount</h1>
      </div>
    </div>
  )
}

export default function AgentTotalProduction () {
  const {data,refetch} = useQuery<{agentProduction:Production}>(AGENT_PRODUCTION)
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const prod = data?.agentProduction;
  const {data:collectionsData} = useQuery<{monthlyWeeklyCollected:{monthly: number, weekly: number}}>(WEEKLY_AND_MONTLY_COLLECTION)

  useEffect(()=> {
    refetch()
  },[refetch])

  return (
    <div className="grid grid-cols-2  gap-2">
      <Divition 
        label="Daily Total Collected"
        previous={prod?.dtcPrevious || 0}
        current={prod?.dtcCurrent || 0}
        color="purple"
      />
      <div className={`rounded-xl border p-2 ${colorsObject["teal"]} shadow shadow-black/20 flex flex-col`}>
        <h1 className="lg:text-xs 2xl:text-sm font-bold flex justify-between">
          <p className="lg:text-[0.7em] 2xl:text-xs">Collected</p>
          <p className="lg:text-[0.7em] 2xl:text-xs">Targets</p>
        </h1>
        <div className="h-full flex flex-col justify-center">
     
          <div className="flex justify-end items-center gap-2 text-sm">
            <p className="text-xs font-medium">(Daily)</p>
            <div>{userLogged.targets.daily.toLocaleString("en-PH", {style: "currency",currency: "PHP",}) || "-"}</div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="text-xs">{collectionsData?.monthlyWeeklyCollected?.weekly?.toLocaleString("en-PH", {style: "currency",currency: "PHP",}) || "-"}</div>
            <div className="flex jsutify-center items-center text-sm">
              <p className="text-xs font-medium">(Weekly)</p>
              <div>{userLogged.targets.weekly.toLocaleString("en-PH", {style: "currency",currency: "PHP",}) || "-"}</div>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="text-xs">{collectionsData?.monthlyWeeklyCollected?.monthly?.toLocaleString("en-PH", {style: "currency",currency: "PHP",})}</div>
            <div className="flex jsutify-center items-center text-sm">
              <p className="text-xs font-medium">(Monthly)</p>
              <div>{userLogged.targets.monthly.toLocaleString("en-PH", {style: "currency",currency: "PHP",}) || "-"}</div>
            </div>
          </div>
          <h1 className="text-end text-xs font-bold">Amount</h1>
        </div>
      </div>
    </div>
  )
}

