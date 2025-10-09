import {
  useMutation,
  useQuery,
  useSubscription,
  useLazyQuery,
} from "@apollo/client";
import gql from "graphql-tag";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import React, { useCallback, useEffect, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useLocation } from "react-router-dom";
import Loading from "../Loading";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

type Finished = {
  name: string;
};

type Callfile = {
  _id: string;
  bucket: string;
  name: string;
  createdAt: string;
  active: boolean;
  endo: string;
  finished_by: Finished;
  totalPrincipal: number;
  target: number;
};

type Result = {
  callfile: Callfile;
  accounts: number;
  connected: number;
  target: number;
  collected: number;
  uncontactable: number;
  principal: number;
  OB: number;
};

type CallFilesResult = {
  result: [Result];
  count: number;
};

type Success = {
  success: boolean;
  message: string;
};

const FINISHED_CALLFILE = gql`
  mutation FinishedCallfile($callfile: ID!) {
    finishedCallfile(callfile: $callfile) {
      success
      message
    }
  }
`;

const DELETE_CALLFILE = gql`
  mutation DeleteCallfile($callfile: ID!) {
    deleteCallfile(callfile: $callfile) {
      success
      message
    }
  }
`;

const GET_CALLFILES = gql`
  query getCallfiles($limit: Int!, $page: Int!, $status: String!, $bucket: ID) {
    getCallfiles(limit: $limit, page: $page, status: $status, bucket: $bucket) {
      result {
        callfile {
          _id
          name
          bucket
          createdAt
          active
          endo
          totalPrincipal
          target
          finished_by {
            name
          }
        }
        accounts
        connected
        target
        collected
        uncontactable
        principal
        OB
      }
      count
    }
  }
`;

const GET_CSV_FILES = gql`
  query downloadCallfiles($callfile: ID!) {
    downloadCallfiles(callfile: $callfile)
  }
`;

type Props = {
  bucket: string;
  status: string;
  successUpload: boolean;
  setTotalPage: (e: number) => void;
  setCanUpload: (e: boolean) => void;
  setUploading: () => void;
};

const UPDATE_ON_CALLFILES = gql`
  subscription UpdateOnCallfiles {
    updateOnCallfiles {
      message
      bucket
    }
  }
`;

const NEW_UPLOADED_CALLFILE = gql`
  subscription newCallfile {
    newCallfile {
      message
      bucket
    }
  }
`;

type SubSuccess = {
  message: string;
  bucket: string;
};

type Data = {
  account_no: string;
  amount: number;
  date: string;
};

