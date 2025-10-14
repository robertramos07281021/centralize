import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import { setSelectedCampaign } from "../../redux/slices/authSlice.ts";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

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
  const { selectedCampaign } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const isQADashboard = location.pathname !== "/qa-agents-dashboard";

  const { data, refetch: bucketRefetching } = useQuery<{
    getTLBucket: Bucket[];
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
    const newData = data?.getTLBucket || [];
    return Object.fromEntries(newData.map((d) => [d._id, d.name]));
  }, [data]);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetching();
    };
    refetching();
  }, [refetch, bucketRefetching]);

  const dispatch = useAppDispatch();

  return (
    <div className="overflow-hidden flex h-full w-full flex-col">
      <motion.div className="flex items-center justify-end px-5 pt-4">
        {data && data?.getTLBucket?.length > 0 && (
          <select
            name="campaign"
            id="campaign"
            className="px-6 text-center border border-slate-500 rounded py-1.5"
            onChange={(e) => {
              const value =
                e.target.value.trim() === "" ? null : e.target.value;
              dispatch(setSelectedCampaign(value));
            }}
            value={selectedCampaign || ""}
          >
            <option value="">Select Campaign</option>
            {data.getTLBucket.map((bucket) => (
              <option value={bucket._id} key={bucket._id}>
                {bucket.name}
              </option>
            ))}
          </select>
        )}
      </motion.div>
      <div className="h-full w-full p-5 overflow-hidden flex">
        <motion.div
          className="w-full h-full overflow-auto "
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="w-full overflow-hidden rounded-md div-fixed">
            <div className=" bg-gray-300 uppercase font-black overflow-hidden">
              <div className="grid grid-cols-6 items-center">
                <div className="px-2 py-2">Name</div>
                <div className="px-2 py-2">SIP</div>
                <div className="px-2 py-2">Buckets</div>
                <div className="text-center flex justify-center">Activity</div>
                <div className="text-center flex justify-center">online</div>
                {/* <div className="text-center flex justify-center">lock</div> */}
                <div className="text-center flex justify-center"></div>
              </div>
            </div>
            <div>
              {agendivata?.getBucketUser.map((user, index) => (
                <motion.div
                  key={user._id}
                  className=" even:bg-gray-200 grid py-2 items-center w-full grid-cols-6 bg-gray-100 cursor-default transition-all hover:bg-gray-200 select-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="capitalize ">
                    <div className="w-full h-full px-2 py-1 ">{user.name}</div>
                  </div>
                  <div className="flex">
                    <div className="w-full h-full px-2 py-1 ">
                      {user.user_id}
                    </div>
                  </div>
                  <div>
                    <div className="w-full h-full px-2 py-1">
                      {user.buckets.map((b) => newMapBucjket[b]).join(", ")}
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
                  {/* <div className="justify-center flex">
                    {user.isLock ? (
                      <div className="bg-red-500 px-2 border-2 rounded-sm border-red-800 shadow-md cursor-pointer hover:bg-red-600 transition-all text-white py-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-gray-300 px-2 border-2 rounded-sm border-gray-400 transition-all text-gray-400 py-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                          className="size-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                      </div>
                    )}
                  </div> */}
                  <div className=" flex justify-center">
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
    </div>
  );
};

export default QAAgentViews;
