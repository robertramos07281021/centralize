import { useEffect, useState, useRef } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";

const GET_RECORDINGS = gql`
  query GetRecordings($limit: Int) {
    recordings(limit: $limit) {
      name
      url
    }
  }
`;

const GET_ALL_BUCKETS = gql`
  query GetTLBucket {
    getTLBucket {
      _id
      viciIp
      name
    }
  }
`;

const BUCKET_AGENT = gql`
  query findDeptAgents {
    findDeptAgents {
      _id
      name
      user_id
      type
      isOnline
      isLock
      active
      attempt_login
      callfile_id
      vici_id
      buckets {
        name
      }
      departments {
        name
      }
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`;

const AGENT_RECORDING = gql`
  query getAgentDispositionRecords(
    $agentID: ID
    $limit: Int
    $page: Int
    $from: String
    $to: String
    $search: String
    $dispotype: [String]
    $ccsCalls: Boolean!
  ) {
    getAgentDispositionRecords(
      agentID: $agentID
      limit: $limit
      page: $page
      from: $from
      to: $to
      search: $search
      dispotype: $dispotype
      ccsCalls: $ccsCalls
    ) {
      dispositions {
        _id
        customer_name
        payment
        amount
        dispotype
        payment_date
        ref_no
        comment
        contact_no
        createdAt
        dialer
        callId
        recordings {
          name
          size
        }
      }
      total
      dispocodes
    }
  }
`;

type Bucket = {
  name: string;
};

type Department = {
  name: string;
};

type TLAgent = {
  _id: string;
  name: string;
  user_id: string;
  type: string;
  isOnline: boolean;
  isLock: boolean;
  active: boolean;
  attempt_login: number;
  callfile_id: string;
  buckets: Bucket[];
  departments: Department[];
  vici_id: string;
};

