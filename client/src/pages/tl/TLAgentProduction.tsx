import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { Bucket } from "./TlDashboard";
import CollectionsMonitoringTable from "./CollectionsMonitoringTable";
import ToolsProductionMonitoringTable from "./ToolsProductionMonitoringTable";
import AgentProductionMonitoringTable from "./AgentProductionMonitoringTable";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";
import { IntervalsTypes } from "../../middleware/types.ts";

const TL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

const TLAgentProduction = () => {
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"].includes(pathName);
  const { data: tlBucketData, refetch: getDeptBucketRefetch } = useQuery<{
    getAllBucket: Bucket[];
  }>(TL_BUCKET, { notifyOnNetworkStatusChange: true, skip: !isTLDashboard });

  useEffect(() => {
    const timer = async () => {
      await getDeptBucketRefetch();
    };
    if (selectedBucket) {
      timer();
    }
  }, [selectedBucket, intervalTypes]);

  const findBucket = tlBucketData?.getAllBucket.find(
    (bucket) => bucket._id === selectedBucket
  );

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const tlBuckets = tlBucketData?.getAllBucket || [];
    return Object.fromEntries(tlBuckets.map((e) => [e._id, e.name]));
  }, [tlBucketData]);

  return (
    <div className="col-span-6 flex flex-col overflow-hidden">
      <div className="   text-slate-700 flex items-center mb-2 gap-2 justify-between">
        <div className="flex justify-between w-full">
          <h1 className="font-bold lg:text-lg 2xl:text-3xl">
            {bucketObject[selectedBucket as keyof typeof bucketObject]}
            {!findBucket?.principal && (
              <span className="uppercase"> - {intervalTypes}</span>
            )}
          </h1>
        </div>
        {intervalTypes === IntervalsTypes.MONTHLY && (
          <div className="flex gap-5">
            <div className="flex gap-2 items-center">
              <p>From</p>
              <div className="bg-gray-300 border border-gray-600 rounded-md flex gap-2 items-center">
                <input className="px-3 py-1" type="date" />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <p>To</p>
              <div className="bg-gray-300 border border-gray-600 rounded-md ">
                <input className="px-3 py-1" type="date" />
              </div>
            </div>
          </div>
        )}
      </div>
      <CollectionsMonitoringTable />
      <ToolsProductionMonitoringTable />
      <AgentProductionMonitoringTable />
    </div>
  );
};

export default TLAgentProduction;
