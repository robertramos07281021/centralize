import { useLocation } from "react-router-dom";
import UpdateUserForm from "./UpdateUserForm";
import { gql, useQuery } from "@apollo/client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MODIFY_RECORD_QUERY = gql`
  query Query($id: ID!) {
    getModifyReport(id: $id) {
      id
      name
      createdAt
    }
  }
`;

type ModifyRecords = {
  id: string;
  name: string;
  createdAt: string;
};

const UserView = () => {
  const location = useLocation();
  const state = location.state;
  const { data, refetch } = useQuery<{ getModifyReport: ModifyRecords[] }>(
    MODIFY_RECORD_QUERY,
    {
      variables: { id: state?._id },
      skip: !state?._id,
      notifyOnNetworkStatusChange: true,
    }
  );

  useEffect(() => {
    const timer = async () => {
      await refetch();
    };
    timer()
  }, [state, refetch]);

  return (
    <AnimatePresence>
      <div className="h-full flex flex-col overflow-hidden justify-center items-center ">
        <motion.div
          className="bg-black/40  w-full h-full top-0 left-0 absolute z-10 "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {" "}
        </motion.div>
        <motion.div
          className="z-20 bg-white overflow-hidden py-5 flex flex-col relative px-20 w-full"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <div className="h-full flex items-center overflow-hidden relative ">
            <div className="h-full w-full flex flex-row relative ">
              <UpdateUserForm state={state} />
              <div className="rounded-lg border w-5/8 border-gray-600 shadow-md mb-1 flex flex-col overflow-y-auto">
                <div className="grid grid-cols-2 border-b border-gray-600 py-1.5 font-black uppercase px-2 bg-gray-200">
                  <div>Name</div>
                  <div>Date</div>
                </div>
                {data?.getModifyReport?.map((mr) => (
                  <div
                    key={mr.id}
                    className="grid grid-cols-2 py-1.5 px-2 odd:bg-slate-100"
                  >
                    <div className="text-slate-700 font-medium text-base">
                      {mr.name}
                    </div>
                    <div className="text-slate-600 text-sm">
                      {new Date(mr.createdAt).toLocaleDateString()} -{" "}
                      {new Date(mr.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserView;