const Test = () => {
  const [isOpenBucket, setIsBucketOpen] = useState<boolean>(false);
  const [isOpenRecording, setIsRecordingOpen] = useState<boolean>(false);
  const [selectedBucket, setSelectedBucket] = useState<any | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const {
    data: agentRecordings,
    error,
    loading,
  } = useQuery(AGENT_RECORDING, {
    variables: {
      agentID: selectedAgent?._id,
      limit: 50,
      page: 1,
      from: null,
      to: null,
      search: "",
      dispotype: [],
      ccsCalls: true,
    },
    skip: !selectedAgent || !isOpenRecording,
  });

  console.log(
    "Dispositions:",
    agentRecordings?.getAgentDispositionRecords?.dispositions
  )

  console.log("Loading:", loading);
  console.log("Error:", error);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: tlAgentData } = useQuery<{
    findDeptAgents: TLAgent[];
  }>(BUCKET_AGENT, { notifyOnNetworkStatusChange: true });

  console.log(tlAgentData);
  const { data } = useQuery(GET_RECORDINGS, {
    notifyOnNetworkStatusChange: true,
    variables: selectedBucket
      ? { bucket: selectedBucket._id, limit: 10 }
      : undefined,
    skip: !selectedBucket,
  });

  console.log("Selected Agent:", selectedAgent);
  console.log("Agent Recordings:", agentRecordings);

  const { data: allBuckets } = useQuery(GET_ALL_BUCKETS);

  console.log(allBuckets);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsBucketOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("Selected Bucket:", selectedBucket);
  }, [selectedBucket]);

  console.log(data);
  return (
    <div className="p-5 gap-2 flex flex-col relative h-[90%] ">
      <div className="bg-gray-300 h-full p-2 gap-2 rounded-md border border-black w-full flex flex-col">
        <div className="flex h-[5%]">
          <div className="flex flex-col relative" ref={dropdownRef}>
            <div
              className={`" ${
                isOpenBucket ? "bg-gray-200" : ""
              } px-3 hover:bg-gray-200 cursor-pointer py-1 min-w-40 bg-gray-100 border border-black rounded-sm "`}
              onClick={() => setIsBucketOpen(!isOpenBucket)}
            >
              {selectedBucket ? selectedBucket.name : "Select a Bucket"}
            </div>
            <AnimatePresence>
              {isOpenBucket && (
                <motion.span
                  className="flex flex-col w-full absolute border border-black rounded-sm overflow-hidden top-10 left-0"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {allBuckets?.getTLBucket.map((bucket: any) => (
                    <div
                      key={bucket._id}
                      className="px-3 even:bg-gray-100 py-1 border-b hover:bg-gray-300 transition-all cursor-pointer border-gray-200 last:border-b-0 odd:bg-gray-50 "
                      onClick={() => {
                        setSelectedBucket(bucket);
                        setIsBucketOpen(false);
                      }}
                    >
                      {bucket.name}
                    </div>
                  ))}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* <div className="w-full bg-gray-100 border overflow-hidden border-black rounded-sm h-[95%] ">
          <div className="w-full grid items-center gap-2 px-3 uppercase font-black text-sm grid-cols-11 bg-gray-200 border-b h-[5%]">
            <div>Name</div>
            <div>VICI ID</div>
            <div>CALLFILE ID</div>
            <div>BUCKET</div>
            <div>CAMPAIGN</div>
            <div>ONLINE</div>
            <div>LOCK</div>
            <div>STATUS</div>
            <div className="col-span-2 text-center">TARGETS</div>
            <div>ACTION</div>
          </div>
          <div className="w-full bg-gray-100 h-[95%] overflow-auto">
            {tlAgentData?.findDeptAgents.map((agent: TLAgent) => (
              <div
                key={agent._id}
                className="w-full py-1 grid gap-2 items-center px-3 text-sm grid-cols-11 border-b last:border-b-0 h-10"
              >
                <div className="truncate">{agent.name}</div>
                <div>{agent.vici_id}</div>
                <div>{agent.callfile_id}</div>
                <div className=" truncate pr-2">
                  {agent.buckets.map((e) => e.name).join(", ") || (
                    <div className="text-gray-400 italic text-xs">
                      No bucket
                    </div>
                  )}
                </div>
                <div className=" truncate pr-2">
                  {agent.departments.map((e) => e.name).join(", ") || (
                    <div className="text-gray-400 italic text-xs">
                      No campaign
                    </div>
                  )}
                </div>
                <div>{agent.isOnline ? "Yes" : "No"}</div>
                <div>{agent.isLock ? "Yes" : "No"}</div>
                <div>{agent.active ? "Active" : "Inactive"}</div>
                <div className="col-span-2 text-center">ds</div>
                <div className="flex justify-end">
                  <div
                    onClick={() => {
                      setSelectedAgent(agent);
                      setIsRecordingOpen(true);
                    }}
                    className="bg-blue-600 w-8 border-2 border-blue-800 rounded-sm cursor-pointer h-8"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
      {data?.recordings?.map((rec: any) => {
        const audioURL = `http://172.16.24.31:3000/audio/${encodeURIComponent(
          rec.name
        )}`;

        return (
          <div
            key={rec.name}
            className="flex justify-between bg-white rounded p-2 my-1"
          >
            <span>{rec.name}</span>

            <a
              href={audioURL}
              download={rec.name}
              className="text-blue-600 underline"
            >
              Download
            </a>
          </div>
        );
      })}

      <div>
        {isOpenRecording && (
          <div className="flex justify-center items-center w-full h-full absolute top-0 left-0">
            <div className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm">
              {" "}
            </div>
            <div className="bg-gray-100 h-full border z-20 max-h-[90%] max-w-[90%] rounded-md overflow-hidden w-full ">
              <div className="bg-gray-400 text-xl py-2 items-center flex justify-center text-center border-b h-[8%] font-black uppercase w-full">
                Recordings
              </div>
              <div className="p-2 flex flex-col bg-gray-300 gap-2 h-[92%]">
                <div className="bg-gray-200 px-3 py-2 flex items-center justify-between h-[20%] rounded-md border font-black uppercase w-full">
                  <div></div>
                  <div className="bg-blue-600 px-3 text-white border-2 border-blue-800 rounded-sm text-shadow-2xs py-1">
                    Search
                  </div>
                </div>
                <div className="bg-gray-200 py-2 h-[80%] rounded-md border w-full overflow-auto">
                  {agentRecordings?.getAgentDispositionRecords?.dispositions?.map(
                    (disp: any) => (
                      <div key={disp._id} className="p-2 border-b">
                        <div className="font-bold">{disp.customer_name}</div>
                        <div className="text-sm text-gray-600">
                          {disp.createdAt}
                        </div>
                        <div className="text-sm">Dipo: {disp.dispotype}</div>

                        <div className="ml-3 mt-2">
                          {disp.recordings?.length ? (
                            disp.recordings.map((rec: any) => (
                              <div
                                key={rec.name}
                                className="flex justify-between bg-white rounded p-2 my-1"
                              >
                                <span>{rec.name}</span>

                                <a
                                  href={`/audio/${encodeURIComponent(
                                    rec.name
                                  )}`}
                                  download={rec.name}
                                  className="text-blue-600 underline"
                                >
                                  Download
                                </a>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400 text-sm">
                              No recordings
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;
