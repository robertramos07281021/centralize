import { gql, useQuery } from "@apollo/client";
import * as XLSX from "xlsx";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

type ProductionHistoryEntry = {
  type: string;
  start: string;
  end: string;
  existing: string;
};

type ProdSummary = {
  createdAt: string;
  prod: ProductionHistoryEntry[];
};

type User = {
  vici_id: string;
  name: string;
  _id: string;
};

type ProductionRecord = {
  user: User;
  prod_history: ProdSummary[];
  total: number;
  average: number;
  longest: number;
};

const GET_PRODUCTION = gql`
  query getAllAgentProductions($bucketId: ID, $from: String, $to: String) {
    getAllAgentProductions(bucketId: $bucketId, from: $from, to: $to) {
      average
      longest
      prod_history {
        createdAt
        prod {
          end
          existing
          start
          type
        }
      }
      total
      user {
        _id
        name
        vici_id
      }
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
  const [prods, setProds] = useState<ProductionRecord | null>(null);
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const userType = (userLogged?.type ?? "").toUpperCase();
  const [isBucketMenuOpen, setIsBucketMenuOpen] = useState(false);

  const { data: bucketsData } = useQuery<{ getAllBucket: Bucket[] }>(BUCKETS, {
    notifyOnNetworkStatusChange: true,
  });

  const bucketOptions = useMemo(() => {
    const allBuckets = bucketsData?.getAllBucket ?? [];
    if (userType === "QA" || userType === "TL") {
      const allowed = new Set(userLogged?.buckets ?? []);
      return allBuckets.filter((bucket) => allowed.has(bucket._id));
    }
    return allBuckets;
  }, [bucketsData, userType, userLogged?.buckets]);

  const { data: getAllProdData, refetch } = useQuery<{
    getAllAgentProductions: ProductionRecord[];
  }>(GET_PRODUCTION, {
    notifyOnNetworkStatusChange: true,
    variables: {
      bucketId: selectedBucket,
      from: fromDate,
      to: toDate,
    },
    skip: !selectedBucket,
  });



  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, [selectedBucket, fromDate, toDate]);

  useEffect(() => {
    if (!bucketOptions.length) {
      setSelectedBucket(null);
      return;
    }
    if (
      !selectedBucket ||
      !bucketOptions.some((bucket) => bucket._id === selectedBucket)
    ) {
      setSelectedBucket(bucketOptions[0]._id);
    }
  }, [bucketOptions, selectedBucket]);

  const formatHistoryStart = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString().split(", ")[1];
  };

  const handleExport = () => {
    if (!prods || !prods.prod_history) return;
    const rows: Array<{ [key: string]: string }> = [];
    prods.prod_history.forEach((prodSummary) => {
      const date = new Date(prodSummary.createdAt).toLocaleDateString();
      prodSummary.prod.forEach((entry) => {
        rows.push({
          "Agent Name": prods.user?.name ?? "Unknown Agent",
          Date: date,
          Type: entry.type,
          Start: formatHistoryStart(entry.start),
          End: formatHistoryStart(entry.end),
        });
      });
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
    XLSX.writeFile(
      workbook,
      `Agent Attendance of ${prods.user?.name ?? "Unknown"}.xlsx`
    );
  };

  return (
    <div className="p-5 w-full h-[90.7%]">
      <div className="w-full flex flex-col gap-2 h-full">
        <motion.div
          className="flex flex-col p-4 border rounded-md bg-gray-400 h-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <div className="flex justify-between mb-2">
            <div className="relative">
              <motion.div
                className="bg-gray-200 justify-between cursor-pointer hover:bg-gray-300 transition-all px-3 flex gap-3 py-1 rounded-sm shadow-md border min-w-64"
                onClick={() => {
                  if (bucketOptions.length === 0) return;
                  setIsBucketMenuOpen((prev) => !prev);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (bucketOptions.length === 0) return;
                    setIsBucketMenuOpen((prev) => !prev);
                  }
                }}
              >
                <div className="truncate">
                  {bucketOptions.length === 0
                    ? "No buckets available"
                    : bucketOptions.find(
                        (bucket) => bucket._id === selectedBucket
                      )?.name ?? "Select a bucket"}
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
                {isBucketMenuOpen && bucketOptions.length > 0 && (
                  <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-200 shadow-md transition-all cursor-pointer rounded-sm mt-1 w-full"
                  >
                    {bucketOptions.map((bucket) => (
                      <span
                        onClick={() => {
                          setSelectedBucket(bucket._id);
                          setIsBucketMenuOpen(false);
                        }}
                        className="whitespace-nowrap hover:bg-gray-300 px-3 py-1"
                        key={bucket._id}
                      >
                        {bucket.name}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <div>From:</div>
                <div className="rounded-sm bg-gray-100 shadow-md border">
                  <input
                    className="px-3 py-1 outline-none"
                    type="date"
                    value={fromDate || ""}
                    onChange={(event) => {
                      const value =
                        event.target.value.trim() === ""
                          ? null
                          : event.target.value;
                      setFromDate(value);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>To:</div>
                <div className=" rounded-sm  bg-gray-100 shadow-md border">
                  <input
                    className="px-3 py-1 outline-none"
                    type="date"
                    value={toDate || ""}
                    onChange={(event) => {
                      const value =
                        event.target.value === "" ? null : event.target.value;
                      setToDate(value);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          {isBucketMenuOpen && bucketOptions.length > 0 && (
            <motion.div
              onClick={() => setIsBucketMenuOpen(false)}
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
          )}
          <div className="grid grid-cols-6 gap-2 font-black uppercase rounded-t-md border px-4 bg-gray-300 py-2">
            <div>vici id</div>
            <div>name</div>
            <div>total calls</div>
            <div>Average</div>
            <div>Longest Call</div>
            <div></div>
          </div>

          <div className=" flex flex-col overflow-auto">
            {getAllProdData &&
              getAllProdData.getAllAgentProductions.length === 0 && (
                <div className="text-center border-x border-b border-black rounded-b-md shadow-md bg-gray-100 text-gray-400 italic py-3">
                  No production data found.
                </div>
              )}
            {getAllProdData?.getAllAgentProductions.map((prod, index) => {
              const userInfo = prod.user;
              const average = prod.average.toFixed(2);
              function formatTime(seconds: number) {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;

                const paddedMins =
                  hrs > 0 ? String(mins).padStart(2, "0") : String(mins);
                const paddedSecs = String(secs).padStart(2, "0");

                return hrs > 0
                  ? `${hrs}:${paddedMins}:${paddedSecs}`
                  : `${mins}:${paddedSecs}`;
              }
              const longest = formatTime(prod?.longest);

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={prod.user._id}
                  className="pl-4 py-2 gap-2 even:bg-gray-100 odd:bg-gray-200 last:rounded-b-md items-center border-x grid grid-cols-6 hover:bg-gray-200 border-b"
                >
                  <div>
                    {userInfo?.vici_id || (
                      <div className="text-xs italic text-gray-400">
                        No vici id
                      </div>
                    )}
                  </div>
                  <div
                    className="first-letter:uppercase truncate "
                    title={userInfo?.name}
                  >
                    {userInfo?.name}
                  </div>
                  <div>
                    {prod?.total ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>

                  <div>
                    {average ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>
                  <div>
                    {longest ?? (
                      <div className="text-xs italic text-gray-400">--</div>
                    )}
                  </div>

                  <div className="flex justify-end px-3">
                    <div
                      onClick={() => {
                        setProds(prod);
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

      {prods && (
        <motion.div
          className="flex flex-col justify-center items-center absolute top-0 left-0 z-100 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={() => {
              setProds(null);
            }}
            className="absolute top-0 left-0 h-full w-full cursor-pointer backdrop-blur-sm bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          ></motion.div>
          <motion.div
            className="bg-white z-20 w-full lg:max-w-2/3 h-[80%] border p-6 rounded-md shadow-md flex flex-col"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            layout
          >
            <div className="flex items-start h-[10%] justify-between gap-4">
              <div className="">
                <div className="text-lg font-black uppercase first-letter:uppercase ">
                  Agent name: {prods.user?.name ?? "Unknown Agent"}
                </div>
              </div>
              <button
                onClick={() => {
                  setProds(null);
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
            <div className="flex  h-[10%] items-center justify-between">
              <motion.div
                className="text-sm font-semibold text-gray-700"
                layout
              >
                Production History
              </motion.div>

              <div className="flex gap-2 items-center">
                <div className="rounded-sm  text-black font-bold">
                  {(() => {
                    if (!fromDate && !toDate) {
                      return new Date().toLocaleDateString();
                    } else if (fromDate && toDate) {
                      return `From ${new Date(
                        fromDate
                      ).toLocaleDateString()} - To ${new Date(
                        toDate
                      ).toLocaleDateString()}`;
                    } else if (fromDate || toDate) {
                      const date = fromDate
                        ? new Date(fromDate).toLocaleDateString()
                        : toDate
                        ? new Date(toDate).toLocaleDateString()
                        : null;
                      return date;
                    }
                  })()}
                </div>
                <div
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 border-2 border-blue-900 rounded-sm text-white cursor-pointer text-sm font-black uppercase"
                  onClick={handleExport}
                >
                  Export
                </div>
              </div>
            </div>

            <div className="flex h-[80%] flex-col gap-3">
              <div className=" h-full flex flex-col">
                <div className="justify-between text-xs bg-gray-400 py-2 border rounded-t-md pl-3 pr-8 uppercase font-black grid grid-cols-3">
                  <div>Agent Name</div>
                  <div className="text-end">Start</div>
                  <div className="text-end">End</div>
                </div>
                <div className="flex flex-col h-full overflow-auto ">
                  {prods?.prod_history?.map((prod, index) => {
                    return (
                      <motion.div
                        key={index}
                        className="flex flex-col h-full bg-gray-100  last:shadow-md text-sm text-gray-800 "
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="text-center border-x bg-gray-300 py-2 text-black font-bold border-t">
                          {new Date(prod.createdAt).toLocaleDateString()} - Time
                          In{" "}
                          {new Date(prod.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </div>
                        <div className="border-x border-b border-t flex flex-col ">
                          {prod.prod.map((x, index) => {
                            return (
                              <div
                                key={index}
                                className="grid grid-cols-3 even:bg-gray-200  odd:bg-gray-100 px-3 py-1  items-center justify-between"
                              >
                                <span className="font-semibold text-black uppercase">
                                  {x.type}
                                </span>
                                <span className="text-xs text-black text-end">
                                  {formatHistoryStart(x.start)}
                                </span>
                                <span className="text-xs text-black text-end">
                                  {x.end ? formatHistoryStart(x.end) : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
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
