import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import GaugeChart from "react-gauge-chart";

const GET_QA_USERS = gql`
  query getQAUsers($page: Int!, $limit: Int!) {
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

const GET_ALL_DEPTS = gql`
  query getDepts {
    getDepts {
      id
      name
      branch
    }
  }
`;

const GET_ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
      dept
    }
  }
`;

const GET_SCORECARD_SUMMARIES = gql`
  query GetScoreCardSummaries($date: String, $search: String) {
    getScoreCardSummaries(date: $date, search: $search) {
      _id
      qa {
        _id
        name
      }
    }
  }
`;

const GET_NOTES = gql`
  query GetNotes($limit: Int) {
    getNotes(limit: $limit) {
      _id
      title
      description
      until
      createdAt
      updatedAt
      createdBy {
        _id
        name
      }
    }
  }
`;

const GET_TOP_QA_PERFORMANCE = gql`
  query GetTopQAPerformance($month: Int!, $year: Int!, $limit: Int) {
    getTopQAPerformance(month: $month, year: $year, limit: $limit) {
      user {
        _id
        name
      }
      productionDayCount
      productionHistoryCount
      productionCount
      scoreSheetCount
      total
    }
  }
`;

const CREATE_NOTE = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      _id
      title
      description
      until
      createdAt
      updatedAt
      createdBy {
        _id
        name
      }
    }
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($input: UpdateNoteInput!) {
    updateNote(input: $input) {
      _id
      title
      description
      until
      createdAt
      updatedAt
      createdBy {
        _id
        name
      }
    }
  }
`;

const DELETE_NOTE = gql`
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id) {
      success
      message
    }
  }
