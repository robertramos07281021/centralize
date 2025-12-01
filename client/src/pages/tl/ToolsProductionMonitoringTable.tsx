import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";

type ToolsProduction = {
  contact_method: string;
  rpc: number;
  ptp: number;
  kept: number;
  paid: number;
};

const TOOLS_PRODUCTION = gql`
  query getToolsProduction($bucket: ID, $interval: String) {
    getToolsProduction(bucket: $bucket, interval: $interval) {
      contact_method
      rpc
      ptp
      kept
      paid
    }
  }
`;

const ToolsProductionMonitoringTable = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"]?.includes(pathName);

  const { data, refetch, loading } = useQuery<{
    getToolsProduction: ToolsProduction[];
  }>(TOOLS_PRODUCTION, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });
  const toolsData = data?.getToolsProduction || [];
  
  console.log(toolsData)
  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, [intervalTypes, selectedBucket]);

  const tools = ["call", "sms", "email", "skip", "field"];

  const totalRPC =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.rpc).reduce((t, v) => t + v)
      : 0;
  const totalPtp =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.ptp).reduce((t, v) => t + v)
      : 0;
  const totalKept =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.kept).reduce((t, v) => t + v)
      : 0;
  const totalPaid =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.paid).reduce((t, v) => t + v)
      : 0;

  return (
    <motion.div className="w-full h-full shadow-md relative flex border border-gray-500 my-2 rounded-md lg:text-xs 2xl:text-base flex-col"
      initial={{y: 20, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      transition={{delay: 0.4}}
    >
      <h1 className="font-black  uppercase lg:text-sm 2xl:text-lg text-gray-800 bg-gray-400 px-2 py-1.5 text-center rounded-t-sm">
        Tools Production Monitoring
      </h1>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="w-full flex flex-col h-full text-gray-600 table-fixed">
          <div className="bg-gray-300 sticky border-white">
            <div className="grid border-y border-gray-500 grid-cols-5 justify-center text-center items-center font-black uppercase">
              <div></div>
              <div className="py-1.5">RPC</div>
              <div>PTP</div>
              <div>Kept</div>
              <div>Amount Collected</div>
            </div>
          </div>
          <div className="text-center grid grid-rows-6 h-full">
            {tools.map((tool, index) => {
              const findTools =
                data?.getToolsProduction?.find(
                  (t) => t.contact_method === tool
                ) || null;
              return (
                <div
                  key={index}
                  className="even:bg-gray-100 hover:bg-gray-200 items-center h-full uppercase border-white grid grid-cols-5"
                >
                  <div className="text-left px-5 uppercase">{tool}</div>
                  <div className="uppercase">{findTools?.rpc || 0}</div>
                  <div className="uppercase">
                    {findTools?.ptp.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                  <div className="uppercase">
                    {findTools?.kept.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                  <div className="uppercase">
                    {findTools?.paid.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                </div>
              );
            })}
            <div className="bg-gray-200 rounded-b-md border-gray-500 grid grid-cols-5 items-center border-t">
              <div className="text-left px-5 font-black uppercase ">Total</div>
              <div>{totalRPC}</div>
              <div>
                {totalPtp?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div>
                {totalKept?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div>
                {totalPaid.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ToolsProductionMonitoringTable;
