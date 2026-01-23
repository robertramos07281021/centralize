import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { RootState } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";

type User = {
  name: string;
};

type DailyFTEType = {
  totalUsers: [User];
};

const DAILY_FTE = gql`
  query GetDailyFTE($bucket: ID) {
    getDailyFTE(bucket: $bucket) {
      totalUsers {
        name
      }
    }
  }
`;

const CAMPAIGN_ASSIGNED = gql`
  query getCampaignAssigned($bucket: ID) {
    getCampaignAssigned(bucket: $bucket)
  }
`;

type DivFTEsProps = {
  label: string;
  value: string | number | null | undefined;
  loading: boolean;
};

const DivFTEs = ({ label, value, loading }: DivFTEsProps) => {
  return (
    <div className="border overflow-hidden border-slate-700 rounded-sm shadow-md bg-white flex h-full flex-col items-center justify-center">
      <h1 className="text-[0.8rem] 2xl:text-xs text-center uppercase font-black text-gray-800 bg-gray-400 border-b border-gray-700 h-[50%] w-full flex items-center justify-center">
        {label}
      </h1>
      {loading ? (
        <p className="text-2xl 2xl:text-4xl text-center font-bold text-gray-800 flex items-center justify-center w-full h-[50%]">
          Loading....
        </p>
      ) : (
        <p className="text-2xl 2xl:text-4xl text-center font-bold text-gray-800 flex items-center justify-center w-full h-[50%]">
          {value ?? "-"}
        </p>
      )}
    </div>
  );
};

const DailyFTE = () => {
  const { selectedBucket } = useSelector((state: RootState) => state.auth);
  const [isOpenActualAgent, setIsOpenActualAgent] = useState(false);
  const {
    data,
    refetch,
    loading: actual,
  } = useQuery<{ getDailyFTE: DailyFTEType }>(DAILY_FTE, {
    variables: { bucket: selectedBucket },
    skip: !selectedBucket,
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: campaignAssignedData,
    refetch: campaignAssignedRefetch,
    loading: ecaLoading,
  } = useQuery<{ getCampaignAssigned: number }>(CAMPAIGN_ASSIGNED, {
    variables: { bucket: selectedBucket },
    skip: !selectedBucket,
    notifyOnNetworkStatusChange: true,
  });
  console.log(campaignAssignedData)

  useEffect(() => {
    const fetchData = async () => {
      await refetch();
      await campaignAssignedRefetch();
    };
    fetchData();
  }, []);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await campaignAssignedRefetch();
    };
    refetching();
  }, [selectedBucket]);

  const loading = actual || ecaLoading;

  const findData = data?.getDailyFTE?.totalUsers;

  const FTEPercent =
    (Number(findData?.length) /
      Number(campaignAssignedData?.getCampaignAssigned)) *
    100;

  return (
    <motion.div
      className=" col-span-3 rounded-xl grid grid-cols-3 gap-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 1 }}
    >
      <DivFTEs
        label="Expected Calling Agents"
        value={campaignAssignedData?.getCampaignAssigned || 0}
        loading={loading}
      />
      <div className="relative">
        <div
          className="absolute top-2 right-2 text-gray-800"
          title="The actual will only be counted if the agent starts the disposition."
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

        <div
          onMouseEnter={() => setIsOpenActualAgent(true)}
          onMouseLeave={() => setIsOpenActualAgent(false)}
          className="absolute animate-pulse text-red-900 bg-red-500 font-black peer top-2.5 left-3 border rounded-full w-5 h-5 flex items-center justify-center cursor-default"
        >
          !
        </div>
        <AnimatePresence>
          {isOpenActualAgent && (
            <motion.div
              className="absolute h-auto top-[104%] shadow-md left-0  flex-col z-100 w-full overflow-hidden "
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="uppercase font-bold text-gray-800 text-center py-2 bg-gray-400 border-x  border-y rounded-t-sm border-slate-700">
                Actual Agent
              </h1>
              <div className="flex flex-col border-x border-b rounded-b-md border-slate-700 p-4 bg-white">
                {findData && findData?.length > 0 ? (
                  <>
                    {findData?.map((x, index) => {
                      return (
                        <div key={index} className="capitalize text-slate-600">
                          {index + 1}.{""}
                          {x.name}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-gray-400  text-xs text-center italic font-medium">
                    No agents have production.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <DivFTEs
          label="Actual"
          value={findData?.length || 0}
          loading={loading}
        />
      </div>
      <DivFTEs
        label="Attendance %"
        value={`${isNaN(FTEPercent) ? 0 : FTEPercent.toFixed(2)}%`}
        loading={loading}
      />
    </motion.div>
  );
};

export default DailyFTE;
