import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";
import { useQuery, useMutation, gql } from "@apollo/client";

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

const QAAdminDashboard = () => {
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
  // const [hehe, setHehe] = useState(40);

  const {
    data: notesData,
    refetch: refetchNotes,
    loading: notesLoading,
  } = useQuery(GET_NOTES, {
    variables: { limit: 50 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });
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

  useEffect(() => {
    setValue(1);
  }, []);

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

  const [createNote, { loading: creatingNote }] = useMutation(CREATE_NOTE);

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <div className="bg-blue-500 shadow-md py-3 px-4">
        <div className="flex items-center">
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-gray-300 mr-3 py-2 px-3 h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-6 text-blue-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </div>
          <div className="bg-blue-300 cursor-pointer rounded-md shadow-md hover:shadow-none transition-all hover:bg-blue-400 mr-3 py-2 px-3 h-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
              stroke="currentColor"
              className="size-6 text-black"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </div>
          <div className="underline font-black text-white uppercase text-2xl">
            Week # 12
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="grid grid-cols-4 relative mt-3 gap-3 px-3 ">
          <motion.div
            className="bg-gray-300 font-black uppercase text-black text-center border rounded-md p-2 border-black"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-300 font-black uppercase text-black text-center border rounded-md p-2 border-black"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-300 font-black uppercase text-black text-center border rounded-md p-2 border-black"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
          <motion.div
            className="bg-gray-300 font-black uppercase text-black text-center border rounded-md p-2 border-black"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <div>Total Calls</div>
            <div className=" text-5xl text-red-800">100</div>
          </motion.div>
        </div>
      </div>
      <div className="pt-4 px-16">
        <motion.div
          className="flex gap-48"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <input type="radio" />
          <input type="radio" />
          <input type="radio" />
          <input type="radio" />
        </motion.div>
      </div>
      <div className="grid grid-cols-2 px-3 py-3 gap-3 grid-rows-2  h-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <div className="grid  rounded-md shadow border border-black overflow-hidden grid-rows-5 h-full bg-gray-100">
            <div className="grid-cols-6 gap-2  uppercase border-b border-black text-center grid items-center px-4 py-2 shadow-md rounded-t-sm font-black text-sm text-black bg-gray-300">
              <div>Agent Name</div>
              <div className="truncate">Total Calls</div>
              <div className="truncate">Calls Answered</div>
              <div className="truncate">Avg. Speed of Ans</div>
              <div className="truncate">Call Resolution</div>
              <div className="truncate">CR Trend</div>
            </div>
            <div></div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className=" rounded-md overflow-hidden flex flex-col shadow border border-black h-full bg-gray-200">
            <div className="bg-gray-300 border-b justify-center gap-2 items-center shadow-md border-black rounded-t-sm flex w-full">
              <div className="font-black uppercase text-center py-2 text-black text-sm ">
                Top 6 QA Performance
              </div>

              <div
                title={`Performance is based on QA production, such as \nlogging in to CCS and creating score sheets.`}
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>

              <div className="ml-2">
                <input
                  className="text-xs font-semibold px-2 py-1 rounded border border-gray-500 bg-gray-100"
                  type="month"
                  value={performanceMonth}
                  onChange={(e) => setPerformanceMonth(e.target.value)}
                />
              </div>
            </div>
            <div className="h-full px-4 flex flex-col">
              {topQaPerfLoading ? (
                <div className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-500">
                  Loading...
                </div>
              ) : (
                <>
                  <div className="flex-1 grid grid-cols-6 mt-4 grid-rows-1 gap-3 items-end content-center justify-center">
                    {topQaSlots.map((row: any, idx) => {
                      const total = row ? Number(row?.total ?? 0) : 0;
                      const percent = Math.round((total / topQaMaxTotal) * 100);
                      const barTitle = row
                        ? `${row?.user?.name ?? "Unknown"}\nTotal: ${total}\nProduction: ${Number(
                            row?.productionCount ?? 0
                          )}\nScore Sheets: ${Number(row?.scoreSheetCount ?? 0)}`
                        : "No data";

                      return (
                        <div
                          key={row?.user?._id ?? `slot-${idx}`}
                          className="w-full h-full flex flex-col justify-end items-center"
                          title={barTitle}
                        >
                          <div
                            className={`w-12 sm:w-14 md:w-16 rounded-t-md text-center transition-all duration-500 ${
                              total > 0 ? "bg-green-700" : "bg-gray-400"
                            }`}
                            style={{ height: `${percent}%` }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-500 grid grid-cols-6 gap-3 truncate text-center font-black uppercase text-gray-500 justify-evenly py-2 text-xs">
                    {topQaSlots.map((row: any, idx) => (
                      <div
                        key={row?.user?._id ?? `label-${idx}`}
                        className="truncate"
                        title={row?.user?.name ?? ""}
                      >
                        {row?.user?.name ?? "-"}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", delay: 0.5 }}
        >
          <div className=" rounded-md shadow  border relative flex flex-col border-black h-full bg-gray-300">
            <div className="bg-gray-300 border-b rounded-t-sm justify-evenly py-2 shadow-md w-full flex text-sm ">
              <div className="font-black uppercase text-center py-3 text-black ">
                Overall Satisfaction Score
              </div>
              <div className="font-black uppercase text-center py-3 text-black ">
                Satisfaction Score - By Agent
              </div>
            </div>
            <div className="flex h-full bg-[#fff]">
              <div className="flex items-center justify-center h-full flex-col w-full relative">
                <GaugeChart
                  id="gauge-chart"
                  nrOfLevels={100}
                  colors={["#cecece"]}
                  percent={value}
                  arcWidth={0.3}
                  needleColor="#333"
                  arcsLength={[1]}
                  hideText
                />
                <div className="font-black uppercase text-black">
                  Satisfaction Score: 3.33
                </div>
              </div>
              <div className="flex flex-col w-full h-full py-3 px-3 items-end font-black text-black">
                <div className="h-full flex w-full">
                  <div className="h-full flex pr-5 border-r-2 flex-col text-end justify-evenly">
                    <div>Jim</div>
                    <div>Stewart</div>
                    <div>Manuel</div>
                    <div>Joshua</div>
                    <div>Daniel</div>
                  </div>
                  <div className="h-full w-full flex pr-5 flex-col text-start justify-evenly">
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                    <div>d</div>
                  </div>
                </div>
                <div className="flex flex-row border-t-2 pl-20 pt-3 justify-evenly w-full">
                  <div>0</div>
                  <div>1</div>
                  <div>2</div>
                  <div>3</div>
                  <div>4</div>
                  <div>5</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
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
                      until: noteUntil
                        ? new Date(noteUntil).toISOString()
                        : null,
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
                    readOnly={true}
                    onChange={(e) => setNoteTitle(e.target.value)}
                  />
                </div>

                <div className=" flex flex-col justify-start">
                  <div>Description: </div>
                  <textarea
                    className="py-1 min-h-10 max-h-40 col-span-3 w-full outline-none px-2 border rounded-sm  shadow-md"
                    value={noteDescription}
                    readOnly={true}
                    onChange={(e) => setNoteDescription(e.target.value)}
                  />
                </div>

                <div className=" flex gap-2 justify-start items-center">
                  <div>Until:</div>
                  <input
                    className="px-3 py-1 border rounded-sm shadow-md"
                    type="date"
                    value={noteUntil}
                    readOnly={true}
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
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QAAdminDashboard;
