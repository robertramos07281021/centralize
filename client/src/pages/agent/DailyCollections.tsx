import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";
import { HiOutlineMinusSm } from "react-icons/hi";


interface DailyCollection {
  ptp_amount: number
  ptp_yesterday: number
  ptp_kept_amount: number
  ptp_kept_yesterday: number
  paid_amount: number
  paid_yesterday: number
}

const AGENT_DAILY_COLLECTIONS =gql`
  query GetAgentDailyCollection {
    getAgentDailyCollection {
      ptp_amount
      ptp_yesterday
      ptp_kept_amount
      ptp_kept_yesterday
      paid_amount
      paid_yesterday
    }
  }
`

type RateProps = {
  label: string;
  current: number;
  previous: number;
  color: string;
};

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

const StatCard = ({ label, current, previous, color }: RateProps) => {
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
    <div
      className={`bg-${color}-200 rounded-xl border border-${color}-400 p-2 shadow shadow-black/20 flex flex-col text-${color}-500`}
    >
      <h1 className="lg:text-xs 2xl:text-sm font-bold">
        {label} <span className="lg:text-[0.7em] 2xl:text-xs">(Daily)</span>
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
  );
};

export default function DailyCollections() {
  const {data:dailyCollectionData} = useQuery<{getAgentDailyCollection:DailyCollection}>(AGENT_DAILY_COLLECTIONS)

  const stats = dailyCollectionData?.getAgentDailyCollection;

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats && (
        <>
          <StatCard
            label="PTP"
            current={stats.ptp_amount}
            previous={stats.ptp_yesterday}
            color="orange"
          />
          <StatCard
            label="PTP Kept"
            current={stats.ptp_kept_amount}
            previous={stats.ptp_kept_yesterday}
            color="green"
          />
          <StatCard
            label="Paid"
            current={stats.paid_amount}
            previous={stats.paid_yesterday}
            color="blue"
          />
        </>
      )}
    </div>
  )
}

