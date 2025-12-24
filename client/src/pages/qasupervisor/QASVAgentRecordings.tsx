import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import { setSelectedCampaign } from "../../redux/slices/authSlice.ts";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const BUCKET_AGENT = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      user_id
      buckets
      active
      isOnline
      isLock
    }
  }
`;

const GET_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
};

type User = {
  _id: string;
  name: string;
  user_id: string;
  buckets: string[];
  active: boolean;
  isLock: boolean;
  isOnline: boolean;
};

const QASVAgentRecordings = () => {
  const { selectedCampaign } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const hasSearchTerm = searchTerm.trim().length > 0;

  const { data: bucketData, refetch: bucketRefetching } = useQuery<{
    getAllBucket: Bucket[];
  }>(GET_BUCKET, { notifyOnNetworkStatusChange: true });
  const { data: agendivata, refetch } = useQuery<{ getBucketUser: User[] }>(
    BUCKET_AGENT,
    {
      variables: { bucketId: selectedCampaign },
      skip: !selectedCampaign,
      notifyOnNetworkStatusChange: true,
    }
  );

  console.log("agendivata", agendivata);

  const newMapBucjket = useMemo(() => {
    const newData = bucketData?.getAllBucket || [];
    return Object.fromEntries(newData.map((d) => [d._id, d.name]));
  }, [bucketData]);

  const bucketOptions = useMemo(
    () => bucketData?.getAllBucket ?? [],
    [bucketData]
  );

  const selectedBucketLabel = useMemo(() => {
    if (selectedCampaign && newMapBucjket[selectedCampaign]) {
      return newMapBucjket[selectedCampaign];
    }
    return "Select a campaign";
  }, [selectedCampaign, newMapBucjket]);

  const filteredAgents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return agendivata?.getBucketUser || [];

    return (agendivata?.getBucketUser || []).filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(term);
      const sipMatch = user.user_id?.toLowerCase().includes(term);
      const bucketMatch = user.buckets
        .map((b) => newMapBucjket[b]?.toLowerCase())
        .some((label) => label?.includes(term));
      return nameMatch || sipMatch || bucketMatch;
    });
  }, [agendivata, newMapBucjket, searchTerm]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetching();
    };
    refetching();
  }, [refetch, bucketRefetching]);

  const dispatch = useAppDispatch();

  const handleCampaignSelect = (bucketId: string) => {
    const value = bucketId.trim() === "" ? null : bucketId;
    dispatch(setSelectedCampaign(value));
    setIsOpen(false);
  };

  return (
    <div className="overflow-hidden flex h-full p-5 w-full flex-col">
      <motion.div
        className="flex flex-col p-4 border gap-2 rounded-md bg-gray-400 h-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.div className="flex items-center justify-start">
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex justify-between w-full">
              <motion.div
                onClick={() => {
                  if (bucketOptions.length === 0) return;
                  setIsOpen((prev) => !prev);
                }}
                layout
                className="relative"
              >
                <div className="bg-gray-200 justify-between  z-20 cursor-pointer hover:bg-gray-300 transition-all px-3 flex gap-3 py-1 rounded-sm shadow-md border min-w-64">
                  <div className="truncate">{selectedBucketLabel}</div>
                  <div
                    className={` ${
                      isOpen ? "rotate-90" : ""
                    } transition-all items-center flex text-black`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </div>
                <AnimatePresence>
                  {isOpen && bucketOptions.length > 0 && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -5, opacity: 0 }}
                    >
                      <div className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-200 shadow-md transition-all cursor-pointer rounded-sm mt-1 w-full">
                        <span
                          onClick={() => handleCampaignSelect("")}
                          className="whitespace-nowrap hover:bg-gray-300 px-3 py-1"
                        >
                          Select a campaign
                        </span>
                        {bucketOptions.map((bucket) => (
                          <span
                            onClick={() => handleCampaignSelect(bucket._id)}
                            className="whitespace-nowrap hover:bg-gray-300 px-3 py-1"
                            key={bucket._id}
                          >
                            {bucket.name}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="border bg-gray-100 rounded-sm shadow-md px-2 flex items-center" >
                <input
                  className="h-full outline-none bg-transparent py-1 text-sm"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

            </div>
          </div>
        </motion.div>
        {isOpen && bucketOptions.length > 0 && (
          <motion.div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
        )}
        <div className="h-full w-full  overflow-hidden flex">
          <motion.div
            className="w-full h-full "
          >
            <div className="w-full h-full overflow-hidden  div-fixed">
              <div className=" bg-gray-300 border border-black rounded-t-md uppercase font-black overflow-hidden">
                <div className="grid grid-cols-6 items-center">
                  <div className="px-2 py-2">Name</div>
                  <div className="px-2 py-2">SIP</div>
                  <div className="px-2 py-2">Buckets</div>
                  <div className="text-center flex justify-center">
                    Activity
                  </div>
                  <div className="text-center flex justify-center">online</div>
                  <div className="text-center flex justify-center"></div>
                </div>
              </div>
              <div className=" overflow-auto flex flex-col h-full">
                {!agendivata && (
                  <div className="bg-gray-200 border-x border-b py-2 text-gray-400 italic border-black rounded-b-md shadow-md flex justify-center items-center">
                    No agents found for this campaign.
                  </div>
                )}
                {agendivata && filteredAgents.length === 0 && (
                  <div className="bg-gray-200 border-x border-b py-2 text-gray-400 italic border-black rounded-b-md shadow-md flex justify-center items-center">
                    {hasSearchTerm
                      ? "No agents match this search."
                      : "No agents found for this campaign."}
                  </div>
                )}
                {filteredAgents.map((user, index) => (
                  <motion.div
                    key={user._id}
                    className=" even:bg-gray-200 last:shadow-md text-sm border-x border-b last:rounded-b-md grid py-1 items-center w-full grid-cols-6 bg-gray-100 cursor-default transition-all hover:bg-gray-300 select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="capitalize ">
                      <div className="w-full h-full px-2 py-1 ">
                        {user.name}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-full h-full px-2 py-1 ">
                        {user.user_id || <div className="text-xs text-gray-400 italic" >No sip id</div> }
                      </div>
                    </div>
                    <div>
                      <div className="w-full h-full px-2 py-1 truncate" title={user.buckets.map((b) => newMapBucjket[b]).join(", ")}>
                        {user.buckets.map((b) => newMapBucjket[b]).join(", ")|| <div className="text-xs text-gray-400 italic" >No bucket</div>}
                      </div>
                    </div>
                    <div className="justify-center flex">
                      {user.active ? (
                        <div className=" shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                      ) : (
                        <div className=" shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                      )}
                    </div>
                    <div className=" flex justify-center">
                      {user.isOnline ? (
                        <div className=" shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                      ) : (
                        <div className=" shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                      )}
                    </div>
                    <div className=" flex justify-end pr-3">
                      <Link
                        className=" bg-blue-600 border-2 hover:bg-blue-700 text-white border-blue-800 shadow-md rounded-sm px-2 py-1"
                        to="/agent-recordings"
                        state={user._id}
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
                            d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                          />
                        </svg>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default QASVAgentRecordings;
