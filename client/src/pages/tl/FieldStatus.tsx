import React, { useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";

type Bucket = {
  _id: string;
  name: string;
};

type FieldUser = {
  _id: string;
  name?: string | null;
};

type CustomerAccount = {
  _id: string;
  fieldassigned?: string | null;
  forfield?: boolean | null;
  finished?: boolean | null;
};

const GET_TL_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
    }
  }
`;

const GET_BUCKET_FIELD_USERS = gql`
  query getBucketFieldUser($bucketId: ID) {
    getBucketFieldUser(bucketId: $bucketId) {
      _id
      name
    }
  }
`;

const GET_NOTIFICATIONS_BY_BUCKET = gql`
  query GetNotificationsByBucket($bucketId: ID!, $limit: Int) {
    getNotificationsByBucket(bucketId: $bucketId, limit: $limit) {
      _id
      task
      createdAt
      user {
        name
      }
      assigneeUser {
        name
      }
    }
  }
`;

const GET_CUSTOMERACCOUNTS_BY_BUCKET = gql`
  query GetCustomerAccountsByBucket($bucketId: ID!) {
    getCustomerAccountsByBucket(bucketId: $bucketId) {
      _id
      fieldassigned
      forfield
      finished
    }
  }
`;

const FieldStatus = () => {
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const { data: bucketData, loading: bucketLoading } = useQuery<{
    getTLBucket: Bucket[];
  }>(GET_TL_BUCKET);

  const buckets = bucketData?.getTLBucket ?? [];

  const { data: fieldUsersData, loading: fieldUsersLoading } = useQuery<{
    getBucketFieldUser: FieldUser[];
  }>(GET_BUCKET_FIELD_USERS, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const { data: notificationsData, loading: notificationsLoading } = useQuery(
    GET_NOTIFICATIONS_BY_BUCKET,
    {
      variables: { bucketId: selectedBucket?._id ?? null, limit: 50 },
      skip: !selectedBucket?._id,
      fetchPolicy: "no-cache",
    },
  );

  const { data: accountsData } = useQuery<{
    getCustomerAccountsByBucket: CustomerAccount[];
  }>(GET_CUSTOMERACCOUNTS_BY_BUCKET, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const fieldUsers = fieldUsersData?.getBucketFieldUser ?? [];
  const notifications = notificationsData?.getNotificationsByBucket ?? [];
  const bucketAccounts = accountsData?.getCustomerAccountsByBucket ?? [];

  const fieldAccounts = useMemo(
    () => bucketAccounts.filter((acc) => acc.forfield === true),
    [bucketAccounts],
  );

  const agentStatsMap = useMemo(() => {
    const map: Record<string, { tasks: number; completed: number }> = {};
    fieldUsers.forEach((user) => {
      const assigned = fieldAccounts.filter(
        (acc) => String(acc.fieldassigned) === String(user._id),
      );
      const completed = assigned.filter((acc) => acc.finished).length;
      map[String(user._id)] = { tasks: assigned.length, completed };
    });
    return map;
  }, [fieldUsers, fieldAccounts]);

  const formatNotificationTime = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 grid gap-2 grid-cols-3 bg-blue-100 h-full w-full">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-2 flex flex-col h-full border-blue-800 rounded-md"
      >
        <div className="bg-blue-500 border-b-2 font-black uppercase py-2 text-white text-center border-blue-800 text-shadow-2xs">
          Field status
        </div>
        <div className="h-full bg-blue-200 p-2">
          <div className="w-full flex justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBucketOpen((v) => !v)}
                className={` ${!selectedBucket?.name ? "bg-white" : "bg-gray-100"} min-w-40 flex justify-between items-center cursor-pointer gap-4 hover:bg-gray-100 px-3 py-1 border rounded-sm shadow-md `}
              >
                <div>
                  {bucketLoading
                    ? "Loading…"
                    : selectedBucket?.name || "Select Bucket"}
                </div>
                <div
                  className={`${isBucketOpen ? "rotate-90" : ""} transition-transform`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>
              <AnimatePresence>
                {isBucketOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 bg-white mt-2 w-56 border border-black  rounded-sm shadow-lg z-20"
                  >
                    <div className="max-h-56 overflow-y-auto">
                      {buckets.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          No buckets assigned.
                        </div>
                      ) : (
                        buckets.map((bucket) => (
                          <button
                            key={bucket._id}
                            type="button"
                            onClick={() => {
                              setSelectedBucket(bucket);
                              setIsBucketOpen(false);
                            }}
                            className={`w-full text-left px-3 cursor-pointer py-2 text-sm rounded-sm hover:bg-gray-100 transition-colors ${
                              selectedBucket?._id === bucket._id
                                ? "bg-gray-100"
                                : ""
                            }`}
                          >
                            {bucket.name}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="py-2 space-y-2 h-full items-center flex justify-center">
            {selectedBucket?._id && notificationsLoading ? (
              <div className="text-sm text-blue-900">
                Loading notifications…
              </div>
            ) : !selectedBucket?._id ? (
              <div className="text-xs text-gray-500 italic text-center">
                Select a bucket to view notifications.
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-xs text-gray-500 italic text-center">
                No notifications for this bucket.
              </div>
            ) : (
              <div className="h-full w-full">
                {notifications.map((note: any, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.5 }}
                    key={note._id}
                    className="border-2 flex items-center text-white font-semibold justify-between bg-blue-500 rounded-md p-2 border-blue-800"
                  >
                    <div className="first-letter:uppercase">
                      {String(note?.user?.name ?? "Someone")} assigned{" "}
                      {Number(note?.task ?? 0)} task
                      {Number(note?.task ?? 0) === 1 ? "" : "s"} to{" "}
                      {String(note?.assigneeUser?.name ?? "AGENT FIELD")}{" "}
                    </div>
                    <div className="font-normal text-xs whitespace-nowrap">
                      {formatNotificationTime(note?.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 border-2 border-blue-800 rounded-md flex flex-col h-full overflow-hidden"
      >
        <div className="bg-blue-500 text-center px-3 border-b-2 font-black uppercase py-2 text-white gap-2 border-blue-800 text-shadow-2xs">
          Field Members
        </div>
        <div className="h-full bg-blue-200 p-2 overflow-y-auto">
          {selectedBucket?._id && fieldUsersLoading ? (
            <div className="text-sm text-blue-900">Loading members…</div>
          ) : !selectedBucket?._id ? (
            <div className="text-xs text-gray-500 h-full items-center flex justify-center italic text-center">
              Select a bucket to view members.
            </div>
          ) : fieldUsers.length === 0 ? (
            <div className="text-xs text-gray-500 h-full items-center flex justify-center italic text-center">
              No field members found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {fieldUsers.map((user, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.5 }}
                  key={user._id}
                  className="bg-blue-500 text-shadow-2xs flex flex-col gap-2 text-white font-black uppercase text-center p-2 border-2 border-blue-800 rounded-sm"
                >
                  <div className="text-shadow-2xs">
                    {String(user.name ?? "Unknown")}
                  </div>

                  <div className="flex w-full gap-2">
                    <div className="flex w-full px-3 py-1 border-2 border-blue-800 gap-1 bg-blue-400 rounded-sm">
                      <div>Task:</div>
                      <div>{agentStatsMap[String(user._id)]?.tasks ?? 0}</div>
                    </div>

                    <div className="flex w-full px-3 py-1 border-2 border-blue-800 gap-1 bg-blue-400 rounded-sm">
                      <div>Completed Task:</div>
                      <div>
                        {agentStatsMap[String(user._id)]?.completed ?? 0}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FieldStatus;
