import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLocation } from "react-router-dom";


const AGENT_PRODUCTION = gql`
  query agentProduction {
    agentProduction {
      totalAmountUnsuccessPTP
      totalCountUnsuccessPTP
      totalAmountSuccessPTP
      totalCountSuccessPTP
      totalAmountKept
      totalCountKept
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
  totalAmountUnsuccessPTP: number
  totalCountUnsuccessPTP: number,
  totalAmountSuccessPTP: number,
  totalCountSuccessPTP: number
  totalAmountKept: number
  totalCountKept: number
}

type Divition = {
  label: string;
  current: number;
  previous: number;
  target: number;
  color: keyof typeof colorsObject;
}

const colorsObject:{[key:string]:string} = {
  purple: 'border-purple-500 text-purple-500 bg-purple-200',
  teal: 'border-teal-500 text-teal-500 bg-teal-200',
  blue: 'border-blue-500 text-blue-500 bg-blue-200'
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

const Division = ({label, current, previous, color, target }: Divition ) => {
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


  const targetPercentage = (current / target )*100


  const checkIfNumber = isNaN(targetPercentage) || targetPercentage === Infinity ? "-" : `${targetPercentage.toFixed(2)}%`

  const theVariance = target - current
  const variancePercentage = (theVariance / target) * 100
    const checkIfNumberVariacePercent = isNaN(variancePercentage) || variancePercentage === Infinity ? "" : `${variancePercentage.toFixed(2)}%`


  return (
    <div className={`rounded-xl border ${colorsObject[color]} p-2 shadow shadow-black/20 flex flex-col`}>
      <h1 className="text-xs lg:text-sm font-bold">
        {label}
      </h1>
      <div className="flex justify-between pt-2 items-center">
        <h1>C</h1>
        <h1 className="text-4xl">{checkIfNumber}</h1>
      </div>
      <h1 className="text-xs flex justify-end">V - {checkIfNumberVariacePercent}</h1>
      <div className="h-full flex flex-col justify-center">
        <div className="flex justify-between item-center">
          <h1 className="text-sm font-medium">Target</h1>
          <h1 className="text-sm">{target.toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
        })}</h1>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium">Collected</h1>
        <div className="flex">
          <h1 className="flex text-sm items-center gap-1">
            {
              previous !== 0 &&
              <RateIcon rate={rate} />
            }
            {
              previous !== 0 &&
              <span className="text-xs">{formattedRate}</span>
            }
          </h1>
            <h1 className="lg:text-sm">{formattedValue}</h1>
        </div>
        </div>
        <div className="flex justify-between item-center">
          <h1 className="text-sm font-medium">Variance</h1>
          <div className="flex items-center">
            <h1 className="text-sm">{theVariance.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
          })}</h1>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AgentTotalProduction () {
  const location = useLocation()
  const isAgentDashboard = location.pathname.includes('agent-dashboard')
  const {data,refetch} = useQuery<{agentProduction:Production}>(AGENT_PRODUCTION,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true })
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const prod = data?.agentProduction || null;
  const {data:collectionsData} = useQuery<{monthlyWeeklyCollected:{monthly: number, weekly: number}}>(WEEKLY_AND_MONTLY_COLLECTION,{skip: !isAgentDashboard, notifyOnNetworkStatusChange: true })

  useEffect(()=> {
    const refetching = async() => {
      await refetch()
    }
    refetching()
  },[])

  console.log((Number(prod?.totalCountUnsuccessPTP) + Number(prod?.totalCountSuccessPTP)) / Number(prod?.totalCountKept)*100)

  console.log(prod?.totalCountKept)
  return (
    <div className="grid grid-cols-3  gap-2">
      <div className={`rounded-xl border border-blue-500 text-blue-500 bg-blue-200 p-2 shadow shadow-black/20 flex flex-col`}>
        <h1 className="text-xs lg:text-sm font-bold">
          Total PTP
        </h1>
        <div className="flex flex-col justify-center h-full gap-2">
          <div className="flex flex-col">
            <div className="flex justify-between">
              <p className="text-xs font-medium">Success</p>
              <p className="text-3xl">{prod?.totalCountSuccessPTP || 0}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs font-medium">Amount</p>
              <p className="text-xs ">{prod?.totalAmountSuccessPTP?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || (0).toLocaleString('en-PH',{style: 'currency', currency: "PHP"})}</p>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between text-red-500">
              <p className="text-xs font-medium">Unsuccess</p>
              <p className="text-xs font-bold">{prod?.totalCountUnsuccessPTP || 0}</p>
            </div>
            <div className="flex justify-between text-red-500">
              <p className="text-xs font-medium">Amount</p>
              <p className="text-xs ">{prod?.totalAmountUnsuccessPTP?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || (0).toLocaleString('en-PH',{style: 'currency', currency: "PHP"})}</p>
            </div>
          </div>

          <div className="flex flex-col text-green-500">
          <h1 className="text-xs font-medium text-green-500">PTP To KEPT %</h1>
            <div className="flex justify-between ">
              <p className="text-xs font-medium">Count</p>
              <p className="text-xs">{prod?.totalCountKept || 0} - {(Number(prod?.totalCountKept) /(Number(prod?.totalCountUnsuccessPTP) + Number(prod?.totalCountSuccessPTP)) *100).toFixed(2) }%</p>
            </div>
            <div className="flex justify-between ">
              <p className="text-xs font-medium">Amount</p>
              <p className="text-xs ">{prod?.totalAmountKept?.toLocaleString('en-PH',{style: 'currency', currency: "PHP"}) || (0).toLocaleString('en-PH',{style: 'currency', currency: "PHP"})} - {(Number(prod?.totalAmountKept) / (Number(prod?.totalAmountSuccessPTP) + Number(prod?.totalAmountUnsuccessPTP))*100).toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
      <Division 
        label="Weekly Total KEPT"
        previous={0}
        current={collectionsData?.monthlyWeeklyCollected.weekly || 0}
        target={userLogged?.targets.weekly || 0}
        color="teal"
      />
      <Division 
        label="Monthly Total KEPT"
        previous={0}
        current={collectionsData?.monthlyWeeklyCollected.monthly || 0}
        target={userLogged?.targets.monthly || 0}
        color="purple"
      />
    </div>
  )
}

