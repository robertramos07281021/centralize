import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

type DailyCollection = {
  ptp_amount: number;
  ptp_count: number;
  ptp_yesterday: number;
  ptp_kept_amount: number;
  ptp_kept_count: number;
  ptp_kept_yesterday: number;
  paid_amount: number;
  paid_count: number;
  paid_yesterday: number;
};

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
`;

const AGENT_RPC_COUNT = gql`
  query getAgentRPCCount {
    getAgentRPCCount {
      dailyCount
      totalCount
    }
  }
`;
const AGENT_PRODUCTION = gql`
  query agentProduction {
    agentProduction {
      totalAmountPTP
      totalCountPTP
      totalAmountKept
      totalCountKept
    }
  }
`;

type Production = {
  totalAmountPTP: number;
  totalCountPTP: number;
  totalAmountKept: number;
  totalCountKept: number;
};

const WEEKLY_AND_MONTLY_COLLECTION = gql`
  query monthlyWeeklyCollected {
    monthlyWeeklyCollected {
      monthly
      weekly
      monthlyCount
      weeklyCount
    }
  }
`;

type WeeklyAndMontlyColl = {
  monthly: number;
  weekly: number;
  monthlyCount: number;
  weeklyCount: number;
};

const WithoutTargetDiv = ({
  count,
  interval,
  amount,
  color,
}: {
  count: number;
  interval: string;
  amount: number;
  color: string;
}) => {
  const colorMap = {
    red: "border-red-500 text-red-500",
    pink: "border-pink-500 text-pink-500",
  };

  const colorMapLabel = {
    red: "bg-red-200",
    pink: "bg-pink-200",
  };

  return (
    <motion.div
      className={`border ${
        colorMap[color as keyof typeof colorMap]
      } uppercase bg-white font-black rounded-sm shadow-md flex flex-col`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div
        className={`lg:text-xs flex-col h-full rounded-t-sm border-b flex items-center justify-center font-black  2xl:text-base ${
          colorMapLabel[color as keyof typeof colorMapLabel]
        } `}
      >
        TOTAL PTP
        <span className="lg:text-[0.7em] ml-1 2xl:text-xs font-normal">
          ({interval})
        </span>
      </div>
      <div className="text-xs 2xl:text-base relative h-full flex items-center justify-center">
        <p className="text-center absolute truncate -top-3 bg-red-100 px-2 right-4 rounded-full border text-base">
          {count}
        </p>

        <div className="text-[0.6rem] 2xl:text-base absolute font-normal bottom-0.5 ">
          AMT
        </div>

        <div>
          {amount.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
          })}
        </div>
      </div>
    </motion.div>
  );
};


const forRPCDiv = ({
  interval,
  count,
  color,
}: {
  interval: string;
  count: number;
  color: string;
}) => {
  
  const colorMap = {
    yellow: "border-yellow-500 text-yellow-500",
    orange: "border-orange-500 text-orange-500",
  };
  const colorMapLabel = {
    yellow: "bg-yellow-200",
    orange: "bg-orange-200",
  };

  return (
    <motion.div
      className={`border border-yellow-500 ${
        colorMap[color as keyof typeof colorMap]
      } bg-white font-black text-yellow-500  rounded-sm shadow-md flex flex-col`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`lg:text-xs flex-col h-[50%] rounded-t-sm border-b flex items-center justify-center font-black bg-yellow-200 2xl:text-base ${
          colorMapLabel[color as keyof typeof colorMapLabel]
        }`}
      >
        RPC
        <span className="lg:text-[0.7em] 2xl:text-xs font-normal">
          ({interval})
        </span>
      </div>
      <div className="text-4xl 2xl:text-5xl h-[50%] flex items-center justify-center">
        <p className="text-center">{count}</p>
      </div>
    </motion.div>
  );
};


const WithTargetDiv = ({
  count,
  target,
  collected,
  color,
  interval,
}: {
  count: number;
  target: number;
  collected: number;
  color: string;
  interval: string;
}) => {
  const colorMap = {
    blue: "border-blue-500 text-blue-500",
    sky: "border-sky-500 text-sky-500",
    teal: "border-teal-500 text-teal-500",
  };
  const colorMapLabel = {
    blue: "bg-blue-200",
    sky: "bg-sky-200",
    teal: "bg-teal-200",
  };

  const variance = target - collected;

  return (
    <motion.div
      className={`border ${
        colorMap[color as keyof typeof colorMap]
      } uppercase bg-white font-black rounded-sm shadow-md flex flex-col`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div
        className={`lg:text-xs flex-col py-0.5 2xl:h-1/2 rounded-t-sm border-b flex items-center justify-center font-black ${
          colorMapLabel[color as keyof typeof colorMapLabel]
        } 2xl:text-base`}
      >
        KEPT
        <span className="lg:text-[0.7em] 2xl:text-xs font-normal">
          ({interval})
        </span>
      </div>
      <div className="2xl:text-xs flex-col relative h-full flex px-2 justify-center">
        <p className="text-center absolute truncate -top-4 bg-blue-100 px-2 right-4 rounded-full border text-base">
          {count}
        </p>

        <div className="text-sm relative flex flex-row 2xl:justify-between items-center gap-1">
          <div className="text-[0.5rem] 2xl:text-sm w-5 font-normal">TGT</div>
          <div className="text-[0.7rem] 2xl:text-sm">
            {target.toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </div>
        </div>

        <div className="text-sm relative flex flex-row 2xl:justify-between items-center gap-1">
          <div className=" text-[0.5rem] 2xl:text-sm w-5 font-normal">COLL</div>
          <div className="text-[0.7rem] 2xl:text-sm">
            {collected.toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </div>
        </div>

        <div className="text-sm relative flex flex-row 2xl:justify-between items-center gap-1">
          <div className="text-[0.5rem] 2xl:text-sm w-5 font-normal">VAR</div>
          <div className="text-[0.7rem] 2xl:text-sm">
            {variance.toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};



const DashboardMinis = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const isAgentDashboard = location.pathname.includes("agent-dashboard");
  const { data: rpcCountData, refetch: rpcCountRefetch } = useQuery<{
    getAgentRPCCount: { dailyCount: number; totalCount: number };
  }>(AGENT_RPC_COUNT, {
    notifyOnNetworkStatusChange: true,
    skip: !isAgentDashboard,
  });

  const { data, refetch } = useQuery<{
    getAgentDailyCollection: DailyCollection;
  }>(AGENT_DAILY_COLLECTIONS, {
    notifyOnNetworkStatusChange: true,
    skip: !isAgentDashboard,
  });

  const { data: agentProductionData, refetch: agentProductionRefetch } =
    useQuery<{ agentProduction: Production }>(AGENT_PRODUCTION, {
      skip: !isAgentDashboard,
      notifyOnNetworkStatusChange: true,
    });
  const prod = agentProductionData?.agentProduction || null;

  const { data: collectionsData, refetch: collectionsDataRefetch } = useQuery<{
    monthlyWeeklyCollected: WeeklyAndMontlyColl;
  }>(WEEKLY_AND_MONTLY_COLLECTION, {
    skip: !isAgentDashboard,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await rpcCountRefetch();
      await agentProductionRefetch();
      await collectionsDataRefetch();
    };
    refetching();
  }, []);

  return (
    <motion.div className="lg:row-span-2 lg:col-span-3 grid grid-rows-3 grid-cols-3 gap-2">



      <motion.div
        className="border border-yellow-500 bg-white font-black text-yellow-500  rounded-sm shadow-md flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="lg:text-xs flex-col h-[50%] rounded-t-sm border-b flex items-center justify-center font-black bg-yellow-200 2xl:text-base ">
          RPC{" "}
          <span className="lg:text-[0.7em] 2xl:text-xs font-normal">
            (Daily)
          </span>
        </div>
        <div className="text-4xl 2xl:text-5xl h-[50%] flex items-center justify-center">
          <p className="text-center">
            {rpcCountData?.getAgentRPCCount?.dailyCount || 0}
          </p>
        </div>
      </motion.div>

        {/* <forRPCDiv 
            interval="daily"
        count={rpcCountData?.getAgentRPCCount?.dailyCount ?? 0}
        color="yellow"
        /> */}

      <WithoutTargetDiv
        interval="Daily"
        count={data?.getAgentDailyCollection?.ptp_count || 0}
        amount={data?.getAgentDailyCollection?.ptp_amount || 0}
        color="red"
      />

      <WithTargetDiv
        count={data?.getAgentDailyCollection?.ptp_kept_count ?? 0}
        target={userLogged?.targets?.daily ?? 0}
        collected={data?.getAgentDailyCollection?.ptp_kept_amount ?? 0}
        color="blue"
        interval="Daily"
      />

      <motion.div
        className="border border-orange-500 bg-white font-black text-orange-500  rounded-sm shadow-md flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="lg:text-xs flex-col h-[50%] rounded-t-sm border-b flex items-center justify-center font-black bg-orange-200 2xl:text-base ">
          TOTAL RPC{" "}
          <span className="lg:text-[0.7em] ml-1 2xl:text-xs font-normal">
            (Daily)
          </span>
        </div>
        <div className="text-4xl 2xl:text-5xl h-[50%] flex items-center justify-center">
          <p>{rpcCountData?.getAgentRPCCount?.totalCount || 0}</p>
        </div>
      </motion.div>

      <WithoutTargetDiv
        interval="Monthly"
        count={prod?.totalCountPTP || 0}
        amount={prod?.totalAmountPTP || 0}
        color="pink"
      />

      <WithTargetDiv
        count={collectionsData?.monthlyWeeklyCollected?.weeklyCount ?? 0}
        target={userLogged?.targets?.weekly ?? 0}
        collected={collectionsData?.monthlyWeeklyCollected?.weekly ?? 0}
        color="sky"
        interval="Weekly"
      />

      <motion.div
        className="border col-span-3 border-teal-500 uppercase bg-white font-black text-teal-600 rounded-sm shadow-md flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="flex flex-col h-[50%] rounded-t-sm border-b border-teal-500 bg-teal-200 items-center justify-center">
          <div className="lg:text-xs   flex items-center justify-center font-black  2xl:text-base">
            KEPT
          </div>
          <div className="lg:text-[0.5em] 2xl:text-xs font-normal">
            (monthly)
          </div>
        </div>
        <div className="text-3xl flex-row w-full gap-5 relative 2xl:text-5xl h-[50%] flex items-center text-center">
          <p className="text-center absolute truncate -top-3 bg-teal-100 border-teal-500 px-2 right-4 rounded-full border text-base">
            {collectionsData?.monthlyWeeklyCollected?.monthlyCount || 0}
          </p>

          <div className="text-base w-full justify-center relative flex flex-row items-center gap-2">
            <div className="text-[0.8rem] w-5 font-normal">TGT</div>
            {(userLogged?.targets?.monthly ?? 0).toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </div>

          <div className="text-base w-full justify-center relative flex flex-row items-c.enter gap-2">
            <div className="text-[0.8rem] w-5 font-normal items-center flex mr-2 ">
              COLL
            </div>
            {(
              collectionsData?.monthlyWeeklyCollected?.monthly ?? 0
            ).toLocaleString("en-PH", {
              style: "currency",
              currency: "PHP",
            })}
          </div>

          <div className="text-base w-full justify-center relative flex flex-row items-center gap-2">
            <div className="text-[0.8rem] w-5 font-normal">VAR</div>
            <div className="">
              {(() => {
                const tgt = userLogged?.targets?.monthly ?? 0;
                const coll =
                  collectionsData?.monthlyWeeklyCollected?.monthly ?? 0;
                const varAmt = tgt - coll;

                return varAmt.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                });
              })()}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardMinis;
