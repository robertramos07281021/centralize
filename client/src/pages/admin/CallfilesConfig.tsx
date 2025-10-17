import { useCallback, useEffect, useState } from "react";
import Pagination from "../../components/Pagination.tsx";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";
import {
  setCallfilesPages,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice.ts";
import gql from "graphql-tag";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Confirmation from "../../components/Confirmation.tsx";
import Loading from "../Loading.tsx";

const Callifles = gql`
  query getCF($bucket: ID, $limit: Int!, $page: Int!) {
    getCF(bucket: $bucket, limit: $limit, page: $page) {
      result {
        _id
        name
        totalPrincipal
        totalAccounts
        totalOB
        bucket
        createdAt
        active
        endo
        finished_by {
          _id
          name
        }
        target
      }
      total
    }
  }
`;

type User = {
  _id: string;
  name: string;
};

type Callfile = {
  _id: string;
  name: string;
  totalPrincipal: number;
  totalAccounts: number;
  totalOB: number;
  bucket: string;
  createdAt: string;
  active: boolean;
  endo: string;
  finished_by: User;
  target: number;
};

type Results = {
  result: Callfile[];
  total: number;
};

const ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
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

type Success = {
  success: boolean;
  message: string;
};


const GET_CSV_FILES = gql`
  query downloadCallfiles($callfile: ID!) {
    downloadCallfiles(callfile: $callfile)
  }
`;

const CallfilesConfig = () => {
  const [page, setPage] = useState<string>("1");
  const [totalPage, setTotalPage] = useState<number>(1);
  const dispatch = useDispatch();
  const location = useLocation();

  const [downloadCallfiles, { loading: downloadCallfilesLoading }] =
    useLazyQuery(GET_CSV_FILES);

  const isCallfileConfig = location.pathname.includes(
    "callfile-configurations"
  );
  const { callfilesPages, limit } = useSelector(
    (state: RootState) => state.auth
  );

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value.trim() === "" ? null : event.target.value;
    setSelectedOption(value);
  };

  const { data, refetch } = useQuery<{ getCF: Results }>(Callifles, {
    variables: {
      bucket: selectedOption,
      page: callfilesPages,
      limit: limit,
    },
    skip: !selectedOption || !isCallfileConfig,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    setPage(callfilesPages.toString());
  }, [callfilesPages]);

  useEffect(() => {
    if (data) {
      const searchExistingPages = Math.ceil((data?.getCF?.total || 1) / limit);
      setTotalPage(searchExistingPages);
    }
  }, [data]);

  const { data: bucketsData, refetch: bucketRefetch } = useQuery<{
    getAllBucket: Bucket[];
  }>(ALL_BUCKET, {
    skip: !isCallfileConfig,
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await bucketRefetch();
    };
    refetching();
  }, [selectedOption]);

  const [confirm, setConfirm] = useState<boolean>(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "FINISHED" as "FINISHED" | "DELETE" | "DOWNLOAD",
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
          if (res.data?.getCF?.result?.length <= 0) {
            dispatch(setCallfilesPages(callfilesPages - 1));
          }
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
        if (res?.data) {
          if (res?.data?.getCF?.result?.length <= 0) {
            dispatch(setCallfilesPages(callfilesPages - 1));
          }

          const searchExistingPages = Math.ceil(
            (res?.data?.getCF?.total || 1) / limit
          );
          setTotalPage(searchExistingPages);

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

  const onClickIcon = useCallback(
    (id: string, action: "FINISHED" | "DELETE" | "DOWNLOAD", name: string) => {
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
            const blob = new Blob([data.downloadCallfiles], {
              type: "text/csv",
            });
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
      };

      setModalProps({
        message: modalTxt[action],
        toggle: action,
        yes: fn[action],
        no: () => {
          setConfirm(false);
        },
      });
    },
    [
      setModalProps,
      setConfirm,
      downloadCallfiles,
      deleteCallfile,
      finishedCallfile,
      dispatch,
      setSuccess,
      setServerError,
    ]
  );

  if (finishingLoading || deleteLoading || downloadCallfilesLoading)
    return <Loading />;

  return (
    <>
      {confirm && <Confirmation {...modalProps} />}
      <div className=" h-full w-full flex flex-col overflow-hidden">
        <div className="px-5 flex h-full flex-col w-full overflow-hidden">
          <div className="w-full mt-4 justify-between my-2 items-center flex">
            <div className="font-black uppercase text-2xl text-gray-500">
              CallFile Configuration
            </div>
            <div className="flex gap-3">
              <motion.div
                className="border-blue-800 py-2 font-black shadow-md text-white cursor-pointer rounded-md border px-3 bg-blue-500 hover:bg-blue-600 "
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <select
                  id="dropdown"
                  value={selectedOption || "SELECT A BUCKET"}
                  onChange={handleChange}
                  className=" focus:outline-none  cursor-pointer rounded-md items-center flex h-full"
                >
                  <option className="uppercase" value="">
                    SELECT A BUCKET
                  </option>
                  {bucketsData?.getAllBucket &&
                  bucketsData.getAllBucket.length > 0 ? (
                    bucketsData.getAllBucket.map((bucket) => (
                      <option
                        className="text-black"
                        key={bucket._id}
                        value={bucket._id}
                      >
                        {bucket.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No buckets available</option>
                  )}
                </select>
              </motion.div>
            </div>
          </div>
          <div className="flex bg-gray-200 rounded-t-md">
            <div className="grid w-full grid-cols-11 gap-3  px-3  py-2 font-black uppercase">
              <div>Name</div>
              <div>Created At</div>
              <div>Endo</div>
              <div>Work Days</div>
              <div className="truncate" title="Finished by"  >Finished By</div>
              <div className="whitespace-nowrap truncate" title="Total Accounts" >Total Accounts</div>
              <div>Total OB</div>
              <div className="whitespace-nowrap truncate" title="Total Principal">Total Principal</div>
              <div>Activity</div>
              <div className="col-span-2"></div>
            </div>
          </div>

          <div className="overflow-auto flex rounded-b-md flex-col h-full">
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {data?.getCF && data?.getCF.result.length > 0 ? (
                data.getCF.result.map((res, index) => {
                  const totalDate = Math.floor(
                    (new Date(res.endo).getTime() -
                      new Date(res.createdAt).getTime()) /
                      (1000 * 3600 * 24)
                  );

                  return (
                    <motion.div
                      key={res._id}
                      className="flex flex-row w-full bg-gray-100 px-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="grid gap-3 py-2 w-full items-center grid-cols-11">
                        <div
                          className="whitespace-nowrap truncate"
                          title={res.name}
                        >
                          {res.name}
                        </div>
                        <div>
                          {new Date(res.createdAt).toLocaleDateString("en-US")}
                        </div>
                        <div>
                          {res.endo
                            ? new Date(res.endo).toLocaleDateString("en-US")
                            : "-"}
                        </div>
                        <div>
                          {res.endo ? (
                            totalDate === 0 ? (
                              1
                            ) : (
                              totalDate
                            )
                          ) : (
                            <span>0</span>
                          )}
                        </div>
                        <div className="capitalize">
                          {res.finished_by?.name || "-"}
                        </div>
                        <div className="truncate">{res.totalAccounts || 0}</div>
                        <div className="truncate">
                          {res.totalOB?.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }) ||
                            (0).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                        </div>
                        <div className="truncate">
                          {res.totalPrincipal?.toLocaleString("en-PH", {
                            style: "currency",
                            currency: "PHP",
                          }) ||
                            (0).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })}
                        </div>
                        <div className="">
                          {res.active ? (
                            <div className="flex">
                              <div className="bg-green-400 px-3 py-1 rounded-full border-green-600 font-black text-sm uppercase text-green-700 border-2">
                                Active
                              </div>{" "}
                            </div>
                          ) : (
                            <div className="flex">
                              <div className="bg-red-400 px-3 py-1 rounded-full border-red-600 font-black text-sm uppercase text-red-700 border-2">
                                inActive
                              </div>{" "}
                            </div>
                          )}
                        </div>
                        <div className="gap-3 col-span-2 flex justify-end">

                          {res.active && (
                            <div className="items-center  col-start-1 flex ">
                              <div
                                onClick={() =>
                                  onClickIcon(res._id, "FINISHED", res.name)
                                }
                                className="bg-green-700 border-2 border-green-900 hover:bg-green-800 transition-all py-1 px-2 cursor-pointer rounded-sm shadow-sm"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="3"
                                  stroke="currentColor"
                                  className="size-5 text-white  "
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m4.5 12.75 6 6 9-13.5"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                          <div className="items-center  col-start-2 flex">
                            <div
                              onClick={() =>
                                onClickIcon(res._id, "DOWNLOAD", res.name)
                              }
                              className="bg-blue-700 border-2 border-blue-900 hover:bg-blue-800 transition-all py-1 px-2 cursor-pointer rounded-sm shadow-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="size-5 text-white"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                                />
                              </svg>
                            </div>
                          </div>

                          <div className="items-center flex ">
                            <div
                              onClick={() => {
                                onClickIcon(res._id, "DELETE", res.name);
                              }}
                              className="bg-red-700 border-2 border-red-900  hover:bg-red-800 transition-all py-1 px-2 cursor-pointer  rounded-sm shadow-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="size-5 text-white  "
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <option
                  className="flex justify-center px-3 py-2 bg-gray-100"
                  disabled
                >
                  No buckets available
                </option>
              )}
            </motion.div>
          </div>
        </div>
        <div className="py-1 px-2 ">
          <Pagination
            value={page}
            onChangeValue={(e) => setPage(e)}
            onKeyDownValue={(e) => dispatch(setCallfilesPages(e))}
            totalPage={totalPage}
            currentPage={callfilesPages}
          />
        </div>
      </div>
    </>
  );
};

export default CallfilesConfig;