const ADD_SELECTIVE = gql`
  mutation addSelective(
    $_id: ID
    $selectiveName: String
    $selectives: [Selective]
  ) {
    addSelective(
      _id: $_id
      selectiveName: $selectiveName
      selectives: $selectives
    ) {
      message
      success
    }
  }
`;
const SET_CALLFILE_TARGET = gql`
  mutation setCallfileTarget($callfile: ID!, $target: Float!) {
    setCallfileTarget(callfile: $callfile, target: $target) {
      success
      message
    }
  }
`;
const CallfilesViews: React.FC<Props> = ({
  bucket,
  status,
  setTotalPage,
  setCanUpload,
  successUpload,
  setUploading,
}) => {
  const { limit, productionManagerPage, userLogged } = useSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [modalTarget, setModalTarget] = useState<boolean>(false);
  const [callfileTarget, setTarget] = useState<number>(0);
  const isProductionManager = location.pathname !== "/tl-production-manager";
  const [callfileId, setCallfileId] = useState<Callfile | null>(null);
  const [addSelectiveModal, setAddSelectiveModal] = useState<boolean>(false);
  const [file, setFile] = useState<File[]>([]);

  const { data, refetch, loading } = useQuery<{
    getCallfiles: CallFilesResult;
  }>(GET_CALLFILES, {
    variables: {
      bucket,
      status,
      limit,
      page: productionManagerPage,
    },
    skip: isProductionManager,
    notifyOnNetworkStatusChange: true,
  });


  useEffect(() => {
    if (bucket) {
      const timer = async () => {
        await refetch();
      };
      timer();
    }
  }, [bucket, refetch]);

  useEffect(() => {
    if (successUpload) {
      const timer = setTimeout(async () => {
        try {
          const res = await refetch();
          if (res.data) {
            dispatch(
              setSuccess({
                success: true,
                message: "File successfully uploaded",
                isMessage: false,
              })
            );
            setUploading();
          }
        } catch (error) {
          dispatch(setServerError(true));
        }
      });
      return () => clearTimeout(timer);
    }
  }, [successUpload]);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(async () => {
        await refetch();
      });
      return () => clearTimeout(timer);
    }
  }, [status]);

  const [downloadCallfiles, { loading: downloadCallfilesLoading }] =
    useLazyQuery(GET_CSV_FILES);

  useSubscription<{ newCallfile: SubSuccess }>(NEW_UPLOADED_CALLFILE, {
    onData: async ({ data }) => {
      if (data) {
        if (
          data.data?.newCallfile?.message === "SOMETHING_NEW_ON_CALLFILE" &&
          userLogged?.buckets
            .toString()
            .includes(data.data?.newCallfile?.bucket)
        ) {
          await refetch();
        }
      }
    },
  });

  useSubscription<{ updateOnCallfiles: SubSuccess }>(UPDATE_ON_CALLFILES, {
    onData: async ({ data }) => {
      if (data) {
        if (
          data.data?.updateOnCallfiles?.message === "FINISHED_CALLFILE" &&
          userLogged?.buckets
            .toString()
            .includes(data.data?.updateOnCallfiles?.bucket)
        ) {
          await refetch();
        }
      }
    },
  });

  const [confirm, setConfirm] = useState(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "FINISHED" as "FINISHED" | "DELETE" | "DOWNLOAD" | "SET",
    yes: () => {},
    no: () => {},
  });

  const [finishedCallfile, { loading: finishingLoading }] = useMutation<{
    finishedCallfile: Success;
  }>(FINISHED_CALLFILE, {
    onCompleted: async (data) => {
      setConfirm(false);
      try {
        const res = await refetch();
        if (res.data) {
          dispatch(
            setSuccess({
              success: data.finishedCallfile.success,
              message: data.finishedCallfile.message,
              isMessage: false,
            })
          );
        }
      } catch (error) {
        if (error) {
          dispatch(setServerError(true));
        }
      }
    },
    onError: () => {
      setConfirm(false);
      dispatch(setServerError(true));
    },
  });

  const [deleteCallfile, { loading: deleteLoading }] = useMutation<{
    deleteCallfile: Success;
  }>(DELETE_CALLFILE, {
    onCompleted: async (data) => {
      setConfirm(false);
      try {
        const res = await refetch();
        if (res.data) {
          dispatch(
            setSuccess({
              success: data.deleteCallfile.success,
              message: data.deleteCallfile.message,
              isMessage: false,
            })
          );
        }
      } catch (error) {
        dispatch(setServerError(true));
      }
    },
    onError: () => {
      setConfirm(false);
      dispatch(setServerError(true));
    },
  });

  const [setCallfileTarget, { loading: setCallfileTargetLoading }] =
    useMutation<{ setCallfileTarget: Success }>(SET_CALLFILE_TARGET, {
      onCompleted: async (data) => {
        try {
          setConfirm(false);
          setModalTarget(false);
          const res = await refetch();
          if (res.data) {
            dispatch(
              setSuccess({
                success: data.setCallfileTarget.success,
                message: data.setCallfileTarget.message,
                isMessage: false,
              })
            );
            setTarget(0);
          }
        } catch (error) {
          dispatch(setServerError(true));
          setTarget(0);
        }
      },
      onError: () => {
        setConfirm(false);
        setModalTarget(false);
        setTarget(0);
        dispatch(setServerError(true));
      },
    });

  const onClickIcon = (
    id: string,
    action: "FINISHED" | "DELETE" | "DOWNLOAD" | "SET",
    name: string
  ) => {
    setConfirm(true);
    const modalTxt = {
      FINISHED: `Are you sure this ${name.toUpperCase()} callfile are finished?`,
      DELETE: `Are you sure you want to delete ${name.toUpperCase()} callfile?`,
      DOWNLOAD: `Are you sure you want to download ${name.toUpperCase()} callfile?`,
      SET: `Are you sure you want to set the target ${name.toLocaleLowerCase()} callfile?`,
    };

    const fn = {
      FINISHED: async () => {
        await finishedCallfile({ variables: { callfile: id } });
      },
      DELETE: async () => {
        await deleteCallfile({ variables: { callfile: id } });
      },
      DOWNLOAD: async () => {
        try {
          const { data } = await downloadCallfiles({
            variables: { callfile: id },
          });
          if (!data.downloadCallfiles) {
            setConfirm(false);
            dispatch(setServerError(true));
            return;
          }
          const blob = new Blob([data.downloadCallfiles], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${name}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setConfirm(false);
          dispatch(
            setSuccess({
              success: true,
              message: `${name}.csv successfully downloaded`,
              isMessage: false,
            })
          );
        } catch (err) {
          dispatch(setServerError(true));
        }
      },
      SET: async () => {
        await setCallfileTarget({
          variables: { callfile: id, target: callfileTarget },
        });
      },
    };

    setModalProps({
      message: modalTxt[action],
      toggle: action,
      yes: fn[action],
      no: () => {
        setConfirm(false);
      },
    });
  };

  const handleOnChangeAmount = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/[^0-9.]/g, "");
      const parts = inputValue.split(".");

      if (parts.length > 2) {
        inputValue = parts[0] + "." + parts[1];
      } else if (parts.length === 2) {
        inputValue = parts[0] + "." + parts[1].slice(0, 2);
      }

      if (inputValue.startsWith("00")) {
        inputValue = "0";
      }

      if (Number(inputValue) > Number(callfileId?.totalPrincipal)) {
        setTarget(Number(callfileId?.totalPrincipal));
      } else {
        setTarget(Number(inputValue));
      }
    },
    [setTarget, callfileId]
  );

  useEffect(() => {
    if (data) {
      setTotalPage(Math.ceil(data.getCallfiles.count / 20));
      const newData = data?.getCallfiles.result
        .map((e) => e.callfile.active)
        .toString()
        .includes("true");
      setCanUpload(!newData);
    } else {
      setCanUpload(true);
    }
  }, [data, setTotalPage, setCanUpload]);

  const [required, setRequired] = useState(false);
  const [excelData, setExcelData] = useState<Data[]>([]);
  const [callfile, setCallfile] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const { read, utils, SSF } = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: Data[] = utils.sheet_to_json(sheet);
        const dateConverting = jsonData.map((row) => {
          const safeDate = (date: string) => {
            try {
              return date ? SSF.format("yyyy-mm-dd", date) : undefined;
            } catch {
              return undefined;
            }
          };
          return {
            account_no: String(row.account_no),
            amount: Number(row.amount),
            date: safeDate(row.date),
          };
        });
        setExcelData(dateConverting.slice(0, dateConverting.length));
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      dispatch(setServerError(true));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-excel": [],
      "text/csv": [],
      "application/csv": [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles);
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const [addSelective] = useMutation<{ addSelective: Success }>(ADD_SELECTIVE, {
    onCompleted: (data) => {
      setFile([]);
      dispatch(
        setSuccess({
          success: data.addSelective.success,
          message: data.addSelective.message,
          isMessage: false,
        })
      );
      setCallfile(null);
      setExcelData([]);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });
  const submitSetSelective = useCallback(() => {
    if (file.length > 0) {
      setRequired(false);
      setConfirm(true);
      setModalProps({
        message: "Are you sure you want to add this selective?",
        toggle: "FINISHED",
        yes: async () => {
          setConfirm(false);
          await addSelective({
            variables: {
              _id: callfile,
              selectiveName: file[0].name,
              selectives: excelData,
            },
          });
          setAddSelectiveModal(false);
        },
        no: () => {
          setConfirm(false);
        },
      });
    } else {
      setRequired(true);
    }
  }, [setRequired, file, callfile, addSelective, setModalProps, excelData]);

  const isLoading =
    downloadCallfilesLoading ||
    deleteLoading ||
    finishingLoading ||
    loading ||
    setCallfileTargetLoading;

  if (isLoading) return <Loading />;

  const labels = [
    "Name",
    "Date",
    "Endo",
    "Work Days",
    "Accounts",
    "Unworkable",
    "Connected",
    "OB",
    "Principal",
    "Target",
    "Collected",
    "Status",
    "Finished By",
    "",
  ];

  return (
    <>
      <motion.div
        className=" h-full w-full overflow-hidden px-5 flex-nowrap overflow-x-auto inline flex-col relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-full h-full rounded-b-sm overflow-hidden flex flex-col text-left">
          <div className="w-full">
            <div className=" w-full px-2 py-2 uppercase rounded-t-md truncate bg-gray-300 grid grid-cols-[repeat(14,_minmax(0,_1fr))] gap-2 font-black text-black text-xs">
              {labels.map((x, index) => (
                <div
                  className="w-full text-ellipsis cursor-default truncate"
                  title={x}
                  key={index}
                >
                  {x}
                </div>
              ))}
            </div>
          </div>
          <div className=" overflow-y-auto h-full">
            {data?.getCallfiles?.result?.map((res, index) => {
              const date = new Date(res.callfile.createdAt);
              const today = new Date();
  
              const diffTime = today.getTime() - date.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              const checkStatus = res.callfile.active && !res.callfile.endo;
              const status = checkStatus ? "Active" : "Finished";
              const finishedBy = res.callfile.finished_by
                ? res.callfile.finished_by.name
                : "-";
              return (
                <motion.div
                  key={index}
                  className="text-[0.7rem] items-center py-2 px-3 bg-gray-100 even:bg-gray-200 2xl:text-xs gap-2 text-gray-600 grid grid-cols-[repeat(14,_minmax(0,_1fr))] w-full "
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="truncate pr-2" title={res.callfile.name}>
                    {res.callfile.name}
                  </div>
                  <div>
                    {new Date(res.callfile.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    {res.callfile.endo
                      ? new Date(res.callfile.endo).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>{diffDays}</div>
                  <div>{res.accounts}</div>
                  <div>{res.uncontactable || 0}</div>
                  <div>{res.connected}</div>
                  <div
                    className="truncate cursor-default"
                    title={res.OB.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  >
                    {res.OB.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </div>
                  <div
                    className="truncate cursor-default"
                    title={res.principal.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  >
                    {res.principal.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </div>
                  <div
                    className="truncate cursor-default"
                    title={res.target.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  >
                    {res.target.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </div>
                  <div
                    className="truncate cursor-default"
                    title={res.collected.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  >
                    {res.collected.toLocaleString("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    })}
                  </div>
                  <div>{status}</div>
                  <div className="truncate" title={finishedBy}>
                    {finishedBy}
                  </div>
                  <div
                    className={`" ${
                      checkStatus
                        ? "grid grid-rows-2 grid-cols-2 gap-2"
                        : "flex"
                    }  justify-center items-center  "`}
                  >
                    {checkStatus && (
                      <>
                        <div
                          className="rounded-sm shadow-sm flex justify-center hover:bg-purple-800 transition-all px-1 py-1 cursor-pointer bg-purple-700 text-white border border-purple-800"
                          onClick={() => {
                            setAddSelectiveModal((prev) => !prev);
                            setCallfile(res.callfile._id);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                            stroke="currentColor"
                            className="size-5 "
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                        </div>

                        <div
                          className="rounded-sm flex shadow-sm justify-center hover:bg-green-800 px-1 py-1 cursor-pointer bg-green-700 text-white border border-green-800"
                          onClick={() =>
                            onClickIcon(
                              res.callfile._id,
                              "FINISHED",
                              res.callfile.name
                            )
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="3"
                            stroke="currentColor"
                            className="size-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m4.5 12.75 6 6 9-13.5"
                            />
                          </svg>
                        </div>
                        <div
                          onClick={() => {
                            setModalTarget(true);
                            setCallfileId(res.callfile);
                          }}
                          className="rounded-sm flex shadow-sm justify-center hover:bg-orange-800 px-1 py-1 cursor-pointer bg-orange-700 text-white border border-orange-800"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="size-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        </div>
                      </>
                    )}
                    {/* <FaTrash className=" text-red-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" onClick={()=> onClickIcon(res.callfile._id, "DELETE", res.callfile.name)} title="Delete"/> */}
                    <div
                      onClick={() =>
                        onClickIcon(
                          res.callfile._id,
                          "DOWNLOAD",
                          res.callfile.name
                        )
                      }
                      className="rounded-sm flex shadow-sm justify-center hover:bg-blue-800 px-1 py-1 cursor-pointer bg-blue-700 text-white border border-blue-800"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
      {confirm && <Confirmation {...modalProps} />}
      <AnimatePresence>
        {modalTarget && callfileId && (
          <div className="absolute top-0 left-0  w-full h-full z-40 flex items-center justify-center">
            <motion.div
              onClick={() => setModalTarget(false)}
              className="absolute cursor-pointer z-10 bg-black/20 backdrop-blur-xs w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            <motion.div
              className="w-2/8 border-2 border-orange-800 z-20 h-2/5 rounded-md flex flex-col overflow-hidden"
              initial={{ scale: 0.8, opacity: 0}}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <h1 className="p-2 py-4 text-3xl bg-orange-500 text-center font-black text-white uppercase">
                Set Target
              </h1>
              <div className="w-full h-full bg-white flex items-center justify-center flex-col gap-8">
                <label className="flex gap-2 w-full px-7 flex-col">
                  <p className="2xl:text-2xl text-center font-black uppercase lg:text-lg">
                    Enter Callfile Target
                  </p>
                  <input
                    type="text"
                    className="text-base border w-full px-2 py-1.5 rounded outline-0"
                    value={callfileTarget}
                    onChange={handleOnChangeAmount}
                  />
                </label>
                <div className="flex gap-5">
                  <button
                    className="w-30 bg-orange-500 py-2 rounded text-white hover:bg-orange-700 cursor-pointer"
                    onClick={() =>
                      onClickIcon(callfileId._id, "SET", callfileId.name)
                    }
                  >
                    Submit
                  </button>
                  <button
                    className="w-30 bg-slate-500 py-2 rounded text-white hover:bg-slate-700 cursor-pointer"
                    onClick={() => {
                      setModalTarget(false);
                      setCallfileId(null);
                      setTarget(0);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addSelectiveModal && (
          <div className="absolute top-0 left-0 w-full h-full z-40 flex items-center justify-center">
            <motion.div
              onClick={() => setAddSelectiveModal(false)}
              className="absolute cursor-pointer z-10 bg-black/20 backdrop-blur-xs w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>

            <motion.div className="w-2/8 border-2 z-20 h-2/5 rounded-md flex flex-col overflow-hidden border-purple-800"
              initial={{ scale: 0.8, opacity: 0}}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            
            >
              <h1 className="px-2 py-4 text-3xl bg-purple-700 font-black text-white text-center uppercase">
                Add Selectives
              </h1>
              <div className="w-full h-full bg-white flex items-center justify-center px-5 flex-col gap-8">
                <div
                  {...getRootProps()}
                  className={`${
                    required && "border-red-500 bg-red-50"
                  } border-2 border-dashed p-2 rounded-lg text-center cursor-pointer px-10 py-10 flex items-center justify-center lg:text-xs 2xl:sm`}
                >
                  <input {...getInputProps()} />
                  {file.length === 0 && (
                    <>
                      {isDragActive ? (
                        <p className="text-blue-600">
                          📂 Drop your files here...
                        </p>
                      ) : (
                        <p className="text-gray-600">
                          Drag & Drop file here or Click and select file
                        </p>
                      )}
                    </>
                  )}
                  {file.length > 0 && (
                    <ul>
                      {file.map((file) => (
                        <li key={file.name} className="text-green-600">
                          📄 {file.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-5">
                  <button
                    className="w-30 bg-purple-700 py-2 rounded text-white hover:bg-purple-800 cursor-pointer"
                    onClick={submitSetSelective}
                  >
                    Submit
                  </button>
                  <button
                    className="w-30 bg-slate-500 py-2 rounded text-white hover:bg-slate-700 cursor-pointer"
                    onClick={() => {
                      setAddSelectiveModal((prev) => !prev);
                      setFile([]);
                      setRequired(false);
                      setCallfile(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallfilesViews;
