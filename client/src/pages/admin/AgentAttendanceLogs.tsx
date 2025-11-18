import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GET_ALL_BUCKETS = gql`
  query GetDepts {
    getDepts {
      branch
      id
      name
    }
  }
`;

const GET_USERS = gql`
  query GetUser($getUserId: ID) {
    getUser(id: $getUserId) {
      _id
      account_type
      user_id
      name
      type
      username
    }
  }
`;

type USER_DATA = {
  _id: string;
  account_type: string;
  user_id: string;
  name: string;
  type: string;
  username: string;
};

type ALL_BUCKETS = {
  _id: string;
  name: string;
  branch: string;
};

const AgentAttendanceLogs = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useQuery<{
    getDepts: ALL_BUCKETS[];
  }>(GET_ALL_BUCKETS);

  const { data: getUserData } = useQuery<{ getUsers: USER_DATA }>(GET_USERS, {
    variables: { getUserId: "" },
  });

  console.log(getUserData, "<=== getUserData");

  const [selectedBucket, setSelectedBucket] = useState<ALL_BUCKETS | null>(
    null
  );
  return (
    <div className="px-10 pt-2 pb-5 flex w-full h-full">
      <div className="w-full flex flex-col gap-2 h-full">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="">
              <motion.div onClick={() => setIsOpen(!isOpen)} layout>
                <div className="bg-gray-200 relative z-20 cursor-pointer hover:bg-gray-300 transition-all px-2 flex gap-3 py-1 rounded-sm shadow-md border">
                  <div>
                    {selectedBucket?.name
                      ? selectedBucket?.name
                      : "Select a bucket"}
                  </div>
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
                  layout
                >
                  <div className="absolute flex flex-col max-h-80 overflow-auto z-20 border bg-gray-100  shadow-md  transition-all cursor-pointer rounded-sm  mt-1">
                    {data?.getDepts?.map((bucket) => (
                      <div
                        onClick={() =>
                          setSelectedBucket(bucket.name ? bucket : null)
                        }
                        className="px-3 py-1 odd:bg-gray-200 even:bg-gray-100 hover:bg-gray-300 transition-all "
                        key={bucket._id}
                      >
                        {bucket.name}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-8 gap-4 font-black uppercase rounded-t-md border px-4 bg-gray-300 py-2 roou">
            <div>No. Agent</div>
            <div>Agent</div>
            <div>Type</div>
            <div>Call Answered</div>
            <div>Duration</div>
            <div>Average</div>
            <div>Longest Call</div>
          </div>
          <div className="py-2 text-center font-black text-gray-400 italic border-x border-b rounded-b-md shadow-md border-black  bg-gray-200 overflow-y-auto">
            No agent found
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAttendanceLogs;
