import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { RootState, useAppDispatch } from "../../redux/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiArrowDropDownFill } from "react-icons/ri";
import {
  setAgentRecordingPage,
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
  ) {
    getAgentDispositionRecords(
      agentID: $agentID
      limit: $limit
      page: $page
      from: $from
      to: $to
      search: $search
      dispotype: $dispotype
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
  mutation findRecordings($_id: ID!, $name: String!) {
    findRecordings(_id: $_id, name: $name) {
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

const AgentRecordingView = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { limit, agentRecordingPage, userLogged } = useSelector(
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
    },
    notifyOnNetworkStatusChange: true,
    skip: !isAgentRecordings,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, []);

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
  }, [triggeredSearch.search]);

  useEffect(() => {
    dispatch(setAgentRecordingPage(1));
  }, [location.pathname]);

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
      await findRecordings({ variables: { _id, name } });
    },
    [setIsLoading, findRecordings]
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

  function fileSizeToDuration(fileSizeBytes: number) {
    const bytesPerSecond = (16 * 1000) / 8;
    const seconds = Math.floor(fileSizeBytes / bytesPerSecond);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  // if (recordingsLoading) return <Loading />;

  return ["QA", "TL", "MIS"].includes(userLogged?.type || "") ? (
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
        <div className=" flex justify-end px-10 gap-5">
          <div className="w-60 relative" ref={dispotypeRef}>
            <motion.div
              className="w-full rounded border-slate-300 border flex items-center px-2 h-full justify-between"
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
              <div className="absolute top-9 left-0 w-full border px-2 py-1 rounded-md text-xs text-gray-500 flex flex-col max-h-80 overflow-y-auto bg-white z-50 border-slate-300 shadow-md shadow-black/20 select-none">
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
            className="border rounded border-slate-300 px-2 text-sm w-50 py-1 outline-none"
          />
          <motion.label
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
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
              className="border rounded h-full border-slate-300 px-2 text-sm w-50 py-1"
            />
          </motion.label>
          <motion.label
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
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
              className="border rounded h-full border-slate-300 px-2 text-sm w-50 py-1"
            />
          </motion.label>
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClickSearch}
          >
            <div className="bg-blue-500 h-full items-center flex font-black text-white cursor-pointer border-blue-800 transition-all uppercase border-2  rounded px-5 text-xs hover:bg-blue-600">
              Search
            </div>
          </motion.button>
        </div>
        <div className="h-full w-full px-5 flex flex-col overflow-hidden">
          <motion.div
            className="w-full h-full rounded-md overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="lg:text-sm font-black uppercase 2xl:text-lg sticky top-0 z-20 bg-gray-300 text-gray-800">
              <div className="text-left justify-center px-4 grid grid-cols-10 gap-3 items-center py-3">
                <div className="">Name</div>
                <div>Contact No</div>
                <div>Dialer</div>
                <div>Amount</div>
                <div className="text-nowrap truncate">Payment Date</div>
                <div>Ref No.</div>
                <div>Comment</div>
                <div className="text-nowrap">Dispo Date</div>
                <div>Disposition</div>
                <div className="text-center flex justify-center" >Actions</div>
              </div>
            </div>
            <div className=" overflow-auto h-full">
              {recordings?.getAgentDispositionRecords.dispositions.map(
                (e, index) => {
                  const callRecord =
                    e.recordings?.length > 0
                      ? [...e.recordings].sort((a, b) => b.size - a.size)
                      : [];
                  return (
                    <motion.div
                      key={e._id}
                      className="lg:text-xs 2xl:text-sm  items-center py-3 gap-3 pl-4 pr-2 grid grid-cols-10 cursor-default bg-gray-100 even:bg-gray-200 text-slate-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className=" truncate">{e.customer_name}</div>
                      <div
                        className="truncate pr-2"
                        title={e.contact_no.join(", ")}
                      >
                        {e.contact_no.join(", ")}
                      </div>
                      <div>{e.dialer}</div>
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
                          <div className="text-gray-400 italic text-left">
                            No payment date
                          </div>
                        )}
                      </div>
                      <div title={e.ref_no}>
                        {e.ref_no || (
                          <div
                            className="text-gray-400 italic text-left truncate"
                            title="
                            No reference number"
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
                      <div>{new Date(e.createdAt).toLocaleDateString()}</div>
                      <div>{e.dispotype}</div>
                      <div>
                        {isLoading === e._id && loading ? (
                          <div className="cursor-progress">
                            <CgSpinner className="text-xl animate-spin" />
                          </div>
                        ) : (
                          <div className="">
                            {e.recordings?.length > 0 ? (
                              <div className="flex gap-1 ">
                                {callRecord?.length > 1 &&
                                  (() => {
                                    const others = callRecord.slice(1);
                                    return (
                                      <div className="flex justify-end w-full ">
                                        <div
                                          onClick={() => {
                                            if (openRecordingsBox === e._id) {
                                              setOpenRecordingsBox(null);
                                            } else {
                                              setOpenRecordingsBox(e._id);
                                            }
                                          }}
                                          className=" bg-fuchsia-700 items-center flex shadow-md cursor-pointer border-fuchsia-900 hover:bg-fuchsia-800 transition-all border rounded-sm px-3 py-1"
                                        >
                                          <FaBoxArchive
                                            className="text-white peer"
                                            title="Others"
                                          />
                                        </div>
                                        {openRecordingsBox === e._id && (
                                          <div
                                            className="absolute border border-slate-500 text-gray-700 right-full w-auto mr-2 shadow shadow-black/40 bg-white"
                                            ref={recordingsRef}
                                          >
                                            {others.map((o, index) => (
                                              <div
                                                key={index}
                                                onClick={() =>
                                                  onDLRecordings(e._id, o.name)
                                                }
                                                className="text-nowrap flex p-2 bg-white rouned items-center cursor-pointer gap-2"
                                              >
                                                <p className="mr-">
                                                  {fileSizeToDuration(o.size)}{" "}
                                                </p>
                                                <div>{o.name}</div>
                                                <FaDownload />
                                              </div>
                                            ))}
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
                                      onDLRecordings(e._id, callRecord[0]?.name)
                                    }
                                    className="bg-blue-500 shadow-md flex gap-1 rounded-sm border cursor-pointer border-blue-800 w-16  justify-center items-center text-center py-[6px] hover:bg-blue-600 transition-all"
                                  >
                                    <FaDownload color="white" />
                                    <p className="text-white">
                                      {fileSizeToDuration(callRecord[0]?.size)}{" "}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-gray-400 italic text-center">
                                No Recordings
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                }
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
