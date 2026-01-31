import { useEffect, useMemo, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import Lottie from "lottie-react";
import loadingAnimation from "../../Animations/Businessman flies up with rocket.json";

type Bucket = {
  _id: string;
  name: string;
  dept?: string | null;
};

type FieldUser = {
  _id: string;
  name?: string | null;
};

type CustomerAccount = {
  _id: string;
  customerName?: string | null;
  customer?: string | null;
  fieldassigned?: string | null;
  forfield?: boolean | null;
  finished?: boolean | null;
};

const GET_TL_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
      dept
    }
  }
`;

const GET_BUCKET = gql`
  query GetBucket($name: String) {
    getBucket(name: $name) {
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

const GET_CUSTOMERACCOUNTS_BY_BUCKET = gql`
  query GetCustomerAccountsByBucket($bucketId: ID!) {
    getCustomerAccountsByBucket(bucketId: $bucketId) {
      _id
      customer
      customerName
      fieldassigned
      forfield
      finished
    }
  }
`;

const GET_FIELD_TASKS_BY_BUCKETS = gql`
  query GetFieldTasksByBuckets($bucketIds: [ID!]!) {
    getFieldTasksByBuckets(bucketIds: $bucketIds) {
      bucket
      total
    }
  }
`;

const GET_FIELD_DISPOSITIONS_BY_USERS = gql`
  query GetFieldDispositionsByUsers($userIds: [ID!]!, $accountIds: [ID!]!) {
    getFieldDispositionsByUsers(userIds: $userIds, accountIds: $accountIds) {
      _id
      amount
      payment_method
      payment
      payment_date
      ref_no
      rfd
      sof
      comment
      createdAt
      user
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

const GET_NOTIFICATIONS_BY_ASSIGNEE = gql`
  query GetNotificationsByAssignee($assigneeId: ID!, $limit: Int) {
    getNotificationsByAssignee(assigneeId: $assigneeId, limit: $limit) {
      _id
      task
      code
      bucket
      createdAt
      user {
        name
        user_id
      }
    }
  }
`;

const TLFieldDashboard = () => {
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isRiderOpen, setIsRiderOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<FieldUser | null>(null);
  const riderOpenTimerRef = useRef<number | null>(null);
  const [openDispoId, setOpenDispoId] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);

  const { userLogged } = useSelector((state: RootState) => state.auth);

  const { data: notificationData } = useQuery(GET_NOTIFICATIONS_BY_ASSIGNEE, {
    variables: { assigneeId: userLogged?._id ?? null, limit: 20 },
    skip: !userLogged?._id,
    fetchPolicy: "no-cache",
  });

  const notifications = (
    notificationData?.getNotificationsByAssignee ?? []
  ).filter((n: any) => n.code === 2);

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

  const { data: bucketsData, loading: bucketsLoading } = useQuery<{
    getTLBucket: Bucket[];
  }>(GET_TL_BUCKET);

  const buckets = bucketsData?.getTLBucket ?? [];

  const bucketIds = useMemo(() => buckets.map((b) => b._id), [buckets]);

  const { data: bucketTasksData } = useQuery(GET_FIELD_TASKS_BY_BUCKETS, {
    variables: { bucketIds },
    skip: bucketIds.length === 0,
    fetchPolicy: "no-cache",
  });

  const bucketTaskMap = useMemo(() => {
    const rows = bucketTasksData?.getFieldTasksByBuckets ?? [];
    return rows.reduce((acc: Record<string, number>, row: any) => {
      acc[String(row.bucket)] = row.total ?? 0;
      return acc;
    }, {});
  }, [bucketTasksData]);

  const { data: fieldUsersData, loading } = useQuery<{
    getBucketFieldUser: FieldUser[];
  }>(GET_BUCKET_FIELD_USERS, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const fieldUsers = fieldUsersData?.getBucketFieldUser ?? [];

  const { data: caData } = useQuery<{
    getCustomerAccountsByBucket: CustomerAccount[];
  }>(GET_CUSTOMERACCOUNTS_BY_BUCKET, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const bucketAccounts = caData?.getCustomerAccountsByBucket ?? [];

  const fieldAccounts = useMemo(
    () => bucketAccounts.filter((acc) => acc.forfield === true),
    [bucketAccounts],
  );

  const accountIds = useMemo(
    () => fieldAccounts.map((acc) => acc._id),
    [fieldAccounts],
  );

  const userIds = useMemo(() => fieldUsers.map((u) => u._id), [fieldUsers]);

  const { data: fieldDispoByUsersData } = useQuery(
    GET_FIELD_DISPOSITIONS_BY_USERS,
    {
      variables: { userIds, accountIds },
      skip: userIds.length === 0 || accountIds.length === 0,
      fetchPolicy: "no-cache",
    },
  );

  const fieldDisposByUsers =
    fieldDispoByUsersData?.getFieldDispositionsByUsers ?? [];

  const agentStats = useMemo(() => {
    return fieldUsers.map((user) => {
      const assigned = fieldAccounts.filter(
        (acc) => String(acc.fieldassigned) === String(user._id),
      );

      const completed = assigned.filter((acc) => acc.finished).length;

      const disposForUser = fieldDisposByUsers.filter(
        (dispo: any) => String(dispo.user) === String(user._id),
      );

      const disposSorted = disposForUser
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      const taskItems = assigned.map((acc) => {
        const disposForAccount = disposForUser
          .filter(
            (dispo: any) =>
              String(dispo?.customer_account?._id) === String(acc._id),
          )
          .slice()
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        return {
          account: acc,
          latestDispo: disposForAccount[0] || null,
        };
      });

      const amountCollected = disposForUser.reduce(
        (sum: number, dispo: any) => {
          const rawAmount = dispo?.amount;
          const parsedAmount =
            typeof rawAmount === "number"
              ? rawAmount
              : typeof rawAmount === "string"
                ? Number(rawAmount)
                : 0;
          const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
          return sum + (safeAmount > 0 ? safeAmount : 0);
        },
        0,
      );

      const latestDispo = disposSorted[0];

      return {
        user,
        tasks: assigned.length,
        completed,
        amountCollected,
        latestDispo,
        disposSorted,
        taskItems,
      };
    });
  }, [fieldUsers, fieldAccounts, fieldDisposByUsers]);

  const selectedRiderStats = useMemo(() => {
    if (!selectedRider) return null;
    return agentStats.find(
      (stat) => String(stat.user._id) === String(selectedRider._id),
    );
  }, [agentStats, selectedRider]);

  const openRiderWithDelay = (rider: FieldUser) => {
    setSelectedRider(rider);
    setIsBucketOpen(false);
    setOpenDispoId(null);
    if (riderOpenTimerRef.current) {
      window.clearTimeout(riderOpenTimerRef.current);
    }
    riderOpenTimerRef.current = window.setTimeout(() => {
      setIsRiderOpen(true);
      riderOpenTimerRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (riderOpenTimerRef.current) {
        window.clearTimeout(riderOpenTimerRef.current);
      }
    };
  }, []);

  const backToBucket = () => {
    setIsRiderOpen(false);
    setOpenDispoId(null);
    if (riderOpenTimerRef.current) {
      window.clearTimeout(riderOpenTimerRef.current);
    }
    riderOpenTimerRef.current = window.setTimeout(() => {
      setIsBucketOpen(true);
      riderOpenTimerRef.current = null;
    }, 300);
  };
  return (
    <div className="p-4 overflow-auto relative flex flex-col gap-4 bg-blue-50 max-h-[90dvh] h-full">
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsNotificationOpen(false)}
            className="absolute top-0 left-0 w-full h-full bg-black/20 backdrop-blur-sm z-20"
          ></motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute z-30 border-2 rounded-md overflow-hidden text-white border-green-800 bg-green-600 top-2 right-2"
          >
            <div className="h-full">
              <div className="p-2 px-10 text-center items-center flex justify-center border-b-2 border-blue-900 font-black uppercase">
                Notification
                <div
                  onClick={() => setIsNotificationOpen(false)}
                  className="absolute right-2 p-1 bg-red-600 rounded-full border-2 border-red-800 cursor-pointer"
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
              <div className="bg-green-200 font-semibold p-4 text-black max-h-60 overflow-auto">
                {notifications.length === 0 ? (
                  <div className="text-sm text-gray-600 text-center">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notifications.map((note: any) => {
                      const bucketName =
                        buckets.find((b) => b._id === note?.bucket)?.name ??
                        note?.bucket ??
                        "Unknown";
                      return (
                        <div
                          key={note._id}
                          className="flex gap-4 justify-between items-center"
                        >
                          <div className="flex flex-col">
                            <div className="first-letter:uppercase">
                              {String(note?.user?.name ?? "Someone")} disposed
                              an account.
                            </div>
                            <div className="first-letter:uppercase text-center text-xs text-black/40">
                              {bucketName}
                            </div>
                          </div>
                          <div className="font-normal text-xs flex items-center whitespace-nowrap">
                            {formatNotificationTime(note?.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isNotificationOpen && (
        <div
          onClick={() => setIsNotificationOpen(true)}
          className="absolute top-2 z-20 right-2 p-1 border-green-800 rounded-full text-white border-2 bg-green-600 cursor-pointer"
        >
          {notifications.length > 0 && (
            <>
              <div className="p-1.5 z-30 bg-red-600 absolute -top-0.5 -left-1 rounded-full"></div>
              <div className="p-1.5 z-20 bg-red-600 absolute -top-0.5 -left-1 rounded-full animate-ping"></div>
            </>
          )}
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

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-2 border-blue-800 h-full flex flex-col rounded-md overflow-hidden bg-blue-500"
      >
        <div className="bg-blue-500 h-[5%] border-b-2 border-blue-800 items-center flex justify-center text-center font-black uppercase text-white">
          Campaign assigned
        </div>
        <div className="bg-blue-200 flex flex-col p-2 h-[95%]">
          {bucketsLoading ? (
            <div className="text-sm text-blue-900">Loading buckets…</div>
          ) : buckets.length === 0 ? (
            <div className="text-sm text-blue-900">No buckets assigned.</div>
          ) : (
            <div className=" flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 flex-col  overflow-auto h-full md:h-auto gap-2">
              {buckets.map((bucket) => (
                <div
                  key={bucket._id}
                  onClick={() => {
                    setSelectedBucket(bucket);
                    setIsBucketOpen(true);
                  }}
                  className="bg-blue-500 flex gap-2 md:cursor-pointer md:hover:bg-blue-600 transition-all items-center border-2 border-blue-800 p-2 font-black text-white rounded-sm"
                >
                  <div className="font-black w-full uppercase truncate">
                    {bucket.name}
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex uppercase gap-1">
                      <div>Task:</div>
                      <div>{bucketTaskMap[String(bucket._id)] ?? 0}</div>
                    </div>
                    <div className="font-normal whitespace-nowrap text-end w-full text-white/60 text-xs">
                      Click to view
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isBucketOpen && (
          <div className="absolute z-20 p-4 flex items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBucketOpen(false)}
              className="absolute md:cursor-pointer top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="z-20 w-full md:w-auto h-full md:h-auto relative flex flex-col border-2 border-blue-800 rounded-md overflow-hidden bg-blue-200"
            >
              <div
                onClick={() => setIsBucketOpen(false)}
                className="p-1 border-2 md:cursor-pointer rounded-full bg-red-600 text-white border-red-800 absolute top-2 right-1.5"
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
              <div className="px bg-blue-500 font-black uppercase text-white text-shadow-2xs text-center py-2 border-b-2 border-blue-800">
                {selectedBucket?.name || "Bucket"}
              </div>
              <div className="h-full p-2 gap-2 flex flex-col overflow-y-auto bg-blue-100">
                {loading && (
                  <div className="flex items-center justify-center  h-full w-full">
                    <div className=" w-40">
                      <Lottie animationData={loadingAnimation} />
                    </div>
                  </div>
                )}
                {agentStats.length === 0 ? (
                  <div className="text-sm p-5 text-gray-500 h-full items-center flex justify-center italic text-center">
                    No users for this bucket.
                  </div>
                ) : (
                  agentStats.map((stat) => (
                    <div
                      key={stat.user._id}
                      onClick={() => openRiderWithDelay(stat.user)}
                      className="bg-blue-300  md:cursor-pointer rounded-sm border-2 border-blue-800"
                    >
                      <div className="bg-blue-500 text-shadow-2xs border-b-2 border-blue-800 py-1 text-white uppercase font-black text-center">
                        {String(stat.user.name ?? "Unknown")}
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-2 font-semibold">
                        <div className="flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                          Task: {stat.tasks}
                        </div>
                        <div className="flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                          <div className="truncate">Completed Task:</div>
                          <div>{stat.completed}</div>
                        </div>
                        <div className="col-span-2 flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                          Amount Collected:{" "}
                          {stat.amountCollected.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          })}
                        </div>
                      </div>

                      <div className="px-2 pb-2 text-xs text-black/50 text-right">
                        Click to view all
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}

        {isRiderOpen && (
          <div className="absolute z-20 p-4 flex items-center justify-center top-0 left-0 w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRiderOpen(false)}
              className="absolute top-0 left-0 md:cursor-pointer w-full h-full bg-black/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="z-20 w-full  md:w-auto h-full md:h-auto relative flex flex-col border-2 border-blue-800 rounded-md overflow-hidden bg-blue-200"
            >
              <div
                onClick={() => setIsRiderOpen(false)}
                className="p-1 border-2  md:cursor-pointer  md:hover:bg-red-700 transition-all rounded-full bg-red-600 text-white border-red-800 absolute top-2 right-1.5"
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

              <div
                onClick={backToBucket}
                className="p-1 border-2 md:cursor-pointer md:hover:bg-amber-700 transition-all rounded-full bg-amber-600 text-white border-amber-800 absolute top-2 left-1.5"
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
                    d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18"
                  />
                </svg>
              </div>
              <div className="px bg-blue-500 font-black uppercase text-white text-shadow-2xs text-center py-2 border-b-2 border-blue-800">
                {String(selectedRider?.name ?? "Rider")}
              </div>
              <div className="md:max-h-[60dvh] min-h-0 p-2 gap-2 flex flex-col bg-blue-100 overflow-y-auto">
                <div className="bg-blue-300 rounded-sm border-2 border-blue-800">
                  <div className="p-2 grid grid-cols-2 gap-2 font-semibold">
                    <div className="flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                      Task: {selectedRiderStats?.tasks ?? 0}
                    </div>
                    <div className="flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                      <div className="truncate">Completed Task:</div>
                      <div>{selectedRiderStats?.completed ?? 0}</div>
                    </div>
                    <div className="col-span-2 flex gap-1 text-sm text-white items-center py-1 justify-center bg-blue-500 border-2 border-blue-800 rounded-sm px-1">
                      Amount Collected:{" "}
                      {(
                        selectedRiderStats?.amountCollected ?? 0
                      ).toLocaleString("en-PH", {
                        style: "currency",
                        currency: "PHP",
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-200 h-full min-h-0 flex flex-col rounded-sm border-2 border-blue-800">
                  <div className="bg-blue-500 text-shadow-2xs border-b-2 border-blue-800 py-1 text-white uppercase font-black text-center ">
                    ALL task
                  </div>
                  <div
                    className={` ${selectedRiderStats?.latestDispo ? "" : "items-center flex justify-center"} p-2 flex flex-col gap-2 font-semibold h-full min-h-0 `}
                  >
                    <div
                      className={` flex w-full flex-col h-full min-h-0 text-sm text-white rounded-sm `}
                    >
                      <AnimatePresence>
                        {selectedRiderStats?.taskItems?.length ? (
                          <div className="transition-all w-full flex flex-col gap-2 overflow-y-auto min-h-0">
                            {selectedRiderStats.taskItems.map((task: any) => (
                              <motion.div
                                layout
                                key={task?.account?._id}
                                className="border-2 md:cursor-pointer  border-blue-800 rounded-sm bg-blue-300"
                              >
                                <div
                                  className={` ${
                                    openDispoId === task?.account?._id
                                      ? "border-b-2"
                                      : ""
                                  } bg-blue-500 overflow-hidden relative text-center border-blue-800 p-2 "`}
                                  onClick={() => {
                                    const nextOpen =
                                      openDispoId === task?.account?._id
                                        ? null
                                        : task?.account?._id;
                                    setOpenDispoId(nextOpen);
                                  }}
                                >
                                  <div className="uppercase">
                                    {String(
                                      task?.account?.customerName || "Unknown",
                                    )}
                                  </div>
                                  <div className="text-center text-[0.7rem]">
                                    <div>
                                      {task?.latestDispo?.createdAt ? (
                                        new Date(
                                          task.latestDispo.createdAt,
                                        ).toLocaleString()
                                      ) : (
                                        <div className="text-xs text-blue-400">
                                          Not yet disposed
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-black/60 absolute bottom-0 text-xs right-0 m-2 flex justify-end">
                                    {openDispoId === task?.account?._id
                                      ? "See less"
                                      : "See all"}
                                  </div>
                                  {task?.latestDispo?.createdAt ? (
                                    <div className="absolute border-2 border-green-800 text-[0.5rem] py-1 font-black uppercase top-3 -left-5 w-22 bg-green-600 -rotate-45">
                                      Finished
                                    </div>
                                  ) : (
                                    <div className="absolute border-2 border-red-900 text-[0.5rem] py-1 font-black uppercase top-3 -left-5 w-22 bg-red-600 -rotate-45">
                                      ongoing
                                    </div>
                                  )}
                                </div>
                                <AnimatePresence>
                                  {openDispoId === task?.account?._id && (
                                    <motion.div
                                      initial={{ y: -5, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      className="bg-blue-300 grid grid-cols-2 text-[0.8rem] gap-2 p-2"
                                    >
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Disposition Type:</div>
                                        <div>
                                          {task?.latestDispo?.disposition
                                            ?.name || (
                                            <div className="text-xs text-blue-400">
                                              No disposition
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Payment Method:</div>
                                        <div>
                                          {task?.latestDispo
                                            ?.payment_method || (
                                            <div className="text-xs text-blue-400">
                                              No payment method
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Payment Type:</div>
                                        <div>
                                          {task?.latestDispo?.payment || (
                                            <div className="text-xs text-blue-400">
                                              No payment type
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Payment Date:</div>
                                        <div>
                                          {task?.latestDispo?.payment_date || (
                                            <div className="text-xs text-blue-400">
                                              No payment date
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Amount:</div>
                                        <div>
                                          {task?.latestDispo?.amount || (
                                            <div className="text-xs text-blue-400">
                                              Noamount
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Reference:</div>
                                        <div>
                                          {task?.latestDispo?.ref_no || (
                                            <div className="text-xs text-blue-400">
                                              No reference number
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>RFD:</div>
                                        <div>
                                          {task?.latestDispo?.rfd || (
                                            <div className="text-xs text-blue-400">
                                              No RFD
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>SOF:</div>
                                        <div>
                                          {task?.latestDispo?.sof || (
                                            <div className="text-xs text-blue-400">
                                              No SOF
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-col col-span-2 bg-blue-500 p-2 border-2 border-blue-800 rounded-sm">
                                        <div>Comment:</div>
                                        <div>
                                          {task?.latestDispo?.comment || (
                                            <div className="text-xs text-blue-400">
                                              No comment
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs p-2 text-center italic text-black/80">
                            No current disposition.
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TLFieldDashboard;
