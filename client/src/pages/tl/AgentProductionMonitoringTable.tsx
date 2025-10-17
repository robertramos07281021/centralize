import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";

type Targets = {
  daily: number;
  weekly: number;
  monthly: number;
};

type Agent = {
  _id: string;
  name: string;
  user_id: string;
  buckets: string[];
  type: string;
  active: boolean;
  targets: Targets;
};

type AgentDailies = {
  user: string;
  ptp: number;
  kept: number;
  RPC: number;
};

const AGENT_DAILY_PROD = gql`
  query agentDispoDaily($bucket: ID, $interval: String) {
    agentDispoDaily(bucket: $bucket, interval: $interval) {
      user
      ptp
      kept
      RPC
    }
  }
`;

const BUCKET_AGENTS = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      buckets
      type
      active
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`;

const AgentProductionMonitoringTable = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"]?.includes(pathName);

  const { data: agentBucketData, refetch: findAgentRefetch } = useQuery<{
    getBucketUser: Agent[];
  }>(BUCKET_AGENTS, {
    notifyOnNetworkStatusChange: true,
    variables: {
      bucketId: selectedBucket,
      skip: !selectedBucket || !isTLDashboard,
    },
  });

  const {
    data: agentDailyProd,
    refetch,
    loading,
  } = useQuery<{ agentDispoDaily: AgentDailies[] }>(AGENT_DAILY_PROD, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await findAgentRefetch();
      await refetch();
    };
    refetching();
  }, [selectedBucket, intervalTypes]);

  const bucketAgents = selectedBucket
    ? agentBucketData?.getBucketUser?.filter(
        (x) => x.buckets?.includes(selectedBucket) && x.type === "AGENT"
      )
    : [];

  return (
    <motion.div
      className="h-full flex flex-col border border-gray-600 rounded-md lg:text-xs 2xl:text-base overflow-hidden"
      initial={{ y: 20, opacity: 0}}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <h1 className="font-black uppercase lg:text-sm 2xl:text-lg text-gray-800 bg-gray-400 px-2 py-1.5 text-center">
        Agent Production Monitoring
      </h1>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="w-full h-full ">
          <div className="w-full h-full text-gray-600 table-fixed">
            <div className="bg-gray-300 sticky top-0 border-white">
              <div className="grid border-y border-gray-500 grid-cols-7 gap-2 items-center font-black uppercase">
                <div></div>
                <div className="py-1.5">RPC</div>
                <div>PTP</div>
                <div>Kept</div>
                <div>Collection %</div>
                <div>Target</div>
                <div>Variance</div>
              </div>
            </div>
            <div className="  overflow-auto  flex flex-col h-7/10" >
              {bucketAgents?.map((x, index) => {
                const findAgent = agentDailyProd?.agentDispoDaily
                  ? agentDailyProd?.agentDispoDaily.find(
                      (agent) => agent.user === x._id
                    )
                  : null;
                const collectionPercent = findAgent
                  ? (findAgent?.kept / x.targets[intervalTypes]) * 100
                  : null;
                const theVariance = findAgent
                  ? x.targets[intervalTypes] - findAgent?.kept
                  : null;
                return (
                  x.active && (
                    <motion.div
                      className="text-left hover:bg-gray-200  odd:bg-gray-100 bg-white items-center gap-2 grid grid-cols-7 text-gray-600"
                      key={x._id}
                      initial={{opacity: 0}}
                      animate={{opacity: 1}}
                      transition={{delay: index * 0.2}}
                    >
                      <div
                        className="truncate py-2 lg:text-xs 2xl:text-sm text-left pl-2 capitalize text-nowrap"
                        title={x.name}
                      >
                        {x.name}
                      </div>
                      <div>
                        {findAgent?.RPC || (
                          <div className="text-gray-400 italic">No RPC</div>
                        )}
                      </div>
                      <div>
                        {findAgent?.ptp.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }) || (
                          <div className="text-gray-400 italic">No PTP</div>
                        )}
                      </div>
                      <div>
                        {findAgent?.kept.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }) || (
                          <div className="text-gray-400 italic">No KEPT</div>
                        )}
                      </div>
                      <div
                        className={`${
                          collectionPercent && collectionPercent < 100
                            ? "text-red-500"
                            : "text-green-500"
                        } `}
                      >
                        {isNaN(Number(collectionPercent)) ||
                        !collectionPercent ? (
                          <div className="text-gray-400 italic">
                            No collection
                          </div>
                        ) : (
                          `${collectionPercent?.toFixed(2)}%`
                        )}
                      </div>
                      <div>
                        {x.targets[intervalTypes]?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }) || <div className="text-gray-400 italic">₱0.00</div>}
                      </div>
                      <div
                        className={`${
                          theVariance && theVariance < 0
                            ? "text-green-500"
                            : "text-red-500"
                        }  `}
                      >
                        {theVariance?.toLocaleString("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }) || <div className="text-gray-400 italic">No variance</div>}
                      </div>
                    </motion.div>
                  )
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AgentProductionMonitoringTable;
