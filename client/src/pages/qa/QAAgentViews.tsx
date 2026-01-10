import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import { setSelectedCampaign } from "../../redux/slices/authSlice.ts";
import { Link, useLocation } from "react-router-dom";
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

const GetBucket = gql`
  query getTLBucket {
    getTLBucket {
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

const QAAgentViews = () => {
  const { selectedCampaign, userLogged } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const isQADashboard = location.pathname !== "/qa-agents-dashboard";
  const [isBucketMenuOpen, setIsBucketMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: qaBucketData, refetch: qaBucketRefetch } = useQuery<{
    getTLBucket: Bucket[];
  }>(GetBucket, {
    skip: isQADashboard,
    notifyOnNetworkStatusChange: true,
  });

  const { data, refetch: bucketRefetching } = useQuery<{
    getAllBucket: Bucket[];
  }>(GET_BUCKET, { skip: isQADashboard, notifyOnNetworkStatusChange: true });

  const { data: agendivata, refetch } = useQuery<{ getBucketUser: User[] }>(
    BUCKET_AGENT,
    {
      variables: { bucketId: selectedCampaign },
      skip: isQADashboard,
      notifyOnNetworkStatusChange: true,
    }
  );

  const newMapBucjket = useMemo(() => {
    const bucketData = data?.getAllBucket || [];
    return Object.fromEntries(bucketData.map((d) => [d._id, d.name]));
  }, [data]);

  const userBucketIds = useMemo(() => {
    const ids = userLogged?.buckets || [];
    return new Set(ids.filter(Boolean));
  }, [userLogged?.buckets]);

  const filteredAgents = useMemo(() => {
    const agents = agendivata?.getBucketUser || [];
    if (userBucketIds.size === 0) {
      return agents;
    }
    return agents.filter((agent) =>
      agent.buckets.some((bucketId) => userBucketIds.has(bucketId))
    );
  }, [agendivata, userBucketIds]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const searchFilteredAgents = useMemo(() => {
    if (!normalizedSearch) {
      return filteredAgents;
    }

    return filteredAgents.filter((agent) => {
      const bucketNames = agent.buckets
        .map((bucketId) => newMapBucjket[bucketId])
        .filter(Boolean)
        .join(" ");

      const searchableText = [
        agent.name,
        agent.user_id,
        bucketNames,
        agent.active ? "active" : "inactive",
        agent.isOnline ? "online" : "offline",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [filteredAgents, normalizedSearch, newMapBucjket]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetching();
      await qaBucketRefetch();
    };
    refetching();
  }, [refetch, bucketRefetching]);

  const dispatch = useAppDispatch();

  return (
    <div className="overflow-hidden p-5 flex h-full w-full flex-col">
      <motion.div
        className="flex flex-col h-full bg-gray-400 p-4 border rounded-md w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="flex justify-between  ">
          <motion.div className="flex items-center justify-start ">
            {data && data?.getAllBucket?.length > 0 && (
              <div className="relative">
                <motion.div
                  className="bg-gray-100 justify-between cursor-pointer hover:bg-gray-200 transition-all px-3 flex gap-3 py-1 rounded-sm shadow-md border min-w-60"
                  onClick={() => {
                    setIsBucketMenuOpen((prev) => !prev);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setIsBucketMenuOpen((prev) => !prev);
                    }
                  }}
                >
                  <div className="truncate">
                    {selectedCampaign
                      ? newMapBucjket[selectedCampaign] ?? "Select Campaign"
                      : "Select Campaign"}
                  </div>
                  <div
                    className={` ${
                      isBucketMenuOpen ? "rotate-90" : ""
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
                </motion.div>
                <AnimatePresence>
                  {isBucketMenuOpen && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -5, opacity: 0 }}
                      className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-100 shadow-md transition-all cursor-pointer rounded-sm mt-1 w-full"
                    >
                      <span
                        onClick={() => {
                          dispatch(setSelectedCampaign(null));
                          setIsBucketMenuOpen(false);
                        }}
                        className="whitespace-nowrap hover:bg-gray-200 px-3 py-1"
                      >
                        Select Campaign
                      </span>
                      {userLogged?.type === "QASUPERVISOR" ? (
                        <>
                          {data.getAllBucket
                            .filter(
                              (bucket) =>
                                userBucketIds.size === 0 ||
                                userBucketIds.has(bucket._id)
                            )
                            .map((bucket) => (
                              <span
                                onClick={() => {
                                  dispatch(setSelectedCampaign(bucket._id));
                                  setIsBucketMenuOpen(false);
                                }}
                                className="whitespace-nowrap hover:bg-gray-200 px-3 py-1"
                                key={bucket._id}
                              >
                                {bucket.name}
                              </span>
                            ))}
                        </>
                      ) : (
                        <>
                          {qaBucketData?.getTLBucket.map((bucket) => (
                            <span
                              onClick={() => {
                                dispatch(setSelectedCampaign(bucket._id));
                                setIsBucketMenuOpen(false);
                              }}
                              className="whitespace-nowrap hover:bg-gray-200 px-3 py-1"
                              key={bucket._id}
                            >
                              {bucket.name}
                            </span>
                          ))}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
          <div className="border bg-gray-100 rounded-sm  shadow-md text-xs flex ">
            <input
              className="px-3 text-sm outline-none py-1 bg-transparent"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
        {isBucketMenuOpen && (
          <motion.div
            onClick={() => setIsBucketMenuOpen(false)}
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
        )}
        <div className="h-full w-full mt-2 overflow-hidden flex">
          <motion.div
            className="w-full h-full "
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="w-full h-full overflow-hidden ">
              <div className=" bg-gray-300 h-[6%] border border-black rounded-t-md uppercase font-black overflow-hidden">
                <div className="grid grid-cols-6  justify-center h-full px-3 items-center">
                  <div className="">Name</div>
                  <div className="">SIP</div>
                  <div className="">Buckets</div>
                  <div className="text-center flex justify-center">
                    Activity
                  </div>
                  <div className="text-center flex justify-center">online</div>
                  {/* <div className="text-center flex justify-center">lock</div> */}
                  <div className="text-center flex justify-center"></div>
                </div>
              </div>
              <div className=" overflow-auto flex flex-col h-[94%]">
                {searchFilteredAgents.length === 0 ? (
                  <div className="flex justify-center items-center bg-gray-200 py-4 rounded-b-md shadow-inner italic text-gray-500">
                    {filteredAgents.length === 0
                      ? "No agents found for the selected campaign."
                      : `No results for "${searchTerm}"`}
                  </div>
                ) : (
                  searchFilteredAgents.map((user, index) => (
                  <motion.div
                    key={user._id}
                    className=" odd:bg-gray-200 text-sm border-x border-b last:rounded-b-md grid py-1 items-center w-full grid-cols-6 even:bg-gray-100 cursor-default transition-all hover:bg-gray-300 select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="capitalize ">
                      <div className="w-full h-full px-2 py-1 ">
                        {user.name}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-full h-full px-2 py-1 ">
                        {user.user_id || (
                          <div className="text-xs text-gray-400 italic">
                            No sip id
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="w-full h-full truncate px-2 py-1">
                        {user.buckets
                          .filter(
                            (bucketId) =>
                              userBucketIds.size === 0 ||
                              userBucketIds.has(bucketId)
                          )
                          .map((b) => newMapBucjket[b])
                          .filter(Boolean)
                          .join(", ") || "—"}
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
                        title="View Recordings"
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
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default QAAgentViews;
