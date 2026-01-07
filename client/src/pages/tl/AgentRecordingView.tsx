import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { RootState, useAppDispatch } from "../../redux/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import {
  setAgentRecordingPage,
  setCCSCall,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice";
import { FaDownload } from "react-icons/fa6";
import { CgSpinner } from "react-icons/cg";
import Pagination from "../../components/Pagination";
import { FaBoxArchive } from "react-icons/fa6";
import Wrapper from "../../components/Wrapper.tsx";
import Navbar from "../../components/Navbar.tsx";
import { motion } from "framer-motion";

const AGENT_RECORDING = gql`
  query getAgentDispositionRecords(
    $agentID: ID
    $limit: Int
    $page: Int
    $from: String
    $to: String
    $search: String
    $dispotype: [String]
    $ccsCalls: Boolean!
  ) {
    getAgentDispositionRecords(
      agentID: $agentID
      limit: $limit
      page: $page
      from: $from
      to: $to
      search: $search
      dispotype: $dispotype
      ccsCalls: $ccsCalls
    ) {
      dispositions {
        _id
        customer_name
        payment
        amount
        dispotype
        payment_date
        ref_no
        comment
        contact_no
        createdAt
        dialer
        callId
        recordings {
          name
          size
        }
      }
      total
      dispocodes
    }
  }
`;

type Recording = {
  name: string;
  size: number;
};

type Diposition = {
  _id: string;
  customer_name: string;
  payment: string;
  amount: number;
  dispotype: string;
  payment_date: string;
  ref_no: string;
  comment: string;
  contact_no: string[];
  createdAt: string;
  dialer: string;
  callId: string;
  recordings: Recording[];
};

type Record = {
  dispositions: Diposition[];
  total: number;
  dispocodes: string[];
};

const AGENT_INFO = gql`
  query GetUser($id: ID) {
    getUser(id: $id) {
      name
      user_id
    }
  }
`;

type Agent = {
  name: string;
  user_id: string;
};

const DL_RECORDINGS = gql`
  mutation findRecordings($_id: ID!, $name: String!, $ccsCall: Boolean) {
    findRecordings(_id: $_id, name: $name, ccsCall: $ccsCall) {
      success
      message
      url
    }
  }
`;

const DELETE_RECORDING = gql`
  mutation deleteRecordings($filename: String) {
    deleteRecordings(filename: $filename) {
      message
      success
    }
  }
`;

type Success = {
  success: boolean;
  message: string;
  url: string;
};

type SearchRecordings = {
  from: string;
  to: string;
  search: string;
  dispotype: string[];
};

const CANT_FIND_ON_FTP = gql`
  query cantFindOnFTP($name: String) {
    cantFindOnFTP(name: $name) {
      name
      size
    }
  }
`;

const AGENT_RECORDING_LAG = gql`
  query findLagRecording($name: String, $_id: ID) {
    findLagRecording(name: $name, _id: $_id)
  }
`;

const RECORDING_FTP = gql`
  mutation recordingsFTP($_id: ID!, $fileName: String!) {
    recordingsFTP(_id: $_id, fileName: $fileName) {
      url
      message
      success
    }
  }
`;

const AGENT_RECORDING_LAG_FTP = gql`
  query findLagOnFTP($name: String) {
    findLagOnFTP(name: $name)
  }
`;

const LATE_RECORDING = gql`
  mutation lateCallRecording($id: ID) {
    lateCallRecording(id: $id)
  }
`;

type CantFind = {
  name: string;
  size: number;
};

