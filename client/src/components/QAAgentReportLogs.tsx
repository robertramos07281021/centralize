import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "../middleware/types.ts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

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

const GET_ALL_BUCKET = gql`
  query GetAllBucket {
    getAllBucket {
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
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

type DispositionType = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

type Agent = {
  _id: string;
  name: string;
};

const QAAgentReportLogs = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);

  console.log(userLogged?.type);

  const { data } = useQuery<{
    getDispositionTypes: DispositionType[];
  }>(GET_DISPOSITION_TYPES);

  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const { data: departmentBucket } = useQuery<{ getDeptBucket: Bucket[] }>(
    DEPT_BUCKET_QUERY
  );

  const { data: getallbuckets } = useQuery<{ getAllBucket: Bucket[] }>(
    GET_ALL_BUCKET
  );

  const bucketsData =
    userLogged?.type !== "QASUPERVISOR"
      ? departmentBucket?.getDeptBucket
      : getallbuckets?.getAllBucket;

  console.log(bucketsData);

  const { data: agentSelector } = useQuery<{ findAgents: Users[] }>(
    GET_DEPARTMENT_AGENT
  );

  let filteredAgents: Users[] | undefined = agentSelector?.findAgents;

  if (selectedBucket) {
    if (userLogged?.type === "QASUPERVISOR") {
      filteredAgents = agentSelector?.findAgents.filter((agent) =>
        agent.buckets?.some((b: any) => b._id === selectedBucket._id)
      );
    } else {
      filteredAgents = agentSelector?.findAgents.filter((agent) =>
        agent.buckets?.some((b: any) => b._id === selectedBucket._id)
      );
    }
  }
  console.log(filteredAgents)

  const dispositions = (data?.getDispositionTypes ?? []).filter(
    (dispo) => dispo.active
  );

  return (
    <div className="flex flex-row h-full p-10 gap-2  ">
      <motion.div
        className="bg-gray-300 max-w-[500px] w-full flex flex-col font-black text-black  border rounded-md shadow-md p-3 "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="text-center font-black uppercase w-full text-2xl ">
          Agent Report Logs
        </div>
        <div className="grid items-center grid-cols-3 mt-2">
          <div className="uppercase text-right mr-2 ">Bucket:</div>
          <div className="relative col-span-2 ">
            <div
              onClick={() => {
                if (isAgentOpen || !selectedAgent) {
                  setIsAgentOpen(false);
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
                    setIsAgentOpen(true);
                  }}
                  className="absolute z-20 overflow-hidden bg-gray-200 max-h-40 w-full mt-1 shadow-sm border rounded-sm "
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                >
                  {bucketsData?.map((bucket) => (
                    <div
                      onClick={() => setSelectedBucket(bucket)}
                      className="px-3 hover:bg-gray-300 odd:bg-gray-100 even:bg-white border-b border-gray-300 last:border-b-0 cursor-pointer py-1"
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
                  {agentSelector?.findAgents?.map((agent) => (
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
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-5  gap-2  flex flex-col h-full">
          <div className="text-center uppercase">select Disposition</div>
          <div className="bg-gray-200 max-h-[420px] grid grid-cols-2 items-center  overflow-auto  shadow-md border rounded-sm gap-1 p-2">
            <div className="text-sm uppercase py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-gray-400 bg-gray-300 border ">
              <div>select all</div>
            </div>
            {dispositions.map(({ id, name }, index) => (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                key={id}
                className="text-sm py-1 px-3 h-full items-center flex rounded-xs cursor-pointer hover:bg-gray-400 bg-gray-300 border "
              >
                <div>{name}</div>
              </motion.div>
            ))}
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
      </motion.div>

      <motion.div
        className="  w-full bg-gray-300 border overflow-hidden rounded-md "
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
      >
        <div className=" font-black uppercase text-center text-2xl py-2 border-b bg-gray-400">
          {" "}
          Agent Performance
        </div>
      </motion.div>
    </div>
  );
};

export default QAAgentReportLogs;
