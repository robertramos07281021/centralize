import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import { setServerError } from "../../redux/slices/authSlice";

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
  target: number;
  color: keyof typeof colorsObject;
}

const colorsObject:{[key:string]:string} = {
  purple: 'border-purple-500 text-purple-500 bg-purple-200',
  teal: 'border-teal-500 text-teal-500 bg-teal-200',
  yellow: 'border-yellow-500 text-yellow-500 bg-yellow-200'
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

const Divition = ({label, current, previous, color, target }: Divition ) => {
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

  const theVariance = target - current
  const variancePercentage = (theVariance / target) * 100


  return (
    <div className={`rounded-xl border ${colorsObject[color]} p-2 shadow shadow-black/20 flex flex-col`}>
      <h1 className="text-xs lg:text-sm font-bold">
        {label}
      </h1>
      <div className="flex justify-between pt-2 items-center">
        <h1>C</h1>
        <h1 className="text-4xl">{targetPercentage.toFixed(2)}%</h1>
      </div>
      <h1 className="text-xs flex justify-end">V - {variancePercentage.toFixed(2)}%</h1>
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
  const {data,refetch} = useQuery<{agentProduction:Production}>(AGENT_PRODUCTION)
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const prod = data?.agentProduction || null;
  const {data:collectionsData} = useQuery<{monthlyWeeklyCollected:{monthly: number, weekly: number}}>(WEEKLY_AND_MONTLY_COLLECTION)
  const dispatch = useAppDispatch()
  useEffect(()=> {
    const refetching = async() => {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    }
    refetching()
  },[])

  return (
    <div className="grid grid-cols-3  gap-2">
      <Divition 
        label="Daily Total Collected"
        previous={prod?.dtcPrevious || 0}
        current={prod?.dtcCurrent || 0}
        target={userLogged?.targets.daily || 0}
        color="yellow"
      />
      <Divition 
        label="Weekly Total Collected"
        previous={0}
        current={collectionsData?.monthlyWeeklyCollected.weekly || 0}
        target={userLogged?.targets.weekly || 0}
        color="teal"
      />
      <Divition 
        label="Monthly Total Collected"
        previous={prod?.dtcPrevious || 0}
        current={collectionsData?.monthlyWeeklyCollected.monthly || 0}
        target={userLogged?.targets.monthly || 0}
        color="purple"
      />
    </div>
  )
}

