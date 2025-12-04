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
import Loading from "../Loading.tsx";
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
  autoDial: boolean;
  roundCount: number;
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
          autoDial
          roundCount
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

const CHECK_IF_AUTODIAL_FINISHED = gql`
  query checkIfCallfileAutoIsDone($callfile: ID) {
    checkIfCallfileAutoIsDone(callfile: $callfile)
  }
`;

const GET_CSV_FILES = gql`
  query downloadCallfiles($callfile: ID!) {
    downloadCallfiles(callfile: $callfile)
  }
`;

const SET_CALLFILE_AUTO_DIAL = gql`
  mutation setCallfileToAutoDial(
    $callfileId: ID!
    $roundCount: Int!
    $finished: Boolean!
  ) {
    setCallfileToAutoDial(
      callfileId: $callfileId
      roundCount: $roundCount
      finished: $finished
    ) {
      message
      success
    }
  }
`;

type Props = {
  bucket: string | null;
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

const UPDATE_DIAL_NEXT = gql`
  mutation updateDialNext($callfile: ID!) {
    updateDialNext(callfile: $callfile) {
      success
      message
    }
  }
`;

const SELECTED_BUCKET = gql`
  query selectedBucket($id: ID) {
    selectedBucket(id: $id) {
      canCall
    }
  }
`;

type Bucket = {
  canCall: boolean;
};

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
  const [autoDial, setAutoDial] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [count, setCount] = useState<number>(1);

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

  const { data: selectedBucketData } = useQuery<{ selectedBucket: Bucket }>(
    SELECTED_BUCKET,
    {
      notifyOnNetworkStatusChange: true,
      skip: !bucket,
      variables: { id: bucket },
    }
  );

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
    toggle: "FINISHED" as
      | "FINISHED"
      | "DELETE"
      | "DOWNLOAD"
      | "SET"
      | "AUTO"
      | "DIAL",
    yes: () => {},
    no: () => {},
  });

  const item = data?.getCallfiles?.result?.[0];

  const [downloadCallfiles, { loading: downloadCallfilesLoading }] =
    useLazyQuery(GET_CSV_FILES);

  const [setCallfileToAutoDial, { loading: autodialLoading }] = useMutation<{
    setCallfileToAutoDial: Success;
  }>(SET_CALLFILE_AUTO_DIAL, {
    onCompleted: async (data) => {
      setConfirm(false);
      setAutoDial(null);
      if (!item?.callfile?.autoDial) {
        dispatch(
          setSuccess({
            success: data.setCallfileToAutoDial.success,
            message: data.setCallfileToAutoDial.message,
            isMessage: false,
          })
        );
      }

      await refetch();
    },
    onError: () => {
      setConfirm(false);
      setAutoDial(null);
      dispatch(setServerError(true));
    },
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

  const [updateDialNext] = useMutation<{ updateDialNext: Success }>(
    UPDATE_DIAL_NEXT,
    {
      onCompleted: (data) => {
        setConfirm(false);
        dispatch(
          setSuccess({
            success: data.updateDialNext.success,
            message: data.updateDialNext.message,
            isMessage: false,
          })
        );
      },
    }
  );

  const onClickIcon = (
    id: string,
    action: "FINISHED" | "DELETE" | "DOWNLOAD" | "SET" | "AUTO" | "DIAL",
    name: string
  ) => {
    setConfirm(true);
    const modalTxt = {
      FINISHED: `Are you sure this ${name.toUpperCase()} callfile are finished?`,
      DELETE: `Are you sure you want to delete ${name.toUpperCase()} callfile?`,
      DOWNLOAD: `Are you sure you want to download ${name.toUpperCase()} callfile?`,
      SET: `Are you sure you want to set the target ${name.toUpperCase()} callfile?`,
      AUTO: `Are you sure you want to ${
        autoDial ? "set auto dial" : "stop auto dial"
      } ${name.toUpperCase()} callfile?`,
      DIAL: `Are you sure this ${name.toUpperCase()} callfile reset the dial next?`,
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
          if (!data) {
            setConfirm(false);
            dispatch(setServerError(true));
            return;
          }

          const link = document.createElement("a");
          link.href = data.downloadCallfiles; // now this is the file URL
          link.download = `${name}.csv`;
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
          console.log(err);
          setConfirm(false);
          dispatch(setServerError(true));
        }
      },
      SET: async () => {
        await setCallfileTarget({
          variables: { callfile: id, target: callfileTarget },
        });
      },
      AUTO: async () => {
        await setCallfileToAutoDial({
          variables: { callfileId: id, roundCount: count, finished: false },
        });
      },
      DIAL: async () => {
        await updateDialNext({
          variables: { callfile: id },
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

  //for selectives file adding
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const { read, utils, SSF } = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: Data[] = utils.sheet_to_json(sheet, { raw: true });
        const dateConverting = jsonData.map((row) => {
          const normalizedRow = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key.trim(), value])
          );
          const safeDate = (date: string) => {
            try {
              return date ? SSF.format("yyyy-mm-dd", date) : undefined;
            } catch {
              return undefined;
            }
          };
          return {
            account_no: String(normalizedRow.account_no),
            amount: Number(normalizedRow.amount),
            date: safeDate(normalizedRow.date as string),
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

  const { data: isAutoDialFinished, refetch: IADFRefetching } = useQuery<{
    checkIfCallfileAutoIsDone: boolean;
  }>(CHECK_IF_AUTODIAL_FINISHED, {
    variables: { callfile: item?.callfile?._id },
    notifyOnNetworkStatusChange: true,
    skip: status !== "active",
  });

  const isFinishedAuto = isAutoDialFinished?.checkIfCallfileAutoIsDone;

  useEffect(() => {
    const refetching = async () => {
      await IADFRefetching();
    };
    refetching();
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      if (isFinishedAuto) {
        if (item?.callfile?.autoDial) {
          await setCallfileToAutoDial({
            variables: {
              callfileId: data?.getCallfiles?.result[0]?.callfile?._id,
              roundCount: 0,
              finished: true,
            },
          });
        }
      }
    });
  }, [isFinishedAuto]);

  const isLoading =
    downloadCallfilesLoading ||
    deleteLoading ||
    finishingLoading ||
    loading ||
    setCallfileTargetLoading ||
    autodialLoading;

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
            <div className=" w-full border border-gray-600 px-2 py-2 uppercase rounded-t-md truncate bg-gray-300 grid grid-cols-[repeat(14,_minmax(0,_1fr))] gap-2 font-black text-black text-xs">
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
              const finishedBy = res.callfile.finished_by ? (
                <div>{res.callfile.finished_by.name}</div>
              ) : (
                <div className="text-gray-500 italic" title="Incompletete">
                  {" "}
                  Incomplete{" "}
                </div>
              );
              return (
                <motion.div
                  key={index}
                  className=""
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-[0.7rem] border-x border-b border-gray-600 last:rounded-b-md last:shadow-md hover:bg-gray-300 transition-all items-center py-2 px-3 bg-gray-100 even:bg-gray-200 2xl:text-xs gap-2 text-gray-800 grid grid-cols-[repeat(14,_minmax(0,_1fr))] w-full ">
                    <div
                      className="overflow-hidden pr-2"
                      title={res.callfile.name}
                    >
                      {res.callfile.name}
                    </div>
                    <div>
                      {new Date(res.callfile.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      {res.callfile.endo ? (
                        new Date(res.callfile.endo).toLocaleDateString()
                      ) : (
                        <div className="italic text-gray-400 text-xs">
                          Ongoing
                        </div>
                      )}
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
                    <div className="truncate">{finishedBy}</div>
                    <div
                      className={`" ${
                        checkStatus
                          ? "grid grid-rows-2 grid-cols-2 gap-1"
                          : "grid grid-cols-2 gap-1 "
                      }  justify-center items-center  "`}
                    >
                      <div
                        className="rounded-sm shadow-sm flex justify-center hover:bg-purple-800 transition-all px-1 py-1 cursor-pointer bg-purple-700 text-white border-2 border-purple-900"
                        title="Add Selectives"
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
                      {checkStatus && (
                        <>
                          {selectedBucketData?.selectedBucket?.canCall && (
                            <div
                              className="rounded-sm relative h-full w-full items-center shadow-sm flex justify-center hover:bg-yellow-800 transition-all px-1 py-1 cursor-pointer bg-yellow-700 text-white border-2 border-yellow-900"
                              onClick={() => {
                                if (!res.callfile.autoDial) {
                                  setAutoDial({
                                    id: res.callfile._id,
                                    name: res.callfile.name,
                                  });
                                  setCount(1);
                                } else {
                                  onClickIcon(
                                    res.callfile._id,
                                    "AUTO",
                                    res.callfile.name
                                  );
                                }
                              }}
                            >
                              {!item?.callfile?.autoDial ? (
                                <div title="Turn on Auto Dial">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 "
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div title="Turn off Auto Dial">
                                  <div className="absolute text-yellow-900 z-10 top-[0px] left-[5px]">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="1.5"
                                      stroke="currentColor"
                                      className="size-7"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                                      />
                                    </svg>
                                  </div>

                                  <div className="z-20">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="size-4"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* */}

                          <div
                            className="rounded-sm flex shadow-sm justify-center hover:bg-green-800 px-1 py-1 cursor-pointer bg-green-700 text-white border-2 border-green-900"
                            title="Finish"
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
                            title="Set Target"
                            className="rounded-sm border-2 flex shadow-sm justify-center hover:bg-orange-800 px-1 py-1 cursor-pointer bg-orange-700 text-white  border-orange-900"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </>
                      )}
                      <div
                        onClick={() =>
                          onClickIcon(
                            res.callfile._id,
                            "DOWNLOAD",
                            res.callfile.name
                          )
                        }
                        title="Download"
                        className={`" ${
                          checkStatus ? "" : "  col-start-2 "
                        } rounded-sm flex shadow-sm justify-center hover:bg-blue-800 py-1 cursor-pointer bg-blue-700 text-white border-2 border-blue-900 "`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-5"
                        >
                          <path d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
                        </svg>
                      </div>

                      {selectedBucketData?.selectedBucket.canCall && (
                        <div
                          onClick={() =>
                            onClickIcon(
                              res.callfile._id,
                              "DIAL",
                              res.callfile.name
                            )
                          }
                          title="Next Round"
                          className={`" ${
                            checkStatus ? "" : "  col-start-2 "
                          } rounded-sm flex shadow-sm justify-center transition-all hover:bg-amber-700 py-1 cursor-pointer bg-amber-600 text-white border-2 border-amber-900 "`}
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
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </svg>
                        </div>
                      )}
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
              initial={{ scale: 0.8, opacity: 0 }}
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
                <div className="flex gap-2">
                  <button
                    className="w-30 bg-orange-500 font-black uppercase border-2 border-orange-800 py-2 rounded-sm text-white hover:bg-orange-600 transition-all cursor-pointer"
                    onClick={() =>
                      onClickIcon(callfileId._id, "SET", callfileId.name)
                    }
                  >
                    Submit
                  </button>
                  <button
                    className="w-30 bg-gray-500 py-2 rounded text-white transition-all font-black uppercase border-2 border-gray-800 cursor-pointer hover:bg-gray-600"
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
        {autoDial && (
          <div className="absolute w-full h-full top-0 right-0 z-50 flex items-center justify-center">
            <motion.div
              onClick={() => setAutoDial(null)}
              className="absolute cursor-pointer top-0 left-0 bg-black/40 backdrop-blur-sm w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            ></motion.div>
            <motion.div
              className=" border bg-white z-20 rounded-sm "
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="bg-yellow-900 px-10 py-2 text-white font-black uppercase text-2xl ">
                Number of round
              </div>

              <div className=" p-5 flex flex-col w-full gap-4">
                <input
                  type="number"
                  name="count"
                  min={1}
                  id="count"
                  className={`${
                    count < 1 ? "  bg-red-200 border-red-500" : ""
                  } border w-full px-3 py-1 rounded-sm shadow-md `}
                  value={count}
                  onChange={(e) => {
                    setCount(Number(e.target.value));
                  }}
                />

                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      if (count > 0) {
                        onClickIcon(autoDial.id, "AUTO", autoDial.name);
                      }
                    }}
                    className="px-3 font-black uppercase text-white cursor-pointer  border-2 border-yellow-950 hover:bg-yellow-950 transition-all py-2 bg-yellow-900 rounded-sm"
                  >
                    Submit
                  </button>
                  <button
                    className=" px-3 py-2 bg-gray-600 cursor-pointer hover:bg-gray-700 transition-all font-black uppercase text-white border-2 border-gray-900 rounded-sm "
                    onClick={() => setAutoDial(null)}
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

            <motion.div
              className="w-2/8 border-2 z-20 relative h-2/5 rounded-md flex flex-col overflow-hidden border-purple-800"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className="top-2 text-white right-2 absolute" title="Before uploading the selectives file, make sure the file name has no dot ">
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
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                  />
                </svg>
              </div>
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
                    className="w-30 bg-purple-500 hover:bg-purple-600 transition-all font-black uppercase border-2  py-2 rounded text-white border-purple-800 shadow-md cursor-pointer"
                    onClick={submitSetSelective}
                  >
                    Submit
                  </button>
                  <button
                    className="w-30 bg-gray-500 py-2 rounded text-white hover:bg-gray-600 font-black uppercase transition-all border-2 border-gray-800 shadow-md cursor-pointer"
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
