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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: tlAgentData } = useQuery<{
    findDeptAgents: TLAgent[];
  }>(BUCKET_AGENT, { notifyOnNetworkStatusChange: true });

  console.log(tlAgentData);
  const { data, refetch } = useQuery(GET_RECORDINGS, {
    notifyOnNetworkStatusChange: true,
    variables: selectedBucket
      ? { bucket: selectedBucket._id, limit: 10 }
      : undefined,
    skip: !selectedBucket,
  });

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

        <div className="w-full bg-gray-100 border overflow-hidden border-black rounded-sm h-[95%] ">
          <div className="w-full grid items-center px-3 uppercase font-black text-sm grid-cols-11 bg-gray-200 border-b h-[5%]">
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
                className="w-full py-1 grid items-center px-3 text-sm grid-cols-11 border-b last:border-b-0 h-10"
              >
                <div>{agent.name}</div>
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
                    onClick={() => setIsRecordingOpen(true)}
                    className="bg-blue-600 w-8 border-2 border-blue-800 rounded-sm cursor-pointer h-8"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* {data?.recordings.map((rec: any) => {
        const audioURL = `/audio/${encodeURIComponent(rec.name)}`;
        return (
          <div key={rec.name} className="flex gap-2">
            {rec.name}
            <br />
            <a href={audioURL} download={rec.name}>
              Download
            </a>
          </div>
        );
      })} */}

      {isOpenRecording && (
        <div className="flex justify-center items-center w-full h-full absolute top-0 left-0">
          <div className="absolute top-0 left-0 w-full z-10 h-full bg-black/40 backdrop-blur-sm">
            {" "}
          </div>
          <div className="bg-gray-100 h-full border z-20 max-h-[90%] max-w-[90%] rounded-md overflow-hidden w-full ">
            <div className="bg-gray-400 text-xl py-2 items-center flex justify-center text-center border-b h-[8%] font-black uppercase w-full">
              Recordings
            </div>
            <div className="p-2 flex flex-col bg-gray-300 gap-2 h-[92%]" >
              <div className="bg-gray-200 py-2 h-[20%] rounded-md border font-black uppercase w-full"></div>
              <div className="bg-gray-200 py-2 h-[80%] rounded-md border font-black uppercase w-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
