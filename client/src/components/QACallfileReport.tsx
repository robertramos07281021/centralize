import { useEffect, useMemo, useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "../middleware/types.ts";

const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
      active
    }
  }
`;

const DEPT_BUCKET_QUERY = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
      dept
    }
  }
`;

const GET_DEPARTMENT_AGENT = gql`
  query findAgents {
    findAgents {
      _id
      name
      user_id
      buckets
      type
    }
  }
`;

const GET_CALLFILES = gql`
  query GetBucketCallfile($bucketId: [ID]) {
    getBucketCallfile(bucketId: $bucketId) {
      _id
      name
      active
      bucket
    }
  }
`;

const GET_DISPOSITION_REPORTS = gql`
  query GetDispositionReports($reports: SearchDispoReports) {
    getDispositionReports(reports: $reports) {
      RFD {
        _id
        count
      }
      agent {
        _id
        name
        user_id
      }
      bucket
      callfile {
        _id
        totalAccounts
        totalPrincipal
        name
        totalOB
      }
      toolsDispoCount {
        call_method
        dispositions {
          name
          count
          amount
          code
        }
      }
    }
  }
`;

type RFD = {
  _id: string;
  count: number;
};

type Tools = {
  dispositions: DispositionType[];
  call_method: string;
};

type Reports = {
  agent: Agent;
  bucket: string;
  toolsDispoCount: Tools[];
  callfile: Callfile;
  RFD: RFD[];
};

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

type DispositionType = {
  id?: string;
  name: string;
  code: string;
  active?: boolean;
  count?: string | number;
  amount?: number;
};

type Agent = {
  _id: string;
  name: string;
};

type Callfile = {
  _id: string;
  name: string;
  active?: boolean;
  bucket?: string;
  totalAccounts?: number;
  totalPrincipal?: number;
  totalOB?: number;
};


type SearchFilter = {
  bucket: string | null;
  callfile: string | null
  disposition: string[];
  dateFrom: string;
  dateTo: string;
};