const AgentRecordingView = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { limit, agentRecordingPage, userLogged, ccsCall } = useSelector(
    (state: RootState) => state.auth
  );
  const [page, setPage] = useState<string>("1");

  const [dataSearch, setDataSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: "",
    dispotype: [],
  });

  const [triggeredSearch, setTriggeredSearch] = useState<SearchRecordings>({
    search: "",
    from: "",
    to: "",
    dispotype: [],
  });

  const searchPage = triggeredSearch.search ? 1 : agentRecordingPage;

  const isAgentRecordings = location.pathname === "/agent-recordings";

  const {
    data: recordings,
    loading: recordingsLoading,
    refetch,
  } = useQuery<{ getAgentDispositionRecords: Record }>(AGENT_RECORDING, {
    variables: {
      agentID: location.state,
      limit: limit,
      page: searchPage,
      from: triggeredSearch.from,
      to: triggeredSearch.to,
      search: triggeredSearch.search,
      dispotype: triggeredSearch.dispotype,
      ccsCalls: ccsCall,
    },
    notifyOnNetworkStatusChange: true,
    skip: !isAgentRecordings,
  });

  const [getLagRecording] = useLazyQuery<{ findLagRecording: number }>(
    AGENT_RECORDING_LAG,
    {
      notifyOnNetworkStatusChange: true,
    }
  );
  const [findLagOnFTP] = useLazyQuery<{ findLagOnFTP: number }>(
    AGENT_RECORDING_LAG_FTP,
    {
      notifyOnNetworkStatusChange: true,
    }
  );

  const [cantFindOnFTP, { loading: cantFindOnFTPLoading }] = useLazyQuery<{
    cantFindOnFTP: CantFind[];
  }>(CANT_FIND_ON_FTP, {
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, [ccsCall]);

  const [openRecordingsBox, setOpenRecordingsBox] = useState<string | null>(
    null
  );

  const { data: agentInfoData } = useQuery<{ getUser: Agent }>(AGENT_INFO, {
    variables: { id: location.state },
    notifyOnNetworkStatusChange: true,
  });

  const [isLoading, setIsLoading] = useState<string>("");

  const [totalPage, setTotalPage] = useState<number>(1);

  useEffect(() => {
    setPage(agentRecordingPage.toString());
  }, [agentRecordingPage]);

  useEffect(() => {
    if (triggeredSearch.search) {
      setPage("1");
      dispatch(setAgentRecordingPage(1));
    }
  }, [triggeredSearch.search, location.pathname]);

  useEffect(() => {
    if (recordings) {
      const totalPage = Math.ceil(
        recordings?.getAgentDispositionRecords?.total / limit
      );
      setTotalPage(totalPage);
    }
  }, [recordings]);

  const [deleteRecordings] = useMutation(DELETE_RECORDING, {
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [recordingsFTP, { loading: FTPLoading }] = useMutation<{
    recordingsFTP: Success;
  }>(RECORDING_FTP, {
    onCompleted: async (res) => {
      const url = res.recordingsFTP.url;
      setIsLoading("");
      if (url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch file");
          const blob = await response.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = url.split("/").pop() || "recording.mp3";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          dispatch(
            setSuccess({
              success: res.recordingsFTP.success,
              message: res.recordingsFTP.message,
              isMessage: false,
            })
          );
          await deleteRecordings({ variables: { filename: link.download } });
        } catch (error) {
          dispatch(setServerError(true));
        }
      } else {
        dispatch(
          setSuccess({
            success: res.recordingsFTP.success,
            message: res.recordingsFTP.message,
            isMessage: false,
          })
        );
      }
    },
  });

  const [findRecordings, { loading }] = useMutation<{
    findRecordings: Success;
  }>(DL_RECORDINGS, {
    onCompleted: async (res) => {
      const url = res.findRecordings.url;
      setIsLoading("");
      if (url) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Failed to fetch file");
          const blob = await response.blob();
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = url.split("/").pop() || "recording.mp3";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          dispatch(
            setSuccess({
              success: res.findRecordings.success,
              message: res.findRecordings.message,
              isMessage: false,
            })
          );
          await deleteRecordings({ variables: { filename: link.download } });
        } catch (error) {
          dispatch(setServerError(true));
        }
      } else {
        dispatch(
          setSuccess({
            success: res.findRecordings.success,
            message: res.findRecordings.message,
            isMessage: false,
          })
        );
      }
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const onDLRecordings = useCallback(
    async (_id: string, name: string) => {
      setIsLoading(_id);
      try {
        await recordingsFTP({ variables: { _id, fileName: name } });
      } catch (error) {
        await findRecordings({ variables: { _id, name, ccsCall } });
      }
    },
    [setIsLoading, findRecordings, recordingsFTP, ccsCall]
  );

  const onClickSearch = useCallback(() => {
    setTriggeredSearch(dataSearch);
    setDataSearch((prev) => ({ ...prev, dispotype: [] }));
    setPage("1");
    dispatch(setAgentRecordingPage(1));
    refetch();
  }, [setTriggeredSearch, refetch, dataSearch, setDataSearch]);

  const [selectingDispotype, setSelectingDispotype] = useState<boolean>(false);
  const dispotypeRef = useRef<HTMLDivElement | null>(null);
  const recordingsRef = useRef<HTMLDivElement | null>(null);

  const handleOnCheck = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, value: string) => {
      if (e.target.checked) {
        setDataSearch((prev) => ({
          ...prev,
          dispotype: [...prev.dispotype, value],
        }));
      } else {
        setDataSearch((prev) => ({
          ...prev,
          dispotype: prev.dispotype.filter((y) => y !== value),
        }));
      }
    },
    [setDataSearch]
  );

  const [lagRecords, setLagRecords] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (!recordings) return;

    recordings?.getAgentDispositionRecords?.dispositions?.forEach((rec) => {
      const { baseName, durationSeconds } = parseCallId(rec.callId);

      if (ccsCall) {
        if (durationSeconds && durationSeconds > 0) return;
        findLagOnFTP({
          variables: { name: rec.callId },
        }).then(({ data }) => {
          if (data) {
            setLagRecords((prev) => ({
              ...prev,
              [baseName]: data?.findLagOnFTP,
            }));
          } else {
            cantFindOnFTP({ variables: { name: rec.callId } }).then(
              ({ data }) => {
                setLagRecords((prev) => ({
                  ...prev,
                  [baseName]: data?.cantFindOnFTP,
                }));
              }
            );
          }
        });
      } else {
        if (!baseName || durationSeconds !== null || lagRecords[baseName])
          return;
        getLagRecording({
          variables: { name: `${baseName}.mp3`, _id: rec._id },
        }).then((res) => {
          setLagRecords((prev) => ({
            ...prev,
            [baseName]: res.data?.findLagRecording,
          }));
        });
      }
    });
  }, [recordings?.getAgentDispositionRecords?.dispositions]);

  const [lateCallRecordingsData, setLateCallRecordingsData] = useState<
    string[]
  >([]);

  const [lateCallRecording, { loading: lateCallRecordingLoading }] =
    useMutation<{ lateCallRecording: string[] }>(LATE_RECORDING, {
      onCompleted: (data) => {
        setLateCallRecordingsData(data.lateCallRecording);
      },
    });

  const [selectedToFind, setSelectedToFind] = useState<string | null>(null);

  const findLateRecording = useCallback(
    async (_id: string) => {
      if (_id === selectedToFind) {
        setSelectedToFind(null);
      } else {
        setSelectedToFind(_id);
        await lateCallRecording({ variables: { id: _id } });
      }
    },
    [setSelectedToFind, lateCallRecording, selectedToFind]
  );

  function parseCallId(callId?: string) {
    if (!callId)
      return { baseName: "", durationSeconds: null as number | null };
    const durationMatch = callId.match(/\.mp3_(\d+)/);
    const durationSeconds = durationMatch ? Number(durationMatch[1]) : null;
    const baseName = callId.replace(/\.mp3.*/, "");
    return { baseName, durationSeconds };
  }

  function formatDuration(value: number | string) {
    const seconds = parseInt(value as string, 10);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function fileSizeToDuration(fileSizeBytes: number) {
    const bytesPerSecond = (16 * 1000) / 8;
    const seconds = Math.floor(fileSizeBytes / bytesPerSecond);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return ["QA", "TL", "MIS", "QASUPERVISOR"].includes(
    userLogged?.type || ""
  ) ? (
    <Wrapper>
      <Navbar />
      <div
        className="w-full h-full flex flex-col gap-2 overflow-hidden"
        onMouseDown={(e) => {
          if (!dispotypeRef.current?.contains(e.target as Node)) {
            setSelectingDispotype(false);
          }
          if (!recordingsRef.current?.contains(e.target as Node)) {
            setOpenRecordingsBox(null);
          }
        }}
      >
        <h1 className="uppercase text-2xl px-5 font-black text-gray-800">
          {agentInfoData?.getUser?.name}
        </h1>
        <div className=" flex justify-end px-10 gap-5 items-center">
          <motion.div>
            <label className="flex gap-2 items-center justify-center">
              <p>CCS Calls</p>
              <input
                type="checkbox"
                name="ccsCalls"
                id="ccsCalls"
                readOnly
                checked={ccsCall}
                onClick={() => {
                  dispatch(setCCSCall());
                }}
              />
            </label>
          </motion.div>

          <div className="w-60 relative h-full" ref={dispotypeRef}>
            <motion.div
              className="w-full rounded border-gray-600 shadow-md border flex items-center px-2 h-full justify-between"
              onClick={() => {
                setSelectingDispotype(!selectingDispotype);
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {triggeredSearch.dispotype.length > 0 ? (
                <p className="text-xs text-gray-500 cursor-default select-none">
                  {triggeredSearch.dispotype.join(", ")}
                </p>
              ) : (
                <>
                  <p
                    className="text-xs text-gray-500 cursor-default select-none truncate"
                    title={dataSearch.dispotype.join(", ")}
                  >
                    {dataSearch.dispotype.length > 0
                      ? dataSearch.dispotype.join(", ")
                      : "Filter Disposition type"}
                  </p>
                  <RiArrowDropDownFill className="text-2xl" />
                </>
              )}
            </motion.div>
            {selectingDispotype && triggeredSearch.dispotype.length === 0 && (
              <div className="absolute top-9  left-0 w-full border px-2 py-1 rounded-md text-xs text-gray-500 flex flex-col max-h-80 overflow-y-auto bg-white z-50 border-slate-300 shadow-md shadow-black/20 select-none">
                {recordings?.getAgentDispositionRecords.dispocodes.map(
                  (e, index) => (
                    <label key={index} className="py-1 flex gap-1 items-center">
                      <input
                        type="checkbox"
                        name={e}
                        id={e}
                        value={e}
                        checked={dataSearch.dispotype.includes(e)}
                        onChange={(e) => handleOnCheck(e, e.target.value)}
                      />
                      <span>{e}</span>
                    </label>
                  )
                )}
              </div>
            )}
          </div>

          <motion.input
            type="search"
            name="search"
            id="search"
            autoComplete="off"
            value={dataSearch.search}
            placeholder="Search . . ."
            onChange={(e) =>
              setDataSearch({ ...dataSearch, search: e.target.value })
            }
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="border rounded border-gray-600 shadow-md px-2 text-sm w-50 py-1 outline-none"
          />
          <motion.label
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col xl:block"
          >
            <span className="text-gray-800 font-black uppercase text-sm">
              From:{" "}
            </span>
            <input
              type="date"
              name="from"
              id="from"
              value={dataSearch.from}
              onChange={(e) =>
                setDataSearch({ ...dataSearch, from: e.target.value })
              }
              className="border rounded h-full border-gray-600 shadow-md px-2 text-sm w-50 py-1"
            />
          </motion.label>
          <motion.label
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col xl:block"
          >
            <span className="text-gray-800 uppercase font-black text-sm">
              To:{" "}
            </span>
            <input
              type="date"
              name="to"
              id="to"
              value={dataSearch.to}
              onChange={(e) =>
                setDataSearch({ ...dataSearch, to: e.target.value })
              }
              className="border rounded h-full border-gray-600 shadow-md px-2 text-sm w-50 py-1"
            />
          </motion.label>
          <motion.button
            className="h-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClickSearch}
          >
            <div className="bg-blue-500 h-full shadow-md items-center flex font-black text-white cursor-pointer border-blue-800 transition-all uppercase border-2  rounded px-5 text-xs hover:bg-blue-600">
              Search
            </div>
          </motion.button>
        </div>
        <div className="h-full w-full px-5 flex flex-col overflow-hidden">
          <motion.div
            className="w-full relative flex flex-col h-full rounded-md overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="border rounded-t-md lg:text-sm  border-gray-600 flex font-black uppercase 2xl:text-md sticky top-0 z-20 bg-gray-300 text-gray-800">
              <div className="  text-left wlw  w-full justify-center px-4 grid grid-cols-10 gap-3 items-center py-3">
                <div className="">Name</div>
                <div className="truncate">Contact No</div>
                <div>Dialer</div>
                <div>Amount</div>
                <div className="text-nowrap truncate">Payment Date</div>
                <div>Ref No.</div>
                <div>Comment</div>
                <div className="text-nowrap">Dispo Date</div>
                <div>Disposition</div>
                <div className="text-center flex justify-center">Actions</div>
              </div>
            </div>
            <div className="h-full flex justify-center items-center overflow-hidden">
              {recordingsLoading ? (
                <div className="flex flex-col relative justify-center items-center h-full w-full">
                  <div className="border-t-2 rounded-full z-20 w-20 h-20 border-gray-800 animate-spin "></div>
                  <div className="border-2 absolute rounded-full z-10 w-20 h-20 border-gray-200 "></div>
                  <div className="absolute  z-10 text-xs text-gray-400  ">
                    Loading...
                  </div>
                </div>
              ) : (
                <div className="overflow-auto h-full w-full">
                  {(recordings?.getAgentDispositionRecords.dispositions
                    .length || 0) === 0 ? (
                    <div className="bg-gray-200 w-full py-3 border-gray-600 border-x border-b  text-center rounded-b-md shadow-md italic font-sans text-gray-400  text-sm">
                      No account found
                    </div>
                  ) : (
                    <div>
                      {recordings?.getAgentDispositionRecords?.dispositions?.map(
                        (e, index) => {
                          const { baseName, durationSeconds } = parseCallId(
                            e.callId
                          );
                          const lagDurationRaw = lagRecords[baseName];
                          const lagDurationValue =
                            typeof lagDurationRaw === "number"
                              ? lagDurationRaw
                              : Number(lagDurationRaw);

                          const lagDurationLabel =
                            Number.isFinite(lagDurationValue) &&
                            lagDurationValue > 0
                              ? fileSizeToDuration(lagDurationValue)
                              : "";
                          const durationLabel =
                            typeof durationSeconds === "number" &&
                            durationSeconds > 0
                              ? formatDuration(durationSeconds)
                              : lagDurationLabel;

                          const hasRecording =
                            (typeof durationSeconds === "number" &&
                              durationSeconds > 0) ||
                            Boolean(lagDurationLabel);

                          const checkCallId = e.callId.split("_").length > 2;

                          const callRecord =
                            e.recordings?.length > 0
                              ? [...e.recordings].sort(
                                  (a, b) => b.size - a.size
                                )
                              : [];
                          return (
                            <motion.div
                              key={e._id}
                              className="lg:text-xs border-b border-x hover:bg-gray-200 last:shadow-md last:rounded-b-md border-gray-600 2xl:text-sm  items-center py-3 gap-3 pl-4 pr-2 grid grid-cols-10 cursor-default bg-gray-100 even:bg-gray-200 text-slate-800"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div
                                className=" truncate"
                                title={e.customer_name}
                              >
                                {e.customer_name}
                              </div>
                              <div
                                className="truncate pr-2"
                                title={e.contact_no?.join(", ")}
                              >
                                {e.contact_no?.join(", ")}
                              </div>
                              <div className="first-letter:uppercase">
                                {e.dialer ? (
                                  e.dialer
                                ) : (
                                  <div className="text-gray-400 italic text-left  ">
                                    No dialer
                                  </div>
                                )}
                              </div>
                              <div>
                                {e.amount ? (
                                  e.amount.toLocaleString("en-PH", {
                                    style: "currency",
                                    currency: "PHP",
                                  })
                                ) : (
                                  <div className="text-gray-400 italic text-left  ">
                                    No amount
                                  </div>
                                )}
                              </div>
                              <div>
                                {e.payment_date ? (
                                  new Date(e.payment_date).toLocaleDateString()
                                ) : (
                                  <div className="text-gray-400 truncate italic text-left">
                                    No payment date
                                  </div>
                                )}
                              </div>
                              <div title={e.ref_no}>
                                {e.ref_no || (
                                  <div
                                    className="text-gray-400 italic text-left truncate"
                                    title="No reference number"
                                  >
                                    No reference number
                                  </div>
                                )}
                              </div>
                              <div className="truncate" title={e.comment}>
                                {e.comment || (
                                  <div className="text-gray-400 italic text-left">
                                    No comment
                                  </div>
                                )}
                              </div>
                              <div>
                                {new Date(e.createdAt).toLocaleDateString()}
                              </div>
                              <div>{e.dispotype}</div>
                              <div>
                                {isLoading === e._id &&
                                (loading || FTPLoading) ? (
                                  <div className="cursor-progress">
                                    <CgSpinner className="text-xl animate-spin" />
                                  </div>
                                ) : (
                                  <div>
                                    {ccsCall ? (
                                      <div className="flex justify-end items-center w-full">
                                        {checkCallId ? (
                                          <>
                                            {hasRecording ? (
                                              <div
                                                onClick={() =>
                                                  onDLRecordings(
                                                    e._id,
                                                    e.callId
                                                  )
                                                }
                                                className="bg-blue-500 shadow-md flex gap-1 rounded-sm border cursor-pointer border-blue-800 w-20 justify-center items-center text-center py-[6px] hover:bg-blue-600 transition-all"
                                              >
                                                <FaDownload color="white" />
                                                <p className="text-white">
                                                  {durationLabel || "Download"}
                                                </p>
                                              </div>
                                            ) : (
                                              <div className="text-gray-400 italic text-center">
                                                No Recordings
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="relative">
                                            {selectedToFind &&
                                              selectedToFind === e._id && (
                                                <div className="absolute right-[104%] border p-2 flex flex-col gap-2 bg-white">
                                                  {!lateCallRecordingLoading ? (
                                                    <>
                                                      {lateCallRecordingsData.map(
                                                        (x, index) => {
                                                          const duration = x
                                                            .split(".mp3_")[1]
                                                            .split("_")[0];

                                                          return (
                                                            <div
                                                              key={index}
                                                              className="bg-blue-500 shadow-md flex gap-1 rounded-sm border cursor-pointer border-blue-800 w-20 justify-center items-center text-center py-[6px] hover:bg-blue-600 transition-all"
                                                              onClick={()=> {
                                                                onDLRecordings(e._id,x)
                                                               
                                                              }}
                                                            >
                                                              <FaDownload color="white" />
                                                              <p className="text-white">
                                                                {formatDuration(
                                                                  duration
                                                                )}
                                                              </p>
                                                            </div>
                                                          );
                                                        }
                                                      )}
                                                    </>
                                                  ) : (
                                                    <div className="cursor-progress">
                                                      <CgSpinner className="text-xl animate-spin" />
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                            <div
                                              className="bg-blue-500 shadow-md flex gap-1 rounded-sm border cursor-pointer border-blue-800 w-20 justify-center items-center text-center py-[6px] hover:bg-blue-600 transition-all"
                                              onClick={() => {
                                                findLateRecording(e._id);
                                              }}
                                            >
                                              <p className="text-white">
                                                Click Me
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                        {e.recordings?.length > 0 ? (
                                          <div className="flex gap-1 relative">
                                            {callRecord?.length > 1 &&
                                              (() => {
                                                const others =
                                                  callRecord.slice(1);
                                                return (
                                                  <div className="flex justify-end w-full ">
                                                    <div
                                                      onClick={() => {
                                                        if (
                                                          !openRecordingsBox
                                                        ) {
                                                          setOpenRecordingsBox(
                                                            e._id
                                                          );
                                                        } else {
                                                          setOpenRecordingsBox(
                                                            null
                                                          );
                                                        }
                                                      }}
                                                      className=" bg-fuchsia-600 items-center flex shadow-md cursor-pointer border-fuchsia-900 hover:bg-fuchsia-700 transition-all border rounded-sm px-3 py-1"
                                                    >
                                                      <FaBoxArchive
                                                        className="text-white peer"
                                                        title="Others"
                                                      />
                                                    </div>
                                                    {openRecordingsBox ===
                                                      e._id && (
                                                      <div
                                                        className="absolute border border-slate-500 text-gray-700 right-full w-auto mr-2 shadow shadow-black/40 bg-white"
                                                        ref={recordingsRef}
                                                      >
                                                        {others.map(
                                                          (o, index) => (
                                                            <div
                                                              key={index}
                                                              onClick={() =>
                                                                onDLRecordings(
                                                                  e._id,
                                                                  o.name
                                                                )
                                                              }
                                                              className="text-nowrap flex p-2 bg-white rouned items-center cursor-pointer gap-2 hover:bg-blue-200"
                                                            >
                                                              <p className="mr-">
                                                                {fileSizeToDuration(
                                                                  o.size
                                                                )}{" "}
                                                              </p>
                                                              <div>
                                                                {o.name}
                                                              </div>
                                                              <FaDownload />
                                                            </div>
                                                          )
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })()}
                                            <div
                                              title={callRecord[0]?.name}
                                              className="flex justify-end items-center w-full"
                                            >
                                              <div
                                                onClick={() =>
                                                  onDLRecordings(
                                                    e._id,
                                                    callRecord[0]?.name
                                                  )
                                                }
                                                className="bg-blue-500 shadow-md flex gap-1 rounded-sm border cursor-pointer border-blue-800 w-16  justify-center items-center text-center py-[6px] hover:bg-blue-600 transition-all"
                                              >
                                                <FaDownload color="white" />
                                                <p className="text-white">
                                                  {fileSizeToDuration(
                                                    callRecord[0]?.size
                                                  )}{" "}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-gray-400 italic text-center">
                                            No Recordings
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <Pagination
          value={page}
          onChangeValue={(e) => setPage(e)}
          onKeyDownValue={(e) => dispatch(setAgentRecordingPage(e))}
          totalPage={totalPage}
          currentPage={agentRecordingPage}
        />
      </div>
    </Wrapper>
  ) : (
    <Navigate to="/" />
  );
};

export default AgentRecordingView;
