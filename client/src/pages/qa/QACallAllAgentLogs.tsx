import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TL_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
      viciIp
    }
  }
`;

const BARGE_CALL = gql`
  mutation bargeCall($sessionId: String, $viciUserId: String) {
    bargeCall(session_id: $sessionId, viciUser_id: $viciUserId)
  }
`;

type Bucket = {
  _id: string;
  name: string;
  viciIp: string;
};

const CALL_LOGS = gql`
  query getUsersLogginOnVici($bucket: ID!) {
    getUsersLogginOnVici(bucket: $bucket)
  }
`;

const GET_USER_STATUS = gql`
  query getBargingStatus($viciId: String) {
    getBargingStatus(vici_id: $viciId)
  }
`;

const GET_BUCKET_USERS = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      vici_id
    }
  }
`;

const CallLogs = () => {
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [selectedBucket2, setSelectedBucket2] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, refetch } = useQuery<{ getTLBucket: Bucket[] }>(TL_BUCKET, {
    notifyOnNetworkStatusChange: true,
  });

  const { data: bucketUsersData } = useQuery(GET_BUCKET_USERS, {
    variables: selectedBucket ? { bucketId: selectedBucket._id } : undefined,
    skip: !selectedBucket,
    notifyOnNetworkStatusChange: true,
  });

  const bucketUsers =
    bucketUsersData?.getBucketUser?.map((u: any) => u.vici_id?.trim()) ?? [];

  const allowedViciIds = useMemo(() => new Set(bucketUsers), [bucketUsers]);

  const { data: callLogsData, refetch: callLogsRefetch } = useQuery<{
    getUsersLogginOnVici: string;
  }>(CALL_LOGS, {
    notifyOnNetworkStatusChange: true,
    variables: { bucket: selectedBucket?._id },
    skip: !selectedBucket?._id,
    pollInterval: 1000,
  });

  const newData = useMemo(
    () =>
      callLogsData?.getUsersLogginOnVici
        ? callLogsData.getUsersLogginOnVici.split("\n")
        : [],
    [callLogsData]
  );

  const rows = useMemo(() => {
    if (!newData || newData.length === 0) return [];
    return newData.slice(1).filter((line) => line?.trim());
  }, [newData]);

  // ⭐ NEW — filteredRows (IDENTICAL to CallAllAgentLogs)
  const filteredRows = useMemo(() => {
    if (!bucketUsersData) return rows;
    if (allowedViciIds.size === 0) return [];

    return rows.filter((row) => {
      const viciId = row.split("|")[0]?.trim();
      return viciId && allowedViciIds.has(viciId);
    });
  }, [rows, bucketUsersData, allowedViciIds]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const searchFilteredRows = useMemo(() => {
    if (!normalizedSearch) {
      return filteredRows;
    }

    return filteredRows.filter((row) =>
      row.toLowerCase().includes(normalizedSearch)
    );
  }, [filteredRows, normalizedSearch]);

  const { data: getUserData, refetch: getUserDataRefetch } = useQuery<{
    getBargingStatus: string;
  }>(GET_USER_STATUS, {
    variables: { viciId: selectedBucket?.viciIp },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (data) {
      setSelectedBucket(data.getTLBucket[0]);
      setSelectedBucket2(data.getTLBucket[0].name);
    }
  }, [data]);

  useEffect(() => {
    const refetching = async () => {
      await callLogsRefetch();
      await refetch();
      await getUserDataRefetch();
    };
    refetching();
  }, []);

  const [bargeCall] = useMutation(BARGE_CALL);

  const handleBargeCall = useCallback(
    async (session_id: string | null, viciUserId: string | null) => {
      if (!getUserData?.getBargingStatus.includes("ERROR")) {
        await bargeCall({
          variables: {
            sessionId: session_id,
            viciUserId: viciUserId,
          },
        });
      }
    },
    [bargeCall, getUserData]
  );

  return (
    <div className="w-full relative  gap-2 p-5 h-[91vh] flex flex-col">
      <motion.div
        className="flex flex-col h-full gap-3 bg-gray-400 p-4 rounded-md shadow-md border"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex justify-between ">
          <div>
            <div className="">
              <motion.div onClick={() => setIsOpen(!isOpen)} layout>
                <div className="bg-gray-200 relative z-20 cursor-pointer hover:bg-gray-300 transition-all px-2 flex gap-3 py-1 rounded-sm shadow-md border">
                  <div>{selectedBucket2}</div>
                  <div
                    className={`" ${
                      isOpen ? "rotate-90" : ""
                    } transition-all items-center flex text-black"`}
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
              </motion.div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -5, opacity: 0 }}
                >
                  <div className="absolute flex flex-col  z-20 border overflow-hidden bg-gray-200 shadow-md  transition-all cursor-pointer rounded-sm  mt-1">
                    {data?.getTLBucket.map((bucket) => {
                      return (
                        <span
                          onClick={() => {
                            setSelectedBucket2(bucket.name);
                            setSelectedBucket(bucket);
                            setIsOpen(false);
                          }}
                          className="whitespace-nowrap  hover:bg-gray-300 px-3 py-1 "
                          key={bucket._id}
                        >
                          {bucket.name}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-gray-200 rounded-sm shadow-md border items-center gap-3 px-3 py-1 flex">
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
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>

            <input
              className="focus:outline-none bg-transparent"
              placeholder="Search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <motion.div className="flex flex-col h-full overflow-auto">
          <div className="grid font-black text-sm uppercase bg-gray-300 border px-4 gap-2 py-2 rounded-t-md grid-cols-13">
            <div>User</div>
            <div className="truncate" title="Campaign ID">
              campaign id
            </div>
            <div className="truncate" title="Session ID">
              session id
            </div>
            <div className="truncate" title="Status">
              status
            </div>
            <div className="truncate" title="Lead ID">
              lead id
            </div>
            <div className="truncate" title="Caller ID">
              caller id
            </div>
            <div className="truncate text-center" title="Calls Today">
              calls today
            </div>
            <div className="truncate" title="Fullname">
              fullname
            </div>
            <div className="truncate" title="User Group">
              user group
            </div>
            <div className="truncate" title="User Level">
              user level
            </div>
            <div>break</div>
            <div className="truncate text-center" title="Call Status">
              call status
            </div>
            <div className="text-center">barge</div>
          </div>
          <div className="w-full flex flex-col h-full overflow-auto">
            {searchFilteredRows.length === 0 ? (
              <div className="flex justify-center items-center bg-gray-200 py-3 rounded-b-md shadow-md italic text-gray-400 border-x border-b text-center px-4">
                {filteredRows.length === 0
                  ? "No agent found"
                  : `No results for "${searchTerm}"`}
              </div>
            ) : (
              searchFilteredRows.map((x, index) => {
                const newtext = x.split("|");
                const viciId = newtext[0];
                const session = newtext[2];

                const canBarge =
                  (x.includes("INCALL") &&
                    !x.includes("DEAD") &&
                    !x.includes("DISPO") &&
                    !x.includes("DIAL")) ||
                  Boolean(session);

                const canBargeAndLive =
                  x.includes("INCALL") &&
                  !x.includes("DEAD") &&
                  !x.includes("DISPO") &&
                  !x.includes("DIAL");

                return (
                  <motion.div
                    key={index}
                    className="grid pl-4 pr-1 gap-2 hover:bg-gray-3 00 last:shadow-md last:rounded-b-md even:bg-gray-100 odd:bg-gray-200 border-x border-b grid-cols-13"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {newtext.map((col, colIndex) => {
                      return (
                        <div
                          key={colIndex}
                          className=" py-3 truncate items-center flex-row flex whitespace-nowrap"
                          title={col}
                        >
                          {colIndex === 3 ? (
                            col === "PAUSED" ? (
                              <AnimatePresence>
                                <motion.div
                                  className="p-1.5 ml-2.5 bg-gray-300 border border-gray-500 rounded-full text-gray-600"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  title="Not on-call"
                                >
                                  {" "}
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
                                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                                    />
                                  </svg>
                                </motion.div>
                              </AnimatePresence>
                            ) : (
                              <AnimatePresence>
                                <motion.div
                                  className="p-1.5 ml-2.5 bg-green-500 shadow-md border border-green-800 rounded-full text-white"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  title="Incall"
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
                                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                                    />
                                  </svg>
                                </motion.div>
                              </AnimatePresence>
                            )
                          ) : colIndex === 5 ? (
                            col ? (
                              <div className="truncate">{col}</div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                No caller id
                              </div>
                            )
                          ) : colIndex === 6 ? (
                            col !== "0" ? (
                              <div className=" text-center w-full flex justify-center truncate">
                                {col}
                              </div>
                            ) : (
                              <div className="text-center flex justify-center w-full">
                                0
                              </div>
                            )
                          ) : colIndex === 7 ? (
                            col ? (
                              <div className="truncate">{col}</div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                No fullname
                              </div>
                            )
                          ) : colIndex === 10 ? (
                            col || (
                              <div className="text-xs text-gray-400 italic">
                                No break
                              </div>
                            )
                          ) : colIndex === 11 ? (
                            canBargeAndLive ? (
                              <div className="w-full flex justify-center">
                                <div
                                  className="text-xs cursor-default shadow-md font-black uppercase text-white px-3 py-1 border-2 border-red-900 rounded-sm bg-red-600"
                                  title="Agent and client are talking"
                                >
                                  Live
                                </div>
                              </div>
                            ) : (
                              <div className="w-full flex justify-center">
                                <div
                                  className="text-xs cursor-default  font-black uppercase text-gray-500 px-3 py-1 border-2 border-gray-500 rounded-sm bg-gray-300"
                                  title="Agent and client aren't connected yet"
                                >
                                  Live
                                </div>
                              </div>
                            )
                          ) : (
                            col || ""
                          )}
                        </div>
                      );
                    })}
                    <div>
                      {!canBarge ? (
                        <span className="flex items-center justify-center w-full h-full">
                          <div
                            title="Barge"
                            className=" overflow-hidden justify-center cursor-not-allowed text-gray-600 bg-gray-300 p-1 rounded-sm border border-gray-500 transition-all relative flex items-center"
                          >
                            <div>
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
                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                            </div>
                          </div>
                        </span>
                      ) : (
                        <span
                          className="flex items-center h-full justify-center"
                          onClick={() => {
                            handleBargeCall(session, viciId);
                          }}
                          title="barge"
                        >
                          <div
                            onMouseEnter={() => setHoveredRow(index)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={`" ${
                              hoveredRow === index ? "pl-1 pr-2 py-1" : "p-1"
                            } shadow-md overflow-hidden bg-green-500  cursor-pointer text-white rounded-sm border border-gray-800 transition-all relative flex items-center "`}
                          >
                            <div>
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
                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                            </div>
                            <div
                              className={`" ${
                                hoveredRow === index
                                  ? "left-3 top-1"
                                  : "-top-10 left-10"
                              } transition-all absolute  "`}
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
                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                />
                              </svg>
                            </div>
                          </div>
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {isOpen && (
            <motion.div
              onClick={() => setIsOpen(false)}
              className="absolute top-0 left-0 w-full h-full z-10"
            ></motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CallLogs;
