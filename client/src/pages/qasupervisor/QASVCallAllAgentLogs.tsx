import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GET_ALL_BUCKET = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      dept
      name
      viciIp
    }
  }
`;

type getAllBucket = {
  _id: string;
  dept: string;
  name: string;
  viciIp: string;
};

const GET_BUCKET_USERS = gql`
  query getBucketUser($bucketId: ID) {
    getBucketUser(bucketId: $bucketId) {
      _id
      name
      vici_id
    }
  }
`;

const BARGE_CALL = gql`
  mutation bargeCall($sessionId: String, $viciUserId: String) {
    bargeCall(session_id: $sessionId, viciUser_id: $viciUserId)
  }
`;

const CALL_LOGS = gql`
  query getUsersLogginOnVici($bucket: ID!) {
    getUsersLogginOnVici(bucket: $bucket)
  }
`;

type BucketOption = getAllBucket & { isAll?: boolean };
const ALL_BUCKET_OPTION: BucketOption = {
  _id: "ALL",
  dept: "All",
  name: "Select a bucket",
  viciIp: "",
  isAll: true,
};

const QASVCallAllAgentLogs = () => {
  const [selectedBucket, setSelectedBucket] = useState<BucketOption | null>(
    ALL_BUCKET_OPTION
  );
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: allBucketsData } = useQuery<{ getAllBucket: getAllBucket[] }>(
    GET_ALL_BUCKET
  );

  const allBuckets = useMemo(
    () => allBucketsData?.getAllBucket ?? [],
    [allBucketsData]
  );

  // const effectiveBucketId = useMemo(
  //   () => (selectedBucket?.isAll ? allBuckets[0]?._id : selectedBucket?._id),
  //   [selectedBucket, allBuckets]
  // );

  const bucketOptions = useMemo<BucketOption[]>(
    () => [ALL_BUCKET_OPTION, ...allBuckets],
    [allBuckets]
  );

  const { data: bucketUsersData } = useQuery<{
    getBucketUser: { _id: string; name: string; vici_id: string }[];
  }>(GET_BUCKET_USERS, {
    variables: selectedBucket?.isAll
      ? undefined
      : { bucketId: selectedBucket?._id },
    skip: !selectedBucket || selectedBucket.isAll,
  });

  const { data: callLogsData } = useQuery<{
    getUsersLogginOnVici: string;
  }>(CALL_LOGS, {
    notifyOnNetworkStatusChange: true,
    variables: selectedBucket?.isAll
      ? undefined
      : { bucket: selectedBucket?._id },
    skip: !selectedBucket || selectedBucket.isAll,
    pollInterval: selectedBucket?.isAll ? undefined : 1000,
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

  const bucketUsers = bucketUsersData?.getBucketUser ?? [];
  const allowedViciIds = useMemo(
    () =>
      bucketUsers
        .map((user) => user.vici_id?.trim())
        .filter((id): id is string => Boolean(id)),
    [bucketUsers]
  );

  const rawRows = useMemo(
    () => (selectedBucket?.isAll ? [] : rows),
    [selectedBucket, rows]
  );

  const filteredRows = useMemo(() => {
    if (selectedBucket?.isAll) return rawRows;
    if (!bucketUsersData) return rawRows;
    if (!allowedViciIds.length) return [];
    return rawRows.filter((row) => {
      const viciId = row.split("|")[0]?.trim();
      return viciId
        ? allowedViciIds.some((allowedId) => viciId.includes(allowedId))
        : false;
    });
  }, [rawRows, bucketUsersData, allowedViciIds, selectedBucket]);

  const [bargeCall] = useMutation(BARGE_CALL);

  const handleBargeCall = useCallback(
    async (session_id: string | null, viciUserId: string | null) => {
      await bargeCall({
        variables: {
          sessionId: session_id,
          viciUserId: viciUserId,
        },
      });
    },
    [bargeCall]
  );

  return (
    <div className="w-full relative p-5 h-[91vh] flex flex-col">
      <motion.div
        className="flex flex-col p-4 border gap-2 rounded-md bg-gray-400 h-full"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <div className="">
              <div className="">
                <motion.div onClick={() => setIsOpen(!isOpen)} layout>
                  <div className="bg-gray-200 relative z-20 cursor-pointer hover:bg-gray-300 transition-all px-2 flex gap-3 py-1 rounded-sm shadow-md border">
                    <div>{selectedBucket?.name ?? "Select a Bucket"}</div>
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
                    <div className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-200 shadow-md  transition-all cursor-pointer rounded-sm  mt-1">
                      {bucketOptions?.map((bucket) => {
                        return (
                          <span
                            onClick={() => {
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {selectedBucket?.isAll
                ? "Select a Bucket"
                : selectedBucket?.viciIp}
            </motion.div>
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

            <input className="focus:outline-none" placeholder="Search..." />
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
            {!selectedBucket || selectedBucket.isAll ? (
              <div className="flex justify-center items-center bg-gray-200 w-full py-3 rounded-b-md shadow-md italic text-gray-400 border-black border-x border-b">
                <div>Select a bucket to view agents</div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex justify-center items-center bg-gray-200 w-full py-3 rounded-b-md shadow-md font-black italic text-gray-400 border-black border-x border-b">
                <div>No agent found</div>
              </div>
            ) : (
              filteredRows.map((x, index) => {
                const newtext = x.split("|");
                if (newtext.length < 1)
                  return (
                    <div className="flex justify-center items-center bg-gray-200 w-full py-3 rounded-b-md shadow-md font-black italic text-gray-400 border-black  border-x border-b">
                      <div>No agent found</div>
                    </div>
                  );
                const viciId = newtext[0]?.trim();
                const session = newtext[2];
                const canBarge =
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
                    transition={{ delay: index * 0.05 }}
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
                                  className={` ${
                                    canBarge
                                      ? "bg-red-500 border-red-800"
                                      : "bg-green-500 border-green-800"
                                  } p-1.5 ml-2.5 transition-all shadow-md border  rounded-full text-white `}
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
                            canBarge ? (
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
                            col || "sda"
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

export default QASVCallAllAgentLogs;
