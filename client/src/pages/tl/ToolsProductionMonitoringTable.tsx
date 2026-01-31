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
  ptcp: number;
  confirm: number;
  kept: number;
  paid: number;
};

const TOOLS_PRODUCTION = gql`
  query getToolsProduction($bucket: ID, $interval: String) {
    getToolsProduction(bucket: $bucket, interval: $interval) {
      contact_method
      rpc
      ptp
      ptcp
      confirm
      kept
      paid
    }
  }
`;

const ToolsProductionMonitoringTable = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth,
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
  const totalPtcp =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.ptcp).reduce((t, v) => t + v)
      : 0;
  const totalConfirm =
    toolsData.length > 0
      ? toolsData.map((rpc) => rpc.confirm).reduce((t, v) => t + v)
      : 0;



  return (
    <motion.div
      className="w-full h-full shadow-md relative flex border-2 border-blue-800 my-2 rounded-md lg:text-xs 2xl:text-base flex-col"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <h1 className="font-black  uppercase lg:text-sm 2xl:text-lg text-white text-shadow-2xs bg-blue-500 px-2 py-1.5 text-center rounded-t-sm">
        Tools Production Monitoring
      </h1>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="w-full flex flex-col h-full text-gray-600 table-fixed">
          <div className="bg-blue-400 sticky border-white">
            <div className="grid border-y-2 text-white text-shadow-md border-blue-800 grid-cols-7 justify-center text-center items-center font-black uppercase">
              <div></div>
              <div className="py-1.5">RPC</div>
              <div>PTP</div>
              <div>PTCP</div>
              <div>Confirm</div>
              <div>Kept</div>
              <div>No PTP PAYMENT</div>
            </div>
          </div>
          <div className="text-center grid grid-rows-6 h-full">
            {tools.map((tool, index) => {
              const findTools =
                data?.getToolsProduction?.find(
                  (t) => t.contact_method === tool,
                ) || null;
              return (
                <div
                  key={index}
                  className="odd:bg-blue-200 border-b cursor-default border-blue-400 even:bg-blue-100 items-center h-full uppercase grid grid-cols-7"
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
                    {findTools?.ptcp.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }) ||
                      (0).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                  </div>
                  <div className="uppercase">
                    {findTools?.confirm.toLocaleString("en-PH", {
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
            <div className="bg-blue-500 border-t-2 border-blue-800 text-white text-shadow-md rounded-b-sm grid grid-cols-7 items-center">
              <div className="text-left px-5 font-black uppercase ">Total</div>
              <div>{totalRPC}</div>
              <div>
                {totalPtp?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div>
                {totalPtcp?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div>
                {totalConfirm?.toLocaleString("en-PH", {
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
