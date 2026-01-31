import { useEffect, useRef, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import Lottie from "lottie-react";
import loadingAnimation from "../../Animations/Businessman flies up with rocket.json";

import { setSuccess } from "../../redux/slices/authSlice";

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

const UPDATE_CALLFILE_APPROVE = gql`
  mutation updateCallfileApprove($id: ID!, $approve: Boolean!) {
    updateCallfileApprove(id: $id, approve: $approve) {
      message
      success
      callfile {
        _id
        approve
      }
    }
  }
`;

const GET_CUSTOMERACCOUNTS_BY_BUCKET = gql`
  query GetCustomerAccountsByBucket($bucketId: ID!) {
    getCustomerAccountsByBucket(bucketId: $bucketId) {
      _id
      firstName
      lastName
      bucket
      accountNumber
      customer
      customerName
      addresses
      fieldassigned
      assignee
    }
  }
`;

const UPDATE_FIELD_ASSIGNEE = gql`
  mutation UpdateFieldAssignee($id: ID!, $assignee: ID!, $task: Int) {
    updateFieldAssignee(id: $id, assignee: $assignee, task: $task) {
      success
      message
      customer {
        _id
        forfield
        fieldassigned
      }
    }
  }
`;

const TLFieldProductionManager = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState<boolean>(false);
  const [isBucketOpen, setIsBucketOpen] = useState<boolean>(false);
  const [isTLFieldOpen, setIsTLFieldOpen] = useState<boolean>(false);
  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const bucketDropdownRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const dispatch = useAppDispatch();

  const userType = userLogged?.type || "";

  const { data: tlBucketData, loading: tlBucketLoading } = useQuery<{
    getTLBucket: Bucket[];
  }>(GET_TL_BUCKET);

  const buckets = tlBucketData?.getTLBucket ?? [];

  const handleApproveSelected = async () => {
    if (selectedCallfileId) {
      try {
        const current = callfilesData?.getBucketActiveCallfile?.find(
          (c: any) => c._id === selectedCallfileId,
        );
        const targetApprove = !(current?.approve === true);

        await updateCallfileApprove({
          variables: { id: selectedCallfileId, approve: targetApprove },
          errorPolicy: "all",
        });

        try {
          if (typeof callfilesRefetch === "function") await callfilesRefetch();
        } catch (_) {}

        try {
          if (typeof caDataRefetch === "function") await caDataRefetch();
        } catch (_) {}
      } catch (err: any) {
        console.error("toggle approve error:", err?.message || err);
      }

      return;
    }

    if (!hasSelection) return;

    setSelectedIds([]);
    setMultiSelectEnabled(false);
  };

  const { data: fieldUsersData, loading: fieldUsersLoading } = useQuery<{
    getBucketFieldUser: FieldUser[];
  }>(GET_BUCKET_FIELD_USERS, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !isTLFieldOpen || !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

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

  console.log(callfilesData);

  const [selectedCallfileId, setSelectedCallfileId] = useState<string | null>(
    null,
  );
  const [updateCallfileApprove] = useMutation(UPDATE_CALLFILE_APPROVE, {
    onError: (error) => {
      console.error("updateCallfileApprove onError:", error);
      if (error.graphQLErrors)
        console.error("graphQLErrors:", error.graphQLErrors);
      if (error.networkError)
        console.error("networkError:", error.networkError);
      dispatch(
        setSuccess({
          success: false,
          message: error.message,
          isMessage: false,
        }),
      );
    },
  });

  useEffect(() => {
    if (!selectedBucket?._id) {
      setSelectedCallfileId(null);
      return;
    }

    if (callfilesLoading) return;

    const callfiles = callfilesData?.getBucketActiveCallfile ?? [];
    const active =
      callfiles.find((c: any) => c?.active === true) || callfiles[0];
    setSelectedCallfileId(active?._id ?? null);
  }, [selectedBucket, callfilesData, callfilesLoading]);

  const {
    data: caData,
    loading: caLoading,
    refetch: caDataRefetch,
  } = useQuery<{
    getCustomerAccountsByBucket: {
      _id: string;
      firstName?: string;
      lastName?: string;
      bucket?: string;
      accountNumber?: string;
      customer?: string;
      customerName?: string;
      addresses?: string[];
      fieldassigned?: string;
      assignee?: string;
    }[];
  }>(GET_CUSTOMERACCOUNTS_BY_BUCKET, {
    variables: { bucketId: selectedBucket?._id ?? null },
    skip: !selectedBucket?._id,
    fetchPolicy: "no-cache",
  });

  const [updateFieldAssignee] = useMutation(UPDATE_FIELD_ASSIGNEE);

  const assignSelectedTo = async (assigneeId: string) => {
    if (!hasSelection) return;
    if (!assigneeId) {
      console.error("Invalid assignee ID");
      return;
    }
    const taskCount = selectedIds.length;

    for (const [index, id] of selectedIds.entries()) {
      if (!id) {
        console.warn("Skipping invalid ID:", id);
        continue;
      }

      try {
        const result = await updateFieldAssignee({
          variables: {
            id,
            assignee: assigneeId,
            task: index === 0 ? taskCount : null,
          },
          errorPolicy: "all",
        });

        caDataRefetch();

        if (result.errors && result.errors.length) {
          console.error("GraphQL errors:", result.errors);
          break;
        }

        const data = result.data?.updateFieldAssignee;
        if (!data?.success) {
          console.warn(`Failed for ID ${id}: ${data?.message}`);
          break;
        }
      } catch (err: any) {
        console.error("Mutation error for ID:", id);
        if (err.graphQLErrors)
          console.error("graphQLErrors:", err.graphQLErrors);
        if (err.networkError) console.error("networkError:", err.networkError);
        console.error(err.message || err);
        break;
      }
    }

    setSelectedIds([]);
    setMultiSelectEnabled(false);
    setIsTLFieldOpen(false);
  };

  useEffect(() => {
    if (!selectedBucket) return;
    if (callfilesLoading) return;
    const callfiles = callfilesData?.getBucketActiveCallfile ?? [];
    const activeCallfiles = callfiles.filter((c) => c.active === true);
    if (activeCallfiles.length > 0) {
      console.log(
        "Active callfiles for bucket",
        selectedBucket._id,
        activeCallfiles,
      );
    } else {
      console.log(
        "No tasks (no active callfiles) for bucket",
        selectedBucket._id,
      );
    }

    if (!caLoading) {
      const cas = caData?.getCustomerAccountsByBucket ?? [];
      if (cas.length > 0) {
        console.log("CustomerAccounts for bucket", selectedBucket._id, cas);
      } else {
        console.log("No customeraccounts found for bucket", selectedBucket._id);
      }
    }
  }, [selectedBucket, callfilesData, callfilesLoading]);

  const fieldUsers = fieldUsersData?.getBucketFieldUser ?? [];

  const hasSelection = selectedIds.length > 0;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const startLongPress = (id: string) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      setMultiSelectEnabled(true);
      toggleSelected(id);
      longPressTimerRef.current = null;
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleCardClick = (id: string) => {
    if (multiSelectEnabled || selectedIds.length > 0) {
      toggleSelected(id);
      return;
    }
    setSelectedIds([id]);
  };

  useEffect(() => {
    if (selectedIds.length === 0 && multiSelectEnabled) {
      setMultiSelectEnabled(false);
    }
  }, [selectedIds, multiSelectEnabled]);

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

  return (
    <div className="relative p-4 h-[90dvh] gap-4 flex flex-col bg-blue-50 overflow-hidden">
      <div
        ref={bucketDropdownRef}
        className={`" ${userType === "TLFIELD" ? "justify-between" : "justify-end"} flex   shrink-0 relative "`}
      >
        {userType === "AOM" &&
          selectedBucket &&
          callfilesData?.getBucketActiveCallfile.length !== 0 && (
            <div className="flex  justify-start w-full">
              <motion.button
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                type="button"
                onClick={handleApproveSelected}
                className={` ${
                  callfilesData?.getBucketActiveCallfile?.some(
                    (file) => file.approve === false,
                  )
                    ? "bg-green-600 border-green-900"
                    : "bg-red-600 border-red-900 "
                } border-2  font-black px-3 uppercase  text-white shadow-md items-center flex rounded-sm `}
              >
                <div>
                  {callfilesData?.getBucketActiveCallfile?.some(
                    (file) => file.approve === false,
                  )
                    ? "Enable"
                    : "Disable"}
                </div>
              </motion.button>
            </div>
          )}
        <div className="flex justify-between gap-2 w-full">
          {userType === "TLFIELD" && (
            <div className="flex w-full ">
              <div className="border flex w-full  md:w-auto shadow-md justify-between items-center px-3 py-1 bg-white rounded-sm">
                <input
                  placeholder="Search..."
                  className="outline-none w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <div
                    onClick={() => setSearchTerm("")}
                    className="cursor-pointer text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsBucketOpen((v) => !v)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsBucketOpen((v) => !v);
              }
            }}
            className="w-full md:w-auto relative shadow-md rounded-sm md:cursor-pointer transition-all hover:bg-gray-100 border bg-white justify-between items-center px-3 py-1 flex"
          >
            <div className="truncate pr-2">
              {tlBucketLoading
                ? "Loading…"
                : selectedBucket?.name || "Select Bucket"}
            </div>
            <div
              className={`${
                isBucketOpen ? "rotate-90" : ""
              } transition-transform`}
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
            <AnimatePresence>
              {isBucketOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-full rounded-sm border bg-white shadow-lg z-20 overflow-hidden"
                  onClick={(event) => event.stopPropagation()}
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
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedBucket(b);
                            setIsBucketOpen(false);
                            setSelectedIds([]);
                          }}
                          className={`flex flex-col w-full text-left px-3 py-2 text-sm hover:bg-gray-50 md:cursor-pointer transition-colors ${
                            selectedBucket?._id === b._id
                              ? "bg-gray-200 font-semibold"
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
      </div>
      <div
        className={` flex flex-col h-full gap-2 overflow-y-auto transition-all ${
          hasSelection ? "mb-[70px]" : "mb-0"
        }`}
      >
        {!selectedBucket && (
          <div className="text-sm text-gray-500 text-center flex justify-center items-center h-full italic col-span-full">
            Select a bucket first.
          </div>
        )}

        {caLoading && (
          <div className="flex items-center justify-center  h-full w-full">
            <div className=" w-40">
              <Lottie animationData={loadingAnimation} />
            </div>
          </div>
        )}
        {userType === "AOM" ? (
          <div className="flex flex-col pr-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {caData?.getCustomerAccountsByBucket.length === 0 && !caLoading && (
              <div className="text-sm text-gray-500 text-center flex justify-center w-full items-center h-full italic col-span-full">
                No field accounts found for this bucket.
              </div>
            )}
            {caData?.getCustomerAccountsByBucket.map((ca, index) => {
              const selected = selectedIds.includes(ca._id);

              return (
                <motion.div
                  key={ca._id}
                  role="button"
                  tabIndex={0}
                  onPointerDown={() => {
                    if (!ca.fieldassigned && userType !== "AOM") {
                      startLongPress(ca._id);
                    }
                  }}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onClick={() => {
                    if (!ca.fieldassigned && userType !== "AOM") {
                      handleCardClick(ca._id);
                    }
                  }}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${
                    selected
                      ? "border-gray-300 text-gray-400 bg-gray-200"
                      : ca.fieldassigned
                        ? "border-gray-300 text-gray-400 bg-gray-200"
                        : "border-blue-800 text-white bg-blue-500"
                  } select-none relative text-base  flex flex-col justify-center border-2 md:transition-all rounded-sm font-black`}
                >
                  <div className="overflow-hidden h-24 py-2 px-3 relative">
                    <div className="uppercase truncate">{ca.customerName}</div>
                    <div className="font-semibold text-xs">{ca.addresses}</div>
                    {ca.fieldassigned ? (
                      <div className="absolute text-sm uppercase text-center py-1 text-white -rotate-45 bottom-5 bg-green-500 border-2 border-green-900 shadow-md w-40 -right-11">
                        <div>assigned</div>
                      </div>
                    ) : (
                      <div className="absolute text-xs uppercase text-center py-1.5 text-white -rotate-45 bottom-5 bg-red-500 border-2 border-red-900 shadow-md w-40 -right-11">
                        <div>unassigned</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="h-full">
            {callfilesData?.getBucketActiveCallfile?.some(
              (file) => file.approve === false,
            ) && !caLoading ? (
              <div className="text-sm text-gray-500 text-center flex justify-center w-full items-center h-full italic col-span-full">
                No field accounts. Ask your AOM to approve the callfile first.
              </div>
            ) : (
              <div className="flex flex-col pr-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {caData?.getCustomerAccountsByBucket.length === 0 &&
                  !caLoading && (
                    <div className="text-sm text-gray-500 text-center flex justify-center w-full items-center h-full italic col-span-full">
                      No field accounts found for this bucket.
                    </div>
                  )}

                {caData?.getCustomerAccountsByBucket
                  .filter((ca) => {
                    if (!searchTerm.trim()) return true;
                    const term = searchTerm.toLowerCase();
                    const nameMatch = ca.customerName
                      ?.toLowerCase()
                      .includes(term);
                    const addressMatch = ca.addresses?.some((addr) =>
                      addr?.toLowerCase().includes(term),
                    );
                    return nameMatch || addressMatch;
                  })
                  .map((ca, index) => {
                    const selected = selectedIds.includes(ca._id);

                    return (
                      <motion.div
                        key={ca._id}
                        role="button"
                        tabIndex={0}
                        onPointerDown={() => {
                          if (!ca.fieldassigned && userType !== "AOM") {
                            startLongPress(ca._id);
                          }
                        }}
                        onPointerUp={cancelLongPress}
                        onPointerLeave={cancelLongPress}
                        onClick={() => {
                          if (!ca.fieldassigned && userType !== "AOM") {
                            handleCardClick(ca._id);
                          }
                        }}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${
                          selected
                            ? "border-gray-300 cursor-pointer  text-gray-400 bg-gray-200"
                            : ca.fieldassigned
                              ? "border-gray-300 text-gray-400 bg-gray-200"
                              : "border-blue-800 cursor-pointer  hover:bg-blue-600 text-white bg-blue-500"
                        } select-none relative text-base flex flex-col justify-center  border-2 md:transition-all rounded-sm font-black`}
                      >
                        <div className="overflow-hidden h-24 py-2 px-3 relative">
                          <div className="uppercase truncate">
                            {ca.customerName}
                          </div>
                          <div className="font-semibold text-xs">
                            {ca.addresses}
                          </div>
                          {ca.fieldassigned ? (
                            <div className="absolute text-sm uppercase text-center py-1 text-white -rotate-45 bottom-5 bg-green-500 border-2 border-green-900 shadow-md w-52 -right-14">
                              <div>assigned to</div>
                              <div className="font-normal text-[0.7rem]" >{ca.assignee}</div>
                            </div>
                          ) : (
                            <div className="absolute text-xs uppercase text-center py-1.5 text-white -rotate-45 bottom-5 bg-red-500 border-2 border-red-900 shadow-md w-40 -right-11">
                              <div>unassigned</div>
                            </div>
                          )}

                          
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      <motion.div
        initial={false}
        animate={{ y: hasSelection ? 0 : 96 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className={`absolute left-0 right-0 bottom-0 p-5 justify-center md:justify-end flex w-full  gap-2 bg-blue-50/90 backdrop-blur-sm ${
          hasSelection ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedIds([]);
            setMultiSelectEnabled(false);
          }}
          className="py-2 w-full md:px-6 md:w-auto bg-gray-300 border-gray-400 border-2 font-black uppercase text-gray-500 rounded-sm shadow-md flex justify-center text-center"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            if (!hasSelection) return;
            setIsTLFieldOpen(true);
          }}
          className="py-2 cursor-pointer hover:bg-green-700 transition-all w-full md:px-6 md:w-auto bg-green-600 border-green-900 text-shadow-2xs border-2 font-black uppercase text-white rounded-sm shadow-md flex justify-center text-center"
        >
          Assign to
        </button>
      </motion.div>

      <AnimatePresence>
        {isTLFieldOpen && (
          <motion.div className="absolute  top-0 left-0 flex justify-center items-center w-full h-full">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTLFieldOpen(false)}
              className="absolute cursor-pointer z-10 top-0 left-0 backdrop-blur-sm bg-black/40 w-full h-full"
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
                  <div className="text-sm text-blue-900 font-semibold">
                    No field users found for this bucket.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto grid grid-cols-1 gap-2">
                    {fieldUsers.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => {
                          assignSelectedTo(u._id);
                        }}
                        className="w-full text-left bg-blue-50 cursor-pointer hover:bg-blue-200 transition-colors border-2 border-blue-900 rounded-sm px-3 py-2"
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
      </AnimatePresence>
    </div>
  );
};

export default TLFieldProductionManager;
