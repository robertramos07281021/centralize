import { motion } from "framer-motion";
import { gql, useQuery } from "@apollo/client";

type DeptBranchBucket = {
  id: string;
  name: string;
};

const GET_DEPTx = gql`
  query getBranchDept {
    getBranchDept {
      name
    }
  }
`;

const CallFileContent = () => {
  const { loading, error, data } = useQuery<{ getBranchDept: DeptBranchBucket[] }>(
    GET_DEPTx
  );


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-5 flex h-full flex-col w-full">
      <div className="w-full mb-2 justify-between items-center flex">
        <div className="font-black uppercase text-2xl text-gray-400">
          CallFile Configuration
        </div>
        <div className="flex">
          <motion.div
            className="flex mr-4 items-center border shadow-sm border-gray-300 px-3 rounded-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>

            <input
              className="px-4 focus:outline-none"
              placeholder="Search..."
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", delay: 0.1 }}
          >
            <div className="bg-white h-full px-3 rounded-md shadow-sm border border-gray-300 cursor-pointer hover:bg-gray-100 transition-all items-center flex mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
          >
            <div className="bg-green-500 hover:bg-green-600 hover:text-green-950 hover:border-green-950 text-green-900 transition-all cursor-pointer flex py-2 px-3 items-center rounded-md shadow-md border-2 border-green-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
                className="size-5 mr-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <div className="font-black uppercase">Add Participant</div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-6 bg-gray-200 px-3 rounded-t-md py-2 font-semibold">
        <div>Assistant Name</div>
        <div>Voice Engine</div>
        <div>AI Model</div>
        <div>Phone Number</div>
        <div>Last Edited</div>
        <div>Activity</div>
      </div>

      <div className="overflow-auto flex rounded-b-md flex-col h-full">
        {data?.getBranchDept.map((dept, index) => (
          <motion.div
            key={dept.id}
            className="grid grid-cols-6 gap-3 bg-gray-100 items-center px-3 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div>{dept.name}</div>
            <div>Voice Engine</div>
            <div>AI Model</div>
            <div>Phone Number</div>
            <div>Last Edited</div>
            <div className="flex items-center">
              <div className="bg-green-300 px-3 py-1 flex items-center text-green-600 border h-full text-sm border-green-600 rounded-full">
                Active
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CallFileContent;