const QACallfileReport = () => {
  const { data } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isCallfileOpen, setIsCallfileOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const searchFilter: SearchFilter | undefined = undefined;

  const { data: reportsData } = useQuery<{
    getDispositionReports: Reports;
  }>(GET_DISPOSITION_REPORTS, {
    variables: { reports: searchFilter },
    fetchPolicy: "network-only",
    // skip: isReporting,
  });

  const callMethod =
    reportsData?.getDispositionReports?.toolsDispoCount?.find(
      (x) => x.call_method === "call"
    )?.dispositions || [];
  const totalAccounts =
    (reportsData &&
      reportsData?.getDispositionReports?.callfile?.totalAccounts) ||
    0;

  const positive = [
    "PTP",
    "FFUP",
    "UNEG",
    "RTP",
    "PAID",
    "DISP",
    "LM",
    "HUP",
    "WN",
    "RPCCB",
  ];

  // const negativeCalls =
  //   callMethod && callMethod?.length > 0
  //     ? callMethod?.filter((x) => !positive.includes(x.code))
  //     : [];

  // const filteredPositive =
  //   positiveCalls.length > 0
  //     ? positiveCalls?.map((y) => y.count)?.reduce((t, v) => t + v)
  //     : [];
  // const filteredNegative =
  //   negativeCalls.length > 0
  //     ? negativeCalls?.map((y) => y.count)?.reduce((t, v) => t + v)
  //     : [];

  // const totalPositiveCalls =
  //   dispoData && dispoData.length > 0
  //     ? dispoData.map((x) => x.count)?.reduce((t, v) => t + v)
  //     : 0;





  const dispositionCount = (code: string) => {
    const foundDispo = callMethod?.find((e) => e.code === code);
    return foundDispo?.count || 0;
  };

  const percentageOfDispo = (code: string) => {
    const foundDispo = callMethod?.find((e) => e.code === code);
    const count = foundDispo?.count || 0;
    return totalAccounts > 0 ? (Number(count) / totalAccounts) * 100 : 0;
  };

  // const [dataForm, setDataForm] = useState({
  //   bucket: null,
  //   callfile: null,
  //   agent: null,
  //   dispositions: [],
  //   dateFrom: null,
  //   dateTo: null
  // })

  const [selectedCallfile, setSelectedCallfile] = useState<Callfile | null>(
    null
  );
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>(
    []
  );

  const { data: departmentBucket } = useQuery<{ getDeptBucket: Bucket[] }>(
    DEPT_BUCKET_QUERY
  );

  const { data: agentSelector } = useQuery<{ findAgents: Users[] }>(
    GET_DEPARTMENT_AGENT
  );

  console.log(agentSelector)

  const filteredAgents = useMemo(() => {
    const agents = agentSelector?.findAgents ?? [];
    return agents.filter((agent) => {
      if (agent.type !== "AGENT") {
        return false;
      }
      if (selectedBucket) {
        return agent.buckets?.includes(selectedBucket._id);
      }
      return true;
    });
  }, [agentSelector, selectedBucket]);

  useEffect(() => {
    if (
      selectedAgent &&
      !filteredAgents.some((agent) => agent._id === selectedAgent._id)
    ) {
      setSelectedAgent(null);
    }
  }, [filteredAgents, selectedAgent]);

  let bucketsOfCallfile: string[] = [];

  if (selectedAgent) {
    const agentData = agentSelector?.findAgents?.find(
      (x) => x._id === selectedAgent._id
    );
    if (agentData?.buckets) {
      bucketsOfCallfile.push(...agentData.buckets);
    }
  } else if (selectedBucket) {
    const bucketData = departmentBucket?.getDeptBucket.find(
      (x) => x._id === selectedBucket._id
    );
    if (bucketData?._id) {
      bucketsOfCallfile.push(bucketData._id);
    }
  }

  const { data: callfilesData } = useQuery<{
    getBucketCallfile: Callfile[];
  }>(GET_CALLFILES, { variables: { bucketId: bucketsOfCallfile } });

  const dispositions = (data?.getDispositionTypes ?? []).filter(
    (dispo) => dispo.active === undefined || dispo.active
  );

  const dispositionKeys = useMemo(
    () => dispositions.map((dispo) => dispo.id ?? dispo.code),
    [dispositions]
  );

  useEffect(() => {
    setSelectedDispositions((current) => {
      const filtered = current.filter((key) => dispositionKeys.includes(key));
      return filtered.length === current.length ? current : filtered;
    });
  }, [dispositionKeys]);

  const toggleDisposition = (key: string) => {
    setSelectedDispositions((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  };

  const areAllSelected =
    dispositionKeys.length > 0 &&
    selectedDispositions.length === dispositionKeys.length;

  const handleSelectAll = () => {
    setSelectedDispositions(() =>
      areAllSelected ? [] : [...dispositionKeys]
    );
  };

  return (
    <div className="flex flex-row h-full p-10 gap-2  ">
      <motion.div
        className="bg-gray-300 max-w-[500px] overflow-hidden w-full flex flex-col font-black text-black  border rounded-md shadow-md "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="text-center bg-gray-400 py-4 border-b font-black uppercase w-full text-2xl  ">
          Callfile Report
        </div>

        <div className="px-3 pb-3" >
          <div className="grid items-center grid-cols-3 mt-2">
            <div className="uppercase text-right mr-2 ">Bucket:</div>
            <div className="relative col-span-2 ">
              <div
                onClick={() => {
                  if (isAgentOpen) {
                    setIsAgentOpen(false);
                    setIsBucketOpen(true);
                  } else if (isCallfileOpen) {
                    setIsCallfileOpen(false);
                    setIsBucketOpen(true);
                  } else {
                    setIsBucketOpen(!isBucketOpen);
                  }
                }}
                className="border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer shadow-md "
              >
                {selectedBucket ? selectedBucket.name : "Select a Bucket"}
              </div>
              <AnimatePresence>
                {isBucketOpen && (
                  <motion.div
                    onClick={() => {
                      setIsBucketOpen(false);
                      setIsCallfileOpen(true);
                    }}
                    className="absolute z-20 overflow-auto bg-gray-200 max-h-40 w-full mt-1 shadow-sm border rounded-sm "
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                  >
                    {departmentBucket?.getDeptBucket.map((bucket) => (
                      <div
                        onClick={() => setSelectedBucket(bucket)}
                        className="px-3  hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0  cursor-pointer py-1"
                        key={bucket._id}
                      >
                        {bucket.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid items-center grid-cols-3 mt-2">
            <div className="uppercase text-right mr-2 ">Callfile:</div>
            <div className="relative col-span-2 ">
              <div
                onClick={() => {
                  if (isAgentOpen) {
                    setIsAgentOpen(false);
                    setIsCallfileOpen(true);
                  } else {
                    setIsCallfileOpen(!isCallfileOpen);
                  }
                }}
                className="border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer shadow-md "
              >
                {selectedCallfile ? selectedCallfile.name : "Select a Callfile"}
              </div>
              <AnimatePresence>
                {isCallfileOpen && (
                  <motion.div
                    onClick={() => {
                      setIsCallfileOpen(false);
                      setIsAgentOpen(true);
                    }}
                    className="absolute z-20  bg-gray-200 max-h-40 overflow-auto w-full mt-1 shadow-sm border rounded-sm "
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                  >
                    {callfilesData?.getBucketCallfile.map((callfile) => (
                      <div
                        onClick={() => setSelectedCallfile(callfile)}
                        className="px-3  hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0  cursor-pointer py-1"
                        key={callfile._id}
                      >
                        {callfile.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid items-center grid-cols-3 mt-2">
            <div className="uppercase  text-right mr-2 ">Agent:</div>
            <div className="relative col-span-2">
              <div
                onClick={() => {
                  setIsAgentOpen(!isAgentOpen);
                }}
                className="col-span-2 border bg-gray-200 first-letter:uppercase rounded-sm px-3 py-1 cursor-pointer  shadow-md "
              >
                {selectedAgent ? selectedAgent.name : "Select an Agent"}
              </div>
              <AnimatePresence>
                {isAgentOpen && (
                  <motion.div
                    className="absolute   max-h-40 overflow-auto bg-gray-200 w-full mt-1 shadow-sm border rounded-sm "
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                  >
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map((agent) => (
                        <div
                          onClick={() => {
                            setIsAgentOpen(false);
                            setSelectedAgent(agent);
                          }}
                          className="px-3 hover:bg-gray-300 first-letter:uppercase odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0  cursor-pointer py-1"
                          key={agent._id}
                        >
                          {agent.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-center text-sm text-gray-600">
                        No agents available for this bucket
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5  gap-2  flex flex-col">
            <div className="text-center uppercase">select Disposition</div>
            <div className="bg-gray-200 max-h-[350px] grid grid-cols-2 items-center  overflow-auto  shadow-md border rounded-sm gap-1 p-2">
              <div
                onClick={handleSelectAll}
                className={`text-sm uppercase py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-gray-500 hover:text-white border text-shadow-2xs ${
                  areAllSelected ? "bg-gray-500 text-white border border-black" : "bg-gray-300"
                }`}
              >
                <div>select all</div>
              </div>
              {dispositions.map(({ id, name, code }, index) => {
                const key = id ?? code;
                const isSelected = selectedDispositions.includes(key);

                return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={key}
                  onClick={() => toggleDisposition(key)}
                  className={`text-sm py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-gray-500 hover:text-white text-shadow-2xs border ${
                    isSelected ? "bg-gray-500 text-white border border-black" : "bg-gray-300"
                  }`}
                >
                  <div>{name}</div>
                </motion.div>
                );
              })}
            </div>
          </div>

          <div className="grid items-center grid-cols-3 mt-2">
            <div className="uppercase  text-right mr-2 ">Date from:</div>
            <input
              className="col-span-2 border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
              type="date"
            />
          </div>

          <div className="grid items-center grid-cols-3 mt-2">
            <div className="uppercase  text-right mr-2 ">Date To:</div>
            <input
              className="col-span-2 border bg-gray-200 rounded-sm px-3 py-1 cursor-pointer  shadow-md "
              type="date"
            />
          </div>
          <div className="font-normal py-2 text-gray-500 text-sm flex justify-center">
            <span className=" font-black mr-1">NOTE: </span>Report can be
            generated by Daily, Weekly and Monthly.
          </div>
          <div className="flex justify-end">
            <div className="px-3 border-2 flex gap-2 border-blue-900 hover:bg-blue-700 transition-all cursor-pointer rounded-sm text-white uppercase py-1 bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5"
              >
                <path
                  fillRule="evenodd"
                  d="M9.75 6.75h-3a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3v-7.5a3 3 0 0 0-3-3h-3V1.5a.75.75 0 0 0-1.5 0v5.25Zm0 0h1.5v5.69l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V6.75Z"
                  clipRule="evenodd"
                />
                <path d="M7.151 21.75a2.999 2.999 0 0 0 2.599 1.5h7.5a3 3 0 0 0 3-3v-7.5c0-1.11-.603-2.08-1.5-2.599v7.099a4.5 4.5 0 0 1-4.5 4.5H7.151Z" />
              </svg>
              Export
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="  w-full flex flex-col bg-gray-300 border overflow-hidden rounded-md "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className=" font-black uppercase text-center text-2xl py-2 border-b bg-gray-400">
          <div> Callfile Performance</div>
          <div className="text-xs text-gray-600">
            {" "}
            Bucket: {selectedBucket ? selectedBucket?.name : "Select a bucket"}
          </div>
        </div>
        <div className="grid w-full gap-2 h-full p-2 grid-cols-3 grid-rows-4">
          <div className="border flex flex-col col-span-2 justify-center items-center row-span-2 rounded-sm bg-gray-200 p-3 overflow-auto">
            {callMethod && callMethod.length > 0 ? (
              callMethod.map((dd, index) => {
                const findDispotype = data?.getDispositionTypes.find(
                  (x) => x.code === dd.code
                );

                console.log;
                return (
                  <motion.div
                    key={index}
                    className="text-xs rounded-md items-center 2xl:text-base text-slate-900 font-medium flex-row flex gap-1 py-0.5 transition-all hover:font-bold w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      style={{
                        backgroundColor: `${
                          positive.includes(dd?.code)
                            ? `oklch(40.7% 0.194 149.214)`
                            : `oklch(50.7% 0.237 25.331)`
                        }`,
                      }}
                      className="px-2 font-black gap-4 py-1.5 justify-between flex text-gray-100 rounded-sm shadow-sm w-full"
                    >
                      <div className="whitespace-nowrap">{dd.code}</div>
                      <div className=" whitespace-nowrap">
                        {findDispotype?.name}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: `${
                          positive.includes(dd?.code)
                            ? `oklch(40.7% 0.194 149.214)`
                            : `oklch(50.7% 0.237 25.331)`
                        }`,
                      }}
                      className="text-center text-white py-1.5  rounded-sm font-black w-full"
                    >
                      {dispositionCount(dd.code)} -{" "}
                      {percentageOfDispo(dd.code).toFixed(2)}%
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div>No Items</div>
            )}
          </div>
          <div className="border col-span-1 row-span-2 rounded-sm bg-gray-200"></div>
          <div className="border col-span-3 row-span-2 rounded-sm bg-gray-200"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default QACallfileReport;
