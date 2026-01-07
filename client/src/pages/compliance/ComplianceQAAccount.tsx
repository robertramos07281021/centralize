import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gql from "graphql-tag";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";

type Dept = {
  name: string;
  id: string;
};


const GET_ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

const GET_ALL_CAMPAIGNS = gql`
  query GetDepts {
    getDepts {
      name
      id
    }
  }
`;

const GET_ALL_QA_ACCOUNTS = gql`
  query GetQAUsers($page: Int!, $limit: Int!) {
    getQAUsers(page: $page, limit: $limit) {
      users {
        _id
        name
        active
        type
        buckets
        isOnline
        isLock
        departments
        scoreCardType
      }
      total
    }
  }
`;

const ComplianceQAAccount = () => {
  const { data, loading, error } = useQuery<{ getDepts: Dept[] }>(
    GET_ALL_CAMPAIGNS
  );
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [qaUsers, setQaUsers] = useState([]);
  const { data: bucketsData } = useQuery(GET_ALL_BUCKETS);
  const [page] = useState(1);
  const [limit] = useState(50);
  const { data: usersData, loading: usersLoading } = useQuery(
    GET_ALL_QA_ACCOUNTS,
    {
      variables: { page, limit },
    }
  );

  React.useEffect(() => {
    if (usersData?.getQAUsers?.users) {
      setQaUsers(usersData.getQAUsers.users);
    }
  }, [usersData]);

  const filteredUsers = React.useMemo(() => {
    if (!selectedDept) return qaUsers;
    return qaUsers.filter(
      (user) => user.departments && user.departments.includes(selectedDept.id)
    );
  }, [qaUsers, selectedDept]);

  console.log(bucketsData?.getAllBucket);

  return (
    <div className="p-5 w-full max-h-[90dvh] h-full">
      <motion.div
        className="bg-gray-300 shadow-md p-4 w-full h-full flex flex-col gap-2 border rounded-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="h-[5%] justify-between w-full flex items-center">
          <div className="  relative  ">
            <div
              onClick={() => {
                setIsDeptOpen(!isDeptOpen);
              }}
              className="py-1 px-3 items-center  border rounded-sm bg-gray-100 flex cursor-pointer gap-4 transition-all hover:bg-gray-200"
            >
              <div className="">
                {selectedDept ? selectedDept.name : "Select a Campaign"}
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <AnimatePresence>
              {isDeptOpen && (
                <motion.div
                  className="absolute mt-10 top-0 -left-0.5 bg-white shadow-md border rounded-md w-60 h-60 overflow-y-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {data?.getDepts
                    .filter((dept) => dept.name !== "ADMIN")
                    .map((dept) => (
                      <div
                        key={dept.id}
                        onClick={() => {
                          setSelectedDept(dept);
                          setIsDeptOpen(false);
                        }}
                        className="px-3 py-2 odd:bg-gray-100 even:bg-gray-200 border-b border-gray-300 hover:bg-gray-300 transition-all cursor-pointer"
                      >
                        {dept.name}
                      </div>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="px-3 border bg-white py-1 rounded-sm overflow-hidden">
            <input placeholder="Search..." className="bg-white outline-none" />
          </div>
        </div>
        <div className="h-[95%] bg-gray-100 rounded-sm border w-full overflow-hidden">
          <div className="grid h-[5%] items-center px-3 gap-2  font-black uppercase bg-gray-400 border-b grid-cols-4">
            <div>Name</div>
            <div>Campaign</div>
            <div>Buckets</div>
            <div className="text-center" >Online</div>
          </div>
          <div className="overflow-auto h-[95.5%]">
            {filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  className="grid grid-cols-4 hover:bg-gray-200 border-gray-400 gap-2 px-2 py-2 border-b lastborder-b-0 items-center bg-white odd:bg-gray-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <div className="first-letter:uppercase">{user.name}</div>
                  <div>
                    {user.departments &&
                    user.departments.length > 0 &&
                    data?.getDepts ? (
                      user.departments
                        .map((deptId) => {
                          const dept = data.getDepts.find(
                            (d) => d.id === deptId
                          );
                          return dept && dept.name !== "ADMIN" ? dept.name : null;
                        })
                        .filter(Boolean)
                        .join(", ") || (
                          <span className="text-xs text-gray-400 italic">No campaign</span>
                        )
                    ) : (
                      <span className="text-xs text-gray-400 italic">No campaign</span>
                    )}
                  </div>
                  <div>
                    {user.buckets &&
                    user.buckets.length > 0 &&
                    bucketsData?.getAllBucket ? (
                      user.buckets
                        .map((bucketId) => {
                          const bucket = bucketsData.getAllBucket.find(
                            (b) => b._id === bucketId
                          );
                          return bucket ? bucket.name : bucketId;
                        })
                        .join(", ")
                    ) : (
                      <span className="text-xs text-gray-400 italic">No buckets</span>
                    )}
                  </div>
                  <div className="flex text-center justify-center items-center ml-5">
                    {user.isOnline ? (
                      <span className="w-6 h-6 shadow-md rounded-full animate-pulse bg-green-500 "></span>
                    ) : (
                      <span className="w-6 h-6 shadow-md rounded-full bg-red-500 "></span>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-10">
                No QA users found.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplianceQAAccount;
