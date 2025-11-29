import { gql, useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "../middleware/types.ts";

type ProductionHistoryEntry = {
  type: string;
  start: string;
  end: string;
  existing: string;
};

type User = {
  vici_id: string;
  name: string;
  _id: string;
};

type ProductionRecord = {
  _id: string;
  user: User;
  prod_history: ProductionHistoryEntry[];
  createdAt: string;
  total: number;
  average: number;
  longest: number;
  target_today: number;
};

const GET_ALL_USERS = gql`
  query GetUsers($page: Int!, $limit: Int!) {
    getUsers(page: $page, limit: $limit) {
      users {
        _id
        account_type
        name
        user_id
        vici_id
        type
      }
    }
  }
`;

const GET_ALL_PRODUCTIONS = gql`
  query GetAllProductions {
    productions {
      _id
      user
      target_today
      prod_history {
        type
        start
      }
    }
  }
`;

const GET_PRODUCTION = gql`
  query getAllAgentProductions($bucketId: ID!, $from: String, $to: String) {
    getAllAgentProductions(bucketId: $bucketId, from: $from, to: $to) {
      _id
      user {
        _id
        name
        vici_id
      }
      average
      createdAt
      longest
      prod_history {
        end
        existing
        start
        type
      }
      total
    }
  }
`;

const BUCKETS = gql`
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

const AgentAttendanceLogs = () => {
  const [isOpenView, setIsOpenView] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Users | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data } = useQuery<{
    getUsers: { users: Users[] };
  }>(GET_ALL_USERS, {
    variables: { page: 1, limit: 50 },
  });

  const { data: prodData } = useQuery<{
    productions: ProductionRecord[];
  }>(GET_ALL_PRODUCTIONS);
  const { data: bucketsData } = useQuery<{ getAllBucket: Bucket[] }>(
    BUCKETS,
    { notifyOnNetworkStatusChange: true }
  );

  const { data: getAllProdData } = useQuery<{
    getAllAgentProductions: ProductionRecord[];
  }>(GET_PRODUCTION, {
    notifyOnNetworkStatusChange: true,
    variables: {
      bucketId: selectedBucket,
      from: fromDate || null,
      to: toDate || null,
    },
    skip: !selectedBucket,
  });

  const bucketProductionByUser = useMemo(() => {
    const map = new Map<string, ProductionRecord>();
    getAllProdData?.getAllAgentProductions?.forEach((record) => {
      if (record?.user?._id) {
        map.set(record.user._id, record);
      }
    });
    return map;
  }, [getAllProdData]);

  useEffect(() => {
    if (bucketsData?.getAllBucket) {
      setSelectedBucket(bucketsData?.getAllBucket[0]._id);
    }
  }, [bucketsData]);
  const users = data?.getUsers?.users || [];
  const productions = prodData?.productions || [];
  const agentUsers = users.filter((u: Users) => u.type === "AGENT");
  const getAllProductionsForUser = (userId: string) => {
    return productions.filter((p) => p.user._id === userId);
  };

  const getAllHistoryForUser = (userId: string) => {
    const userProductions = getAllProductionsForUser(userId);
    const allHistory: ProductionHistoryEntry[] = [];

    userProductions.forEach((prod) => {
      if (prod.prod_history?.length) {
        allHistory.push(...prod.prod_history);
      }
    });

    return allHistory;
  };

  const filterHistoryByDate = (
    history: ProductionHistoryEntry[],
    dateStr: string
  ) => {
    if (!dateStr) return history;

    const filterDate = new Date(dateStr);

    return history.filter((entry) => {
      const entryDate = new Date(entry.start);
      return (
        entryDate.getFullYear() === filterDate.getFullYear() &&
        entryDate.getMonth() === filterDate.getMonth() &&
        entryDate.getDate() === filterDate.getDate()
      );
    });
  };

  const formatHistoryStart = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  };

  return (
    <div className="px-10 py-3 w-full h-[90.7%]">
      <div className="w-full flex flex-col gap-2 h-full">
        <motion.div
          className="flex flex-col h-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <div className="flex justify-between mb-2">
            <div className="shadow-md border rounded-sm">
              <select
                name="buckets"
                id="bucket"
                value={selectedBucket ?? ""}
                onChange={(e) => {
                  setSelectedBucket(e.target.value);
                }}
                className="px-3 py-1 "
              >
                {bucketsData?.getAllBucket?.map((bucket) => {
                  return (
                    <option value={bucket._id} key={bucket._id}>
                      {bucket.name}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <div>From:</div>
                <div className="rounded-sm shadow-md border">
                  <input
                    className="px-3 py-1 outline-none"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>To:</div>
                <div className=" rounded-sm shadow-md border">
                  <input
                    className="px-3 py-1 outline-none"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2 font-black uppercase rounded-t-md border px-4 bg-gray-300 py-2">
            <div>vici id</div>
            <div>name</div>
            <div>total calls</div>
            <div>Average</div>
            <div>Longest Call</div>
            <div></div>
          </div>

          <div className=" flex flex-col overflow-auto">
            {agentUsers.map((user: Users, index: number) => {
              const summary = bucketProductionByUser.get(user._id);

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={user._id}
                  className="pl-4 py-2 gap-2 even:bg-gray-100 odd:bg-gray-200 last:rounded-b-md items-center border-x grid grid-cols-6 hover:bg-gray-200 border-b"
                >
                  <div>
                    {user.vici_id || (
                      <div className="text-xs italic text-gray-400">
                        No vici id
                      </div>
                    )}
                  </div>
                  <div
                    className="first-letter:uppercase truncate "
                    title={user.name}
                  >
                    {user.name}
                  </div>
                  <div>
                    {summary?.total ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>

                  <div>
                    {summary?.average ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>
                  <div>
                    {summary?.longest ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>

                  <div className="flex justify-end px-3">
                    <div
                      onClick={() => {
                        setIsOpenView(true);
                        setSelectedUser(user);
                      }}
                      className="px-3 cursor-pointer border-2 border-blue-900 rounded-sm font-black uppercase text-white py-1 bg-blue-600"
                    >
                      View
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {isOpenView && (
        <motion.div
          className="flex flex-col justify-center items-center absolute top-0 left-0 z-20 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={() => {
              setIsOpenView(false);
              setSelectedDate("");
            }}
            className="absolute top-0 left-0 h-full w-full cursor-pointer backdrop-blur-sm bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
          <motion.div
            className="bg-white z-20 w-full max-w-xl p-6 border rounded-md shadow-md flex flex-col gap-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            layout
          >
            <div className="flex items-start justify-between gap-4">
              <div className="">
                <div className="text-lg font-black uppercase first-letter:uppercase ">
                  Agent name: {selectedUser?.name ?? "Unknown Agent"}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpenView(false);
                  setSelectedDate("");
                }}
                className="rounded-full bg-red-600 cursor-pointer shadow-md hover:bg-red-700 transition-all text-white border-2 border-red-900 p-1 text-sm uppercase"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <motion.div
                  className="text-sm font-semibold text-gray-700"
                  layout
                >
                  {!selectedDate && "All"} Production History
                </motion.div>
                <div className="px-3 py-1 bg-blue-600 hover:bg-blue-700 border-2 border-blue-900 rounded-sm text-white cursor-pointer text-sm font-black uppercase">
                  Export
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs bg-gray-300 py-2 border rounded-t-md pl-3 pr-8 uppercase font-black">
                  <div>Agent Name</div>
                  <div>Date and Time</div>
                </div>
                <div className="flex max-h-96 flex-col overflow-y-auto">
                  {(() => {
                    const allHistory = selectedUser
                      ? getAllHistoryForUser(selectedUser._id)
                      : [];
                    const filteredHistory = filterHistoryByDate(
                      allHistory,
                      selectedDate
                    );

                    return filteredHistory.length ? (
                      filteredHistory.map((entry, idx) => (
                        <motion.div
                          key={idx}
                          className="border-x border-b odd:bg-gray-200 even:bg-gray-100 last:rounded-b-md last:shadow-md px-3 py-2 text-sm text-gray-800"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-black uppercase">
                              {entry.type}
                            </span>
                            <span className="text-xs text-black">
                              {formatHistoryStart(entry.start)}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="rounded-b-md border-x border-b border-dashed px-3 py-4 text-center text-sm text-gray-500">
                        {selectedDate
                          ? "No production history found for this date."
                          : "No production history found for this agent."}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AgentAttendanceLogs;
