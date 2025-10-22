import gql from "graphql-tag";
import { useQuery } from "@apollo/client";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";

const COLLECTION_MONITORING = gql`
  query getCollectionMonitoring($bucket: ID, $interval: String) {
    getCollectionMonitoring(bucket: $bucket, interval: $interval) {
      target
      collected
    }
  }
`;
type CollectionMonitoringData = {
  target: number;
  collected: number;
};

const CollectionsMonitoringTable = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"]?.includes(pathName);

  const { data, refetch, loading } = useQuery<{
    getCollectionMonitoring: CollectionMonitoringData;
  }>(COLLECTION_MONITORING, {
    variables: { bucket: selectedBucket, interval: intervalTypes },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, [intervalTypes, selectedBucket]);

  const newData = data?.getCollectionMonitoring
    ? data?.getCollectionMonitoring
    : null;

  const theVariance = newData ? newData?.target - newData?.collected : 0;
  const collectionPercent = newData
    ? (newData.collected / newData.target) * 100
    : 0;

  return (
    <motion.div className="lg:text-xs 2xl:text-base flex flex-col rounded-md border border-gray-500"
      initial={{y: 20, opacity: 0}}
      animate={{y: 0, opacity: 1}}
      transition={{delay: 0.2}}
    >
      <h1 className="uppercase bg-gray-400 rounded-t-sm lg:text-sm 2xl:text-lg text-gray-800  px-2 py-1.5 font-black text-center">
        Collections Monitoring
      </h1>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center py-2">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        </div>
      ) : (
        <div className="w-full flex flex-col bg-gray-100 rounded-b-sm border-t text-gray-600 py-2 text-center font-black table-fixed">
          <div className="w-full">
            <div className="grid grid-cols-4 w-full">
              <div className="font-black uppercase ">Target</div>
              <div className="font-black uppercase ">Collection</div>
              <div className="font-black uppercase">Variance</div>
              <div className="font-black uppercase">Collection %</div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-4 even:bg-gray-200">
              <div className="">
                {newData
                  ? newData?.target?.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })
                  : (0).toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
              </div>
              <div>
                {newData
                  ? newData?.collected?.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })
                  : (0).toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
              </div>
              <div>
                {theVariance?.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                })}
              </div>
              <div>{isNaN(collectionPercent) ? (0).toFixed(2) : collectionPercent?.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CollectionsMonitoringTable;
