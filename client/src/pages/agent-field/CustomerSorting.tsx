import { useEffect, useRef, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import AgentBooked from "../agent-field/AgentBooked";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

type Customer = {
  id: string;
  name: string;
  address: string;
};

type Bucket = {
  _id: string;
  name: string;
  dept?: string | null;
  viciIp?: string | null;
};

type FieldUser = {
  _id: string;
  name?: string | null;
  user_id?: string | null;
  type?: string | null;
  vici_id?: string | null;
  softphone?: string | null;
  isOnline?: boolean | null;
  active?: boolean | null;
};

const GET_TL_BUCKET = gql`
  query getTLBucket {
    getTLBucket {
      _id
      name
      dept
      viciIp
    }
  }
`;

const GET_CALLFILES = gql`
  query GetBucketActiveCallfile($bucketIds: [ID]) {
    getBucketActiveCallfile(bucketIds: $bucketIds) {
      _id
      name
      active
      bucket
      approve
    }
  }
`;

const START_CUSTOMER = gql`
  mutation StartCustomer($id: ID!) {
    startCustomer(id: $id) {
      success
      message
      customer {
        _id
        started
      }
    }
  }
`;

const GET_BUCKET_FIELD_USERS = gql`
  query getBucketFieldUser($bucketId: ID) {
    getBucketFieldUser(bucketId: $bucketId) {
      _id
      name
      user_id
      type
      vici_id
      softphone
      isOnline
      active
    }
  }
`;

const GET_CUSTOMERACCOUNTS_ASSIGNED = gql`
  query GetCustomerAccountsAssigned($assigneeId: ID!) {
    getCustomerAccountsByAssignee(assigneeId: $assigneeId) {
      _id
      customerName
      bucket
      callfile
      addresses
      accountNumber
      forfield
      contact_no
      emails
      balance
      started
      finished
    }
  }
`;

const UPDATE_CUSTOMER_ORDER = gql`
  mutation UpdateCustomerOrder($id: ID!, $assignedOrder: Int!) {
    updateCustomerOrder(id: $id, assignedOrder: $assignedOrder) {
      success
      message
      customer {
        _id
        assignedOrder
      }
    }
  }
`;

const CustomerSorting = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBucketOpen, setIsBucketOpen] = useState<boolean>(false);
  const [isTLFieldOpen, setIsTLFieldOpen] = useState<boolean>(false);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const bucketDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isBooked, setIsBooked] = useState<boolean>(false);
  const [bookedCustomer, setBookedCustomer] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startedByBucket, setStartedByBucket] = useState<
    Record<string, string>
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = sessionStorage.getItem("startedByBucket");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [updateCustomerOrder] = useMutation(UPDATE_CUSTOMER_ORDER);

  const [startCustomer] = useMutation(START_CUSTOMER);

  const {
    data: assignedData,
    loading: assignedLoading,
    refetch: refetchAssigned,
  } = useQuery(GET_CUSTOMERACCOUNTS_ASSIGNED, {
    variables: { assigneeId: userLogged?._id ?? null },
    skip: !userLogged?._id,
    fetchPolicy: "no-cache",
  });
  const [customerOrder, setCustomerOrder] = useState<any[]>([]);
  const refreshAssigned = async () => {
    if (typeof refetchAssigned !== "function") return [];
    try {
      const r = await refetchAssigned();
      const arr = r?.data?.getCustomerAccountsByAssignee ?? [];
      const sorted = [...arr].sort(
        (a, b) => (a.assignedOrder ?? 0) - (b.assignedOrder ?? 0),
      );
      if (selectedBucket?._id) {
        const callfiles = callfilesData?.getBucketActiveCallfile ?? [];
        const activeCallfileIds = callfiles.map((f: any) => String(f._id));
        const filtered = sorted.filter(
          (c: any) =>
            c.bucket === selectedBucket._id &&
            activeCallfileIds.includes(String(c.callfile)),
        );
        setCustomerOrder(filtered);
      } else {
        setCustomerOrder([]);
      }
      return arr;
    } catch (err) {
      console.error("refreshAssigned failed:", err);
      return [];
    }
  };
  const activeStartedId = selectedBucket?._id
    ? startedByBucket[selectedBucket._id]
    : undefined;
  const globalStartedIds = Object.values(startedByBucket).filter(Boolean);
  const activeStartedGlobalId =
    globalStartedIds.length > 0 ? globalStartedIds[0] : undefined;
  const isAnyStartedGlobal = Boolean(activeStartedGlobalId);

  const {
    data: callfilesData,
    loading: callfilesLoading,
    refetch: callfilesRefetch,
  } = useQuery<{
    getBucketActiveCallfile: {
      _id: string;
      name: string;
      active?: boolean;
      approve?: boolean;
    }[];
  }>(GET_CALLFILES, {
    variables: { bucketIds: selectedBucket?._id ? [selectedBucket._id] : [] },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });


  useEffect(() => {
    const arr = assignedData?.getCustomerAccountsByAssignee ?? [];
    const sorted = [...arr].sort(
      (a, b) => (a.assignedOrder ?? 0) - (b.assignedOrder ?? 0),
    );

    if (!selectedBucket?._id) {
      setCustomerOrder([]);
      return;
    }

    if (callfilesLoading) return;

    const callfiles = callfilesData?.getBucketActiveCallfile ?? [];
    const activeCallfileIds = callfiles.map((f: any) => String(f._id));
    if (activeCallfileIds.length === 0) {
      setCustomerOrder([]);
      setStartedByBucket((prev) => {
        const next = { ...prev };
        delete next[selectedBucket._id];
        return next;
      });
      return;
    }
    const anyNotApproved = callfiles.some((f: any) => f.approve === false);
    if (anyNotApproved) {
      setCustomerOrder([]);
      return;
    }

    if (selectedBucket?._id) {
      const filtered = sorted.filter(
        (c: any) =>
          c.bucket === selectedBucket._id &&
          activeCallfileIds.includes(String(c.callfile)),
      );
      const nextStarted: Record<string, string> = {};
      for (const item of filtered) {
        if (item.started && !item.finished && item.bucket) {
          nextStarted[item.bucket] = item._id;
          break;
        }
      }
      setStartedByBucket((prev) => {
        const next = { ...prev };
        if (nextStarted[selectedBucket._id]) {
          next[selectedBucket._id] = nextStarted[selectedBucket._id];
        } else {
          delete next[selectedBucket._id];
        }
        return next;
      });
      setCustomerOrder(filtered);
    }
  }, [assignedData, selectedBucket, callfilesData, callfilesLoading]);

  const { data: tlBucketData, loading: tlBucketLoading } = useQuery<{
    getTLBucket: Bucket[];
  }>(GET_TL_BUCKET);

  const buckets = tlBucketData?.getTLBucket ?? [];

  const { data: fieldUsersData, loading: fieldUsersLoading } = useQuery<{
    getBucketFieldUser: FieldUser[];
  }>(GET_BUCKET_FIELD_USERS, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !isTLFieldOpen || !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const fieldUsers = fieldUsersData?.getBucketFieldUser ?? [];

  const hasSelection = selectedIds.length > 0;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCustomerOrder = normalizedSearch
    ? customerOrder.filter((c) => {
        const name = String(c.customerName ?? "").toLowerCase();
        const addresses = Array.isArray(c.addresses)
          ? c.addresses.join(" ").toLowerCase()
          : "";
        return (
          name.includes(normalizedSearch) ||
          addresses.includes(normalizedSearch)
        );
      })
    : customerOrder;
  const canReorder = normalizedSearch.length === 0;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCardClick = (id: string) => {
    if (selectedIds.length > 0) {
      toggleSelected(id);
      return;
    }
    setSelectedIds([id]);
  };

  useEffect(() => {
    if (!isBucketOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const root = bucketDropdownRef.current;
      if (root && !root.contains(target)) {
        setIsBucketOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBucketOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBucketOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "startedByBucket",
        JSON.stringify(startedByBucket),
      );
    } catch {}
  }, [startedByBucket]);

  return (
    <div className="p-4 h-[90dvh] relative w-full gap-4 flex flex-col bg-blue-50 overflow-hidden">
      <div className=" hidden md:flex text-gray-400 italic items-center justify-center w-full h-full">
        <div>Go back to the mobile view.</div>
      </div>
      <div className="flex flex-col gap-4 h-full w-full md:hidden">
        <div className="text-xs font-semibold text-slate-600 -mt-2">
          Drag customers to reorder.
        </div>
        <div className="flex gap-2 w-full">
          <div className="border px-3 py-1 w-full items-center flex rounded-sm shadow-md bg-white">
            <input
              placeholder="Search..."
              className="w-full outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div ref={bucketDropdownRef} className="h-full w-full relative">
            <button
              type="button"
              onClick={() => setIsBucketOpen((v) => !v)}
              className="min-w-40 rounded-sm border shadow-md w-full h-full bg-white justify-between items-center px-3 py-1 flex"
            >
              <div className="truncate pr-2">
                {tlBucketLoading
                  ? "Loading…"
                  : selectedBucket?.name || "Select Bucket"}
              </div>
              <div
                className={`${isBucketOpen ? "rotate-90" : ""} transition-transform`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </button>
            <AnimatePresence>
              {isBucketOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 rounded-sm border bg-white shadow-lg z-20 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto">
                    {buckets.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No buckets assigned.
                      </div>
                    ) : (
                      buckets.map((b) => (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => {
                            setSelectedBucket(b);
                            setIsBucketOpen(false);
                            setSelectedIds([]);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                            selectedBucket?._id === b._id
                              ? "bg-blue-100 font-semibold"
                              : ""
                          }`}
                        >
                          <div className="truncate">{b.name}</div>
                          {b.dept ? (
                            <div className="text-xs text-gray-500 truncate">
                              {b.dept}
                            </div>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {assignedLoading && selectedBucket && (
          <motion.div
            className="w-full h-full flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative h-20 w-20 flex justify-center bg-blue-200 rounded-full shadow-md items-center">
              <div className="text-xs text-gray-500 absolute">Loading...</div>
              <div className="w-full h-full border-t animate-spin rounded-full"></div>
            </div>
          </motion.div>
        )}

        {!selectedBucket ? (
          <div className="text-sm text-gray-500 text-center flex justify-center items-center h-full italic col-span-full">
            Select a bucket first.
          </div>
        ) : assignedLoading ? null : callfilesData?.getBucketActiveCallfile?.some(
            (f: any) => f.approve === false,
          ) ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
            <div className="text-lg font-bold text-gray-400 mb-2">
              No field accounts.
            </div>
            <div className="text-sm text-gray-500">
              Ask your AOM to approve the callfile first.
            </div>
          </div>
        ) : customerOrder.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
            <div className="text-lg font-bold text-gray-400 mb-2">
              No customers assigned.
            </div>
            <div className="text-sm text-gray-500">
              Please contact your administrator to get customers assigned to
              you.
            </div>
          </div>
        ) : null}

        <Reorder.Group
          axis="y"
          values={filteredCustomerOrder}
          layoutScroll
          onReorder={(newOrder) => {
            if (!canReorder) return;
            setCustomerOrder(newOrder);

            (async () => {
              try {
                await Promise.all(
                  newOrder.map((item, index) =>
                    updateCustomerOrder({
                      variables: { id: item._id, assignedOrder: index + 1 },
                    }),
                  ),
                );
                if (typeof refetchAssigned === "function") refetchAssigned();
              } catch (err) {
                console.error("updateCustomerOrder error:", err);
              }
            })();
          }}
          className={`flex-1 overflow-y-auto pr-2 flex flex-col gap-2 transition-all ${
            hasSelection ? "mb-[70px]" : "mb-0"
          }`}
        >
          {filteredCustomerOrder.map((a, index) => {
            const selected = selectedIds.includes(a._id);
            const isCompleted = Boolean(a.finished);
            const isStartedForBucket =
              ((activeStartedId && activeStartedId === a._id) || a.started) &&
              !isCompleted;
            const isStartedGlobal =
              (activeStartedGlobalId && activeStartedGlobalId === a._id) ||
              isStartedForBucket;
            const isDisabled =
              isAnyStartedGlobal && !isStartedGlobal && !isCompleted;
            return (
              <Reorder.Item key={a._id} value={a} role="button" tabIndex={0}>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ touchAction: "none" }}
                  className={`${
                    selected
                      ? "border-gray-300 text-gray-400 bg-gray-200"
                      : "border-blue-800 text-white bg-blue-500"
                  } select-none grid grid-cols-6 gap-4 justify-between text-base w-full py-3 px-3 border-2 rounded-sm font-black cursor-grab active:cursor-grabbing`}
                >
                  <div className="flex col-span-4  flex-col justify-start">
                    <div className="font-black uppercase text-ellipsis">
                      {a.customerName}
                    </div>
                    <div className="text-xs flex flex-col text-ellipsis  font-semibold text-white">
                      {(a.addresses?.[0] ?? "")
                        .split("|")
                        .map((part: string, i: number, arr: string[]) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && "|"}
                          </span>
                        ))}
                      {a.addresses?.[1]}
                    </div>
                  </div>

                  <div className="flex col-span-2 items-center">
                    <div
                      onClick={async () => {
                        if (isDisabled) return;
                        if (isCompleted) return;

                        if (isStartedForBucket) {
                          setBookedCustomer(a);
                          setIsBooked(true);
                          return;
                        }

                        try {
                          setIsBooked(true);
                          const res = await startCustomer({
                            variables: { id: a._id },
                          });
                          if (a.bucket) {
                            setStartedByBucket((prev) => ({
                              ...prev,
                              [a.bucket]: a._id,
                            }));
                          }
                          const arr = await refreshAssigned();
                          const updated = arr?.find(
                            (c: any) => c._id === a._id,
                          );
                          setBookedCustomer(
                            updated || {
                              ...a,
                              started:
                                res?.data?.startCustomer?.customer?.started ??
                                true,
                            },
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={`py-2 cursor-pointer border-2 items-center flex justify-center w-full text-[0.9rem]  rounded-sm 
                        ${isCompleted ? "bg-gray-500 border-gray-700 text-white" : ""}
                        ${!isCompleted && isStartedForBucket ? "bg-yellow-500 border-yellow-800" : " "}
                        ${!isCompleted && isDisabled ? "bg-gray-200 text-gray-300 border-gray-300 cursor-not-allowed" : "shadow-md bg-green-600 border-green-900"}
                              `}
                    >
                      {isCompleted ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : isStartedForBucket ? (
                        "CONTINUE"
                      ) : (
                        "START"
                      )}
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        <AnimatePresence>
          {isTLFieldOpen && (
            <motion.div className="absolute  top-0 left-0 flex justify-center items-center w-full h-full">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTLFieldOpen(false)}
                className="absolute z-10 top-0 left-0 backdrop-blur-sm bg-black/40 w-full h-full"
              ></motion.div>
              <motion.div
                className="z-20 border-2 border-blue-900 shadow-md rounded-md overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <div className="bg-blue-600 font-black border-b-2 border-blue-900 text-white uppercase px-6 py-2">
                  SELECT a person to assign
                </div>
                <div className="bg-blue-400 p-4">
                  {!selectedBucket?._id ? (
                    <div className="text-sm text-white/90 font-semibold">
                      Please select a bucket first.
                    </div>
                  ) : fieldUsersLoading ? (
                    <div className="text-sm text-white/90 font-semibold">
                      Loading users…
                    </div>
                  ) : fieldUsers.length === 0 ? (
                    <div className="text-sm text-white/90 font-semibold">
                      No AGENTFIELD users found for this bucket.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto grid grid-cols-1 gap-2">
                      {fieldUsers.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => {
                            setIsTLFieldOpen(false);
                          }}
                          className="w-full text-left bg-blue-50 hover:bg-blue-100 transition-colors border-2 border-blue-900 rounded-sm px-3 py-2"
                        >
                          <div className="font-black uppercase text-slate-800 truncate">
                            {String(u.name ?? "Unknown")}
                          </div>
                          <div className="text-xs text-slate-600">
                            {u.isOnline ? "Online" : "Offline"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {isBooked && (
            <AgentBooked
              customer={bookedCustomer}
              onClose={() => {
                setIsBooked(false);
                setBookedCustomer(null);
              }}
              loading={assignedLoading}
              refreshAssigned={refreshAssigned}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerSorting;