`;

const QASupervisorDashboard = () => {
  const [value, setValue] = useState(1);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteUntil, setNoteUntil] = useState("");
  const [performanceMonth, setPerformanceMonth] = useState(() => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  const { data } = useQuery(GET_QA_USERS, {
    variables: { page: 1, limit: 100 },
  });
  const { data: deptData } = useQuery(GET_ALL_DEPTS);
  const { data: bucketData } = useQuery(GET_ALL_BUCKETS);
  const { data: scorecardData } = useQuery(GET_SCORECARD_SUMMARIES, {
    variables: { date: null, search: null },
    notifyOnNetworkStatusChange: true,
  });

  const {
    data: notesData,
    refetch: refetchNotes,
    loading: notesLoading,
  } = useQuery(GET_NOTES, {
    variables: { limit: 50 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });

  const [createNote, { loading: creatingNote }] = useMutation(CREATE_NOTE);
  const [updateNote, { loading: updatingNote }] = useMutation(UPDATE_NOTE);
  const [deleteNote, { loading: deletingNote }] = useMutation(DELETE_NOTE);

  const users = data?.getQAUsers?.users || [];

  const deptMap = useMemo(() => {
    const arr = deptData?.getDepts || [];
    return Object.fromEntries(arr.map((d: any) => [d.id, d.name]));
  }, [deptData]);

  const bucketMap = useMemo(() => {
    const arr = bucketData?.getAllBucket || [];
    return Object.fromEntries(arr.map((b: any) => [b._id, b.name]));
  }, [bucketData]);

  const scoreSheetCountByQa = useMemo(() => {
    const summaries = scorecardData?.getScoreCardSummaries || [];
    return summaries.reduce((acc: Record<string, number>, entry: any) => {
      const qaId = entry?.qa?._id;
      if (qaId) {
        acc[qaId] = (acc[qaId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [scorecardData]);

  const sortedUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list].sort((a: any, b: any) => {
      const countA = scoreSheetCountByQa?.[a?._id] ?? 0;
      const countB = scoreSheetCountByQa?.[b?._id] ?? 0;
      if (countA !== countB) return countB - countA;
      const nameA = String(a?.name ?? "").toLowerCase();
      const nameB = String(b?.name ?? "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, scoreSheetCountByQa]);

  useEffect(() => {
    setValue(1);
  }, []);

  const notes = notesData?.getNotes ?? [];

  const selectedYear = Number(performanceMonth.slice(0, 4));
  const selectedMonth = Number(performanceMonth.slice(5, 7));

  const { data: topQaPerfData, loading: topQaPerfLoading } = useQuery(
    GET_TOP_QA_PERFORMANCE,
    {
      variables: {
        month: selectedMonth,
        year: selectedYear,
        limit: 6,
      },
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  const topQaPerformance = topQaPerfData?.getTopQAPerformance ?? [];
  const topQaMaxTotal = Math.max(
    1,
    ...topQaPerformance.map((row: any) => Number(row?.total ?? 0))
  );
  const topQaSlots = Array.from({ length: 6 }, (_, idx) =>
    topQaPerformance[idx] ?? null
  );

  const toDateInputValue = (value: any) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const getUntilStatus = (untilValue: any) => {
    if (!untilValue) return "none" as const;
    const untilDate = new Date(untilValue);
    if (Number.isNaN(untilDate.getTime())) return "none" as const;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfUntil = new Date(untilDate);
    startOfUntil.setHours(0, 0, 0, 0);

    const diffMs = startOfUntil.getTime() - startOfToday.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "overdue" as const;
    if (daysLeft <= 3) return "warning" as const;
    return "ok" as const;
  };

  const openCreateNote = () => {
    setNoteTitle("");
    setNoteDescription("");
    setNoteUntil("");
    setSelectedNote(null);
    setIsNoteFormOpen(true);
  };

  const openEditNote = (note: any) => {
    setSelectedNote(note);
    setNoteTitle(String(note?.title ?? ""));
    setNoteDescription(String(note?.description ?? ""));
    setNoteUntil(toDateInputValue(note?.until));
    setNoteModalOpen(true);
  };

  return (
    <div className="w-full h-full max-h-[90vh] overflow-hidden flex flex-col relative">
      <div className="bg-blue-500 h-[5%] shadow-md py-1.5 px-4">
        <div className="flex h-full items-center gap-2">
          <div className="bg-blue-300 flex cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 px-2 items-center h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-5 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 px-2 items-center flex h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-5 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="underline font-black text-white uppercase text-lg">
            Week # 12
          </div>
        </div>
      </div>
      <div className="flex h-[10%] p-3 flex-col">
        <div className="grid grid-cols-4 h-full relative gap-3  ">
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-200 font-black uppercase text-gray-500 text-center border rounded-md p-2 border-gray-500"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>Total Calls</div>
            <div className=" text-xl text-red-800">100</div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-2 px-3 py-3 gap-3 grid-rows-2 h-[85%]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full row-span-2"
        >
          <div className="grid  rounded-md shadow overflow-hidden border border-black h-full bg-gray-200">
            <div className="grid-cols-4 py-2 border-b text-start grid items-center px-4 shadow-md rounded-t-sm font-black text-sm text-black uppercase bg-gray-300">
              <div>QA Name</div>
              <div>Campaign</div>
              <div>Bucket(s)</div>
              <div className="truncate text-center" title="Score Sheet report">
                Score Sheet report
              </div>
            </div>
            <div className="divide-y divide-gray-400 overflow-y-auto h-full">
              {sortedUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="grid grid-cols-4 odd:bg-gray-200 gap-2 transition-all hover:bg-gray-300 even:bg-gray-100 px-4 py-2 items-center text-sm text-black"
                >
                  <div className="first-letter:uppercase">{user.name}</div>
                  <div className="truncate" title={user.departments.join(", ")}>
                    {Array.isArray(user.departments) &&
                    user.departments.length > 0 ? (
                      user.departments
                        .map((deptId: string) => deptMap[deptId] || deptId)
                        .join(", ")
                    ) : (
                      <span className="italic text-gray-400 text-xs">
                        No campaign
                      </span>
                    )}
                  </div>
                  <div className="truncate" title={user.buckets.join(", ")}>
                    {Array.isArray(user.buckets) && user.buckets.length > 0 ? (
                      user.buckets
                        .map(
                          (bucketId: string) => bucketMap[bucketId] || bucketId
                        )
                        .join(", ")
                    ) : (
                      <span className="italic text-gray-400 text-xs">
                        No bucket
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    {scoreSheetCountByQa[user._id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
       
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="row-span-2"
        >
          <div className="rounded-md shadow border relative flex flex-col border-black h-full bg-gray-200 overflow-hidden">
            <div className="bg-gray-300 border-b border-black rounded-t-md w-full shrink-0">
              <div className="font-black uppercase text-center py-2 text-black text-sm shadow-md ">
                Notes
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid gap-2 text-black grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-16">
                {notesLoading ? (
                  <div className="col-span-full text-center text-sm text-gray-500 font-semibold py-6">
                    Loading notes...
                  </div>
                ) : notes.length === 0 ? (
                  <div className="col-span-full h-full text-center text-sm text-gray-400 italic font-normal py-6">
                    No notes yet.
                  </div>
                ) : (
                  notes.map((note: any) => (
                    <div
                      key={note?._id}
                      onClick={() => openEditNote(note)}
                      className="flex cursor-pointer hover:shadow-xl flex-col border rounded-md shadow-md text-center bg-gray-100"
                    >
                      <div
                        className="bg-gray-300 h-10 py-1 font-semibold relative border-b rounded-t-md px-3"
                        title={note?.title}
                      >
                        {note?.title}
                        <div
                          className={`w-3 h-3 absolute -top-1 rounded-full border shadow-sm -right-1 ${
                            note?.until
                              ? getUntilStatus(note.until) === "overdue"
                                ? "border-red-900 bg-red-600"
                                : getUntilStatus(note.until) === "warning"
                                  ? "border-yellow-900 bg-yellow-500"
                                  : "border-green-900 bg-green-600"
                              : "border-gray-600 bg-gray-400"
                          }`}
                          title={
                            note?.until
                              ? `Until: ${toDateInputValue(note.until)}`
                              : "No until date"
                          }
                        ></div>
                      </div>
                      <div className="p-2 h-20 flex flex-col gap-1">
                        <div className="h-full overflow-hidden text-ellipsis line-clamp-3 text-sm">
                          {note?.description || (
                            <span className="italic text-gray-400">
                              No description
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {note?.createdBy?.name
                            ? `By: ${note.createdBy.name}`
                            : ""}
                          {note?.until ? (
                            <span className="ml-2">
                              Until: {toDateInputValue(note.until)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              <div
                title="Add title"
                onClick={openCreateNote}
                className="p-1 opacity-40 hover:opacity-100 hover:scale-110 bg-green-600 border-2 rounded-full text-white border-green-900 shadow-md cursor-pointer hover:bg-green-700 transition-all"
              >
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <AnimatePresence>
        {isNoteFormOpen && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div
              onClick={() => setIsNoteFormOpen(false)}
              className="absolute cursor-pointer top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-20"
            ></div>
            <motion.form
              className="z-30 bg-gray-100 border rounded-md overflow-hidden max-w-xl w-full "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onSubmit={async (e) => {
                e.preventDefault();
                await createNote({
                  variables: {
                    input: {
                      title: noteTitle,
                      description: noteDescription,
                      until: noteUntil ? new Date(noteUntil).toISOString() : null,
                    },
                  },
                });
                await refetchNotes();
                setIsNoteFormOpen(false);
              }}
            >
              <div className="bg-gray-300 border-b py-2 px-4 font-black text-2xl w-full text-center uppercase ">
                Create a note
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className=" flex flex-col justify-start">
                  <div className="flex gap-1">
                    Title:<div className="text-red-800 font-black">*</div>{" "}
                  </div>
                  <input
                    className="py-1 col-span-3 w-full outline-none px-2 border rounded-sm  shadow-md"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                </div>

                <div className=" flex flex-col justify-start">
                  <div className="flex gap-1">
                    Description:{" "}
                    <div className="text-red-800 font-black">*</div>
                  </div>
                  <textarea
                    className="py-1 min-h-10 max-h-40 col-span-3 w-full outline-none px-2 border rounded-sm  shadow-md"
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                  />
                </div>

                <div className=" flex gap-2 justify-start items-center">
                  <div>Until: </div>
                  <input
                    className="px-3 py-1 border rounded-sm shadow-md"
                    type="date"
                    value={noteUntil}
                    onChange={(e) => setNoteUntil(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <div
                    onClick={() => setIsNoteFormOpen(false)}
                    className="px-3 py-1 bg-gray-300 font-black uppercase cursor-pointer text-sm border-gray-400 border-2 rounded-sm shadow-md text-gray-500 "
                  >
                    cancel
                  </div>
                  <button
                    type="submit"
                    disabled={creatingNote}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 font-black uppercase cursor-pointer text-sm border-green-900 border-2 rounded-sm shadow-md text-white "
                  >
                    {creatingNote ? "saving..." : "submit"}
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noteModalOpen && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-full bg-black/40 backdrop-blur-sm z-20"></div>
            <motion.form
              className="z-30 bg-gray-100 border rounded-md overflow-hidden max-w-xl w-full "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedNote?._id) return;
                await updateNote({
                  variables: {
                    input: {
                      id: selectedNote._id,
                      title: noteTitle,
                      description: noteDescription,
                      until: noteUntil ? new Date(noteUntil).toISOString() : null,
                    },
                  },
                });
                await refetchNotes();
                setNoteModalOpen(false);
              }}
            >
              <div className="bg-gray-300 border-b py-2 px-4 flex flex-col justify-center  w-full text-center">
                <div className="font-black text-2xl uppercase ">Edit note</div>
                <div className="flex font-normal text-sm gap-2 items-center justify-center">
                  <div>User creator:</div>
                  <div className="">
                    {selectedNote?.createdBy?.name || "Unknown"}
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className=" flex flex-col justify-start">
                  <div>Title: </div>
                  <input
                    className="py-1 col-span-3 w-full outline-none px-2 border rounded-sm  shadow-md"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                </div>

                <div className=" flex flex-col justify-start">
                  <div>Description: </div>
                  <textarea
                    className="py-1 min-h-10 max-h-40 col-span-3 w-full outline-none px-2 border rounded-sm  shadow-md"
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                  />
                </div>

                <div className=" flex gap-2 justify-start items-center">
                  <div>Until:</div>
                  <input
                    className="px-3 py-1 border rounded-sm shadow-md"
                    type="date"
                    value={noteUntil}
                    onChange={(e) => setNoteUntil(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <div
                    onClick={() => setNoteModalOpen(false)}
                    className="px-3 py-1 bg-gray-300 font-black uppercase cursor-pointer text-sm border-gray-400 border-2 rounded-sm shadow-md text-gray-500 "
                  >
                    cancel
                  </div>
                  <button
                    type="button"
                    disabled={deletingNote}
                    onClick={async () => {
                      if (!selectedNote?._id) return;
                      await deleteNote({
                        variables: { id: selectedNote._id },
                      });
                      await refetchNotes();
                      setNoteModalOpen(false);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 font-black uppercase cursor-pointer text-sm border-red-900 border-2 rounded-sm shadow-md text-white "
                  >
                    {deletingNote ? "removing..." : "remove"}
                  </button>
                  <button
                    type="submit"
                    disabled={updatingNote}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 font-black uppercase cursor-pointer text-sm border-blue-900 border-2 rounded-sm shadow-md text-white "
                  >
                    {updatingNote ? "updating..." : "update"}
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QASupervisorDashboard;
