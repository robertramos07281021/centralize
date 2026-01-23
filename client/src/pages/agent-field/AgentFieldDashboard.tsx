import React, { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Lottie from "lottie-react";
import loadingAnimation from "../../Animations/Businessman flies up with rocket.json";

const GET_CUSTOMERACCOUNTS_ASSIGNED = gql`
  query GetCustomerAccountsAssigned($assigneeId: ID!) {
    getCustomerAccountsByAssignee(assigneeId: $assigneeId) {
      _id
      bucket
      callfile
      balance
      finished
    }
  }
`;

const GET_CALLFILES = gql`
  query GetBucketActiveCallfile($bucketIds: [ID]) {
    getBucketActiveCallfile(bucketIds: $bucketIds) {
      _id
      active
      approve
      bucket
    }
  }
`;

const GET_FIELD_DISPOSITIONS_BY_ACCOUNTS = gql`
  query GetFieldDispositionsByCustomerAccounts($accountIds: [ID!]!) {
    getFieldDispositionsByCustomerAccounts(accountIds: $accountIds) {
      _id
      amount
      customer_account
      callfile
    }
  }
`;

const GET_FIELD_DISPOSITIONS_BY_USER = gql`
  query GetFieldDispositionsByUser($limit: Int) {
    getFieldDispositionsByUser(limit: $limit) {
      _id
      createdAt
      disposition {
        name
        code
      }
      customer_account {
        _id
        customer {
          _id
          fullName
        }
      }
    }
  }
`;

const AgentFieldDashboard = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { userLogged } = useSelector((state: RootState) => state.auth);

  const { data: assignedData, loading: assignedLoading } = useQuery(
    GET_CUSTOMERACCOUNTS_ASSIGNED,
    {
      variables: { assigneeId: userLogged?._id ?? null },
      skip: !userLogged?._id,
      fetchPolicy: "no-cache",
    },
  );

  const assignedAccounts = assignedData?.getCustomerAccountsByAssignee ?? [];

  const bucketIds = useMemo(() => {
    const ids = assignedAccounts
      .map((item: any) => item.bucket)
      .filter(Boolean);
    return Array.from(new Set(ids));
  }, [assignedAccounts]);

  const { data: callfilesData, loading: callfilesLoading } = useQuery(
    GET_CALLFILES,
    {
      variables: { bucketIds },
      skip: bucketIds.length === 0,
      fetchPolicy: "no-cache",
    },
  );

  const activeCallfileIds = useMemo(() => {
    const callfiles = callfilesData?.getBucketActiveCallfile ?? [];
    return callfiles
      .filter((f: any) => f.approve !== false && f.active !== false)
      .map((f: any) => String(f._id));
  }, [callfilesData]);

  const activeAssignedAccountIds = useMemo(() => {
    return assignedAccounts
      .filter((acc: any) => activeCallfileIds.includes(String(acc.callfile)))
      .map((acc: any) => acc._id);
  }, [assignedAccounts, activeCallfileIds]);

  const { data: fieldDispoData, loading: fieldDispoLoading } = useQuery(
    GET_FIELD_DISPOSITIONS_BY_ACCOUNTS,
    {
      variables: { accountIds: activeAssignedAccountIds },
      skip: activeAssignedAccountIds.length === 0,
      fetchPolicy: "no-cache",
    },
  );

  const isLoading = assignedLoading || callfilesLoading || fieldDispoLoading;

  const { data: recentFieldDisposData } = useQuery(
    GET_FIELD_DISPOSITIONS_BY_USER,
    {
      variables: { limit: 20 },
      skip: !userLogged?._id,
      fetchPolicy: "no-cache",
    },
  );

  const totalCollected = useMemo(() => {
    const rows = fieldDispoData?.getFieldDispositionsByCustomerAccounts ?? [];
    return rows.reduce((sum: number, row: any) => {
      const amount = typeof row?.amount === "number" ? row.amount : 0;
      return sum + (amount > 0 ? amount : 0);
    }, 0);
  }, [fieldDispoData]);

  const totalAssignedBalance = useMemo(() => {
    return assignedAccounts
      .filter((acc: any) => activeCallfileIds.includes(String(acc.callfile)))
      .reduce((sum: number, acc: any) => {
        const balance = typeof acc?.balance === "number" ? acc.balance : 0;
        return sum + (balance > 0 ? balance : 0);
      }, 0);
  }, [assignedAccounts, activeCallfileIds]);

  const formattedTotalCollected = useMemo(() => {
    return totalCollected.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  }, [totalCollected]);

  const formattedTotalAssignedBalance = useMemo(() => {
    return totalAssignedBalance.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  }, [totalAssignedBalance]);

  const collectedPercent = useMemo(() => {
    if (totalAssignedBalance <= 0) return 0;
    return Math.min(100, (totalCollected / totalAssignedBalance) * 100);
  }, [totalAssignedBalance, totalCollected]);

  const activeAssignedAccounts = useMemo(() => {
    return assignedAccounts.filter((acc: any) =>
      activeCallfileIds.includes(String(acc.callfile)),
    );
  }, [assignedAccounts, activeCallfileIds]);

  const totalTasks = useMemo(
    () => activeAssignedAccounts.length,
    [activeAssignedAccounts],
  );

  const completedTasks = useMemo(() => {
    return activeAssignedAccounts.filter((acc: any) => acc?.finished).length;
  }, [activeAssignedAccounts]);

  const tasksPercent = useMemo(() => {
    if (totalTasks <= 0) return 0;
    return Math.min(100, (completedTasks / totalTasks) * 100);
  }, [completedTasks, totalTasks]);

  const currentMonthLabel = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long" });
  }, []);
  return (
    <div className="p-4 bg-blue-100 max-h-[90dvh] relative flex flex-col gap-2 h-full">
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm z-20"
          ></motion.div>
        )}
      </AnimatePresence>
      <div className="absolute z-20 top-2 right-2">
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${
            isNotificationOpen ? "rounded-sm " : "rounded-full relative p-1.5"
          } border-2  max-h-40 border-green-900  bg-green-600 text-white `}
        >
          {isNotificationOpen ? (
            <div>
              <div className="h-full">
                <div className="p-2 px-10 text-center items-center flex justify-center border-b-2 border-blue-900 font-black uppercase">
                  Notification
                  <div
                    onClick={() => setIsNotificationOpen(false)}
                    className="absolute right-2 p-1 bg-red-600 rounded-full border-2 border-red-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="4"
                      stroke="currentColor"
                      className="size-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="bg-green-200 font-semibold p-4 text-black">
                  <div className="flex gap-10 justify-between">
                    <div>Arnel just gave you 13 tasks.</div>
                    <div className="font-normal text-xs flex items-center">
                      13 mins ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => setIsNotificationOpen(true)}>
              <div className="p-1.5 z-30 bg-red-600 absolute -top-0.5 -left-1 rounded-full"></div>
              <div className="p-1.5 z-20 bg-red-600 absolute -top-0.5 -left-1 rounded-full animate-ping"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5"
              >
                <path
                  fillRule="evenodd"
                  d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </motion.div>
      </div>
      <motion.div
        className=" flex-col h-[20%] overflow-hidden bg-blue-600 border-2 border-blue-800 rounded-sm flex text-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-blue-600 w-full font-black border-b-2 border-blue-800 uppercase text-white py-2 ">
          Amount Collected
        </div>
        <div className="p-4 bg-blue-200 h-full gap-2 flex flex-col">
          <div className="">
            {formattedTotalCollected}/{formattedTotalAssignedBalance}
          </div>
          <div className="bg-green-200 h-10 rounded-full overflow-hidden shadow-md">
            <div
              className="bg-green-600 h-full transition-all"
              style={{ width: `${collectedPercent}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="flex-col  h-[20%] overflow-hidden bg-blue-600 border-2 border-blue-800 rounded-sm flex text-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-blue-600 w-full font-black border-b-2 border-blue-800 uppercase text-white py-2 ">
          Tasks Completed
        </div>
        <div className="p-4 bg-blue-200 gap-2 h-full flex flex-col">
          <div className="">
            {completedTasks} out of {totalTasks}
          </div>
          <div className="bg-green-200 h-10 rounded-full overflow-hidden shadow-md">
            <div
              className="bg-green-600 h-full transition-all"
              style={{ width: `${tasksPercent}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className=" h-[60%] flex-col bg-blue-600 border-2 border-blue-800 rounded-sm flex text-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-blue-600 w-full font-black border-b-2 border-blue-800 uppercase text-white py-2 ">
          OVERall performance month of {currentMonthLabel}
        </div>
        <div className="p-4 bg-blue-200 flex-1 min-h-0 gap-2 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {(recentFieldDisposData?.getFieldDispositionsByUser ?? []).length ===
          0 ? (
            <div className="text-sm text-gray-500 italic text-center">
              No field dispositions yet.
            </div>
          ) : (
            recentFieldDisposData?.getFieldDispositionsByUser?.map(
              (item: any) => (
                <div
                  key={item._id}
                  className="bg-blue-600 border-2 text-white p-2 grid grid-cols-3 border-blue-800 gap-2 rounded-sm w-full font-black"
                >
                  <div className="col-span-2 font-semibold truncate text-left items-center flex">
                    {String(
                      item?.customer_account?.customer?.fullName ?? "Unknown",
                    )}
                  </div>
                  <div className="col-span-1 items-center font-normal text-right w-full justify-end flex text-xs">
                    {String(item?.disposition?.name ?? "Unknown")}
                  </div>
                </div>
              ),
            )
          )}
          </div>
        </div>
      </motion.div>

      {isLoading && (
        <div className="absolute z-50 top-0 backdrop-blur-sm left-0 w-full h-full bg-blue-400/40 flex items-center justify-center">
          <div className="w-48">
            <Lottie animationData={loadingAnimation} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFieldDashboard;
