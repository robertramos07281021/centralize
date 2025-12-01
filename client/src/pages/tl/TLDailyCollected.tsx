import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { RootState } from "../../redux/store";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bucket } from "./TlDashboard.tsx";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type Collected = {
  isRPC: number;
};

const DAILY_COLLECTION = gql`
  query getTLDailyCollected($input: Input) {
    getTLDailyCollected(input: $input) {
      isRPC
    }
  }
`;

const SELECTED_BUCKET = gql`
  query selectedBucket($id: ID) {
    selectedBucket(id: $id) {
      principal
    }
  }
`;

const TLDailyCollected = () => {
  const location = useLocation();
  const pathName = location.pathname.slice(1);
  const isTLDashboard = ["tl-dashboard", "aom-dashboard"]?.includes(pathName);
  const { intervalTypes, selectedBucket } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    data: dailyCollected,
    refetch,
    loading,
  } = useQuery<{ getTLDailyCollected: Collected }>(DAILY_COLLECTION, {
    variables: {
      input: { bucket: selectedBucket, interval: intervalTypes },
    },
    skip: !isTLDashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data: bucketData, refetch:selectedBucketRefetch } = useQuery<{ selectedBucket: Bucket }>(
    SELECTED_BUCKET,
    {
      variables: { id: selectedBucket },
      skip: !isTLDashboard,
      notifyOnNetworkStatusChange: true,
    }
  );

  useEffect(() => {
    const timer = async () => {
      await refetch();
      await selectedBucketRefetch()
    };
    if (selectedBucket) {
      timer();
    }
  }, [selectedBucket, intervalTypes]);

  const paidSelected = dailyCollected?.getTLDailyCollected || null;

  return (
    <div className="border-yellow-500 relative border rounded-sm shadow-md  text-yellow-800 font-black uppercase flex flex-col">
      <div
        className="absolute top-2 right-2 text-yellow-800"
        title="RPC will be counted only when the agent dispose the client interaction as a positive call. Interactions dispose as negative calls will not be counted."
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
      </div>

      <div className="lg:text-xs 2xl:text-lg font-black text-yellow-800 flex text-center bg-yellow-400 border-b border-yellow-500 rounded-t-xs justify-center items-center h-[50%] ">
        <h1>
          RPC{" "}
          {!bucketData?.selectedBucket?.principal && (
            <span className="text-[0.6rem] 2xl:text-xs capitalize">{`(${intervalTypes})`}</span>
          )}
        </h1>
      </div>
      <div className="w-full flex justify-between relative h-[50%] bg-white rounded-b-sm gap-2 items-center text-base 2xl:text-xl">
        {!loading ? (
          <div className="flex justify-center items-center w-full">
            {/* <div className="absolute top-0 left-0 text-xs">Total</div> */}
            <p className="text-4xl">{paidSelected ? paidSelected?.isRPC : 0}</p>
          </div>
        ) : (
          <div className="flex justify-end w-full">
            <AiOutlineLoading3Quarters className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TLDailyCollected;
