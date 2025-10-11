/* eslint-disable @typescript-eslint/no-explicit-any */
import { gql, useMutation, useQuery } from "@apollo/client";
import { Department } from "../../middleware/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { PiNotePencilBold, PiTrashFill } from "react-icons/pi";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

type Bucket = {
  name: string;
  dept: string;
  _id: string;
  viciIp: string;
  issabelIp: string;
};

const DEPARTMENT_QUERY = gql`
  query departmentQuery {
    getDepts {
      id
      name
      branch
      aom {
        _id
        name
      }
    }
  }
`;

const DEPARTMENT_BUCKET = gql`
  query findDeptBucket($dept: ID) {
    findDeptBucket(dept: $dept) {
      _id
      name
      dept
      issabelIp
      viciIp
    }
  }
`;

const CREATEBUCKET = gql`
  mutation createBucket(
    $name: String!
    $dept: String!
    $viciIp: String
    $issabelIp: String
  ) {
    createBucket(
      name: $name
      dept: $dept
      viciIp: $viciIp
      issabelIp: $issabelIp
    ) {
      success
      message
    }
  }
`;
const UPDATEBUCKET = gql`
  mutation updateBucket($input: UpdateBucket) {
    updateBucket(input: $input) {
      success
      message
    }
  }
`;

const DELETEBUCKET = gql`
  mutation deleteBucket($id: ID!) {
    deleteBucket(id: $id) {
      success
      message
    }
  }
`;

type BranchSectionProps = {
  buckets: boolean;
  setBuckets: React.Dispatch<React.SetStateAction<boolean>>;
};

const BucketSection: React.FC<BranchSectionProps> = ({
  buckets,
  setBuckets,
}) => {
  const dispatch = useAppDispatch();

  const { data: dept, refetch } = useQuery<{ getDepts: Department[] }>(
    DEPARTMENT_QUERY,
    { variables: { name: "admin" } }
  );

  const campaignOnly = dept?.getDepts.filter((d) => d.name !== "admin");
  const newDepts = useMemo(
    () => [...new Set(campaignOnly?.map((d) => d.id))],
    [campaignOnly]
  );

  const [deptSelected, setDeptSelected] = useState<string | null>(null);
  const deptObject: { [key: string]: string } = useMemo(() => {
    const deptArray = dept?.getDepts || [];
    return Object.fromEntries(deptArray.map((da) => [da.id, da.name]));
  }, [dept]);

  const [issabelIp, setIssabelIp] = useState<string>("");
  const [viciIp, setViciIp] = useState<string>("");
  const [confirm, setConfirm] = useState<boolean>(false);
  const [bucket, setBucket] = useState<string>("");

  useEffect(() => {
    if (newDepts.length > 0 && deptSelected === null) {
      setDeptSelected(newDepts[0]);
    }
  }, [newDepts, deptSelected]);

  const [required, setRequired] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [bucketToUpdate, setBucketToUpdate] = useState<Bucket>({
    _id: "",
    name: "",
    dept: "",
    viciIp: "",
    issabelIp: "",
  });

  const handleSelectDept = useCallback(
    (dept: string) => {
      setDeptSelected(dept);
      setBucket("");
      setRequired(false);
      setIsUpdate(false);
    },
    [setIsUpdate, setRequired, setBucket, setDeptSelected]
  );

  const { data: bucketData, refetch: bucketRefetch } = useQuery<{
    findDeptBucket: Bucket[];
  }>(DEPARTMENT_BUCKET, {
    variables: { dept: deptSelected },
    skip: !deptSelected,
  });

  useEffect(() => {
    const timer = async () => {
      await refetch();
      await bucketRefetch();
    };
    timer();
  }, [dept, refetch, bucketRefetch]);

  // mutations ==============================================

  const [createBucket] = useMutation(CREATEBUCKET, {
    onCompleted: async (res) => {
      refetch();
      bucketRefetch();
      dispatch(
        setSuccess({
          success: res.createBucket.success,
          message: res.createBucket.message,
          isMessage: false,
        })
      );
      setBucket("");
      setViciIp("");
      setIssabelIp("");
    },
    onError: (error) => {
      const errorMessage = error?.message;
      if (errorMessage?.includes("Duplicate")) {
        setSuccess({
          success: true,
          message: "Bucket already exists",
          isMessage: false,
        });
        setBucket("");
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [updateBucket] = useMutation(UPDATEBUCKET, {
    onCompleted: (res) => {
      refetch();
      bucketRefetch();
      dispatch(
        setSuccess({
          success: res.updateBucket.success,
          message: res.updateBucket.message,
          isMessage: false,
        })
      );
      setBucket("");
      setIsUpdate(false);
      setBucketToUpdate({
        _id: "",
        name: "",
        dept: "",
        viciIp: "",
        issabelIp: "",
      });
      setViciIp("");
      setIssabelIp("");
    },
    onError: (error) => {
      const errorMessage = error?.message;
      if (errorMessage?.includes("Duplicate")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Bucket already exists",
            isMessage: false,
          })
        );
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [deleteBucket] = useMutation(DELETEBUCKET, {
    onCompleted: (res) => {
      refetch();
      bucketRefetch();
      dispatch(
        setSuccess({
          success: res.deleteBucket.success,
          message: res.deleteBucket.message,
          isMessage: false,
        })
      );
      setBucketToUpdate({
        _id: "",
        name: "",
        dept: "",
        viciIp: "",
        issabelIp: "",
      });
      setBucket("");
      setIsUpdate(false);
      setRequired(false);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  // ===============================================================

  type BucketOperation = "CREATE" | "UPDATE" | "DELETE";

  const creatingBucket = useCallback(async () => {
    await createBucket({
      variables: {
        name: bucket,
        dept: deptObject[deptSelected || ""],
        viciIp,
        issabelIp,
      },
    });
  }, [createBucket, bucket, deptObject, deptSelected, viciIp, issabelIp]);

  const updatingBucket = useCallback(
    async (b: Bucket | null) => {
      if (b) {
        const input = {
          name: bucket,
          id: b._id,
          viciIp,
          issabelIp,
        };
        await updateBucket({ variables: { input } });
      }
    },
    [bucket, viciIp, issabelIp, updateBucket]
  );

  const deletingBucket = useCallback(
    async (b: Bucket | null) => {
      if (b) await deleteBucket({ variables: { id: b._id } });
    },
    [deleteBucket]
  );

  const confirmationFunction: Record<
    BucketOperation,
    (b: Bucket | null) => Promise<void>
  > = {
    CREATE: creatingBucket,
    UPDATE: updatingBucket,
    DELETE: deletingBucket,
  };

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE",
    yes: () => {},
    no: () => {},
  });

  const [requiredIps, setRequiredIps] = useState<boolean>(false);

  const handleSubmit = useCallback(
    (action: "CREATE" | "UPDATE" | "DELETE", buck: Bucket | null) => {
      if (action !== "DELETE") {
        if (!viciIp && !issabelIp) {
          setRequiredIps(true);
          return;
        } else {
          setRequiredIps(false);
        }
        if (!bucket) {
          setRequired(true);
          return;
        } else {
          setRequired(false);
        }
      }

      setConfirm(true);

      const actionExnts = {
        CREATE: {
          message: "Are you sure you want to add this bucket?",
          params: buck,
        },
        UPDATE: {
          message: "Are you sure you want to update this bucket?",
          params: buck,
        },
        DELETE: {
          message: "Are you sure you want to delete this bucket?",
          params: buck,
        },
      };

      setModalProps({
        no: () => setConfirm(false),
        yes: () => {
          confirmationFunction[action]?.(actionExnts[action]?.params);
          setConfirm(false);
        },
        message: actionExnts[action]?.message,
        toggle: action,
      });
    },
    [
      setModalProps,
      confirmationFunction,
      setConfirm,
      setRequiredIps,
      issabelIp,
      viciIp,
      setRequired,
    ]
  );

  const handleUpdate = useCallback(
    (b: Bucket) => {
      setRequired(false);
      setIsUpdate(true);
      setBucket(b.name);
      setBucketToUpdate(b);
      setIssabelIp(b.issabelIp);
      setViciIp(b.viciIp);
    },
    [
      setRequired,
      setIsUpdate,
      setBucket,
      setBucketToUpdate,
      setIssabelIp,
      setViciIp,
    ]
  );

  return (
    <div className="">
      <div className="px-4 z-20">
        <div className="my-5 items-center justify-center w-full">
          <div className=" px-4  bg-white  dark:bg-gray-900">
            <motion.h1
              className="font-black uppercase text-center text-2xl text-gray-300 "
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Bucket
            </motion.h1>
          </div>
        </div>
        <div className="flex gap-2  justify-center">
          <div className=" h-[60vh] w-full flex flex-col gap-2 pr-1 overflow-y-auto">
            {newDepts.map((nd, index) => {
              const findBucket = dept?.getDepts.find((x) => x.id === nd);
              return (
                deptObject[nd] !== "ADMIN" && (
                  <motion.div
                    key={index}
                    className={`${
                      nd === deptSelected && "bg-slate-200"
                    } text-sm flex flex-col uppercase font-black w-full text-slate-800 shadow-sm rounded-md even:bg-gray-200 bg-gray-300 p-2 border-b border-slate-300 last:border-b-0 hover:bg-gray-400 cursor-pointer`}
                    onClick={() => handleSelectDept(nd)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <p className="text-xs truncate py-1">
                      {deptObject[nd]?.replace(/_/g, " ")}-{" "}
                      <span>{findBucket?.branch}</span>
                    </p>
                  </motion.div>
                )
              );
            })}
          </div>
          <div className="rounded-xl gap-2 h-[60vh] flex flex-col px-1 overflow-x-hidden w-full overflow-y-auto">
            {(bucketData?.findDeptBucket ?? []).length > 0 ? (
              <div className="gap-2 flex flex-col">
                {bucketData?.findDeptBucket.map((b, index) => (
                  <motion.div
                    key={b._id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-200 even:bg-gray-100 rounded-md shadow-sm"
                  >
                    <div className="text-xs overflow-hidden items-center font-black hover:shadow-md transition-all uppercase text-slate-800 px-5 py-2 hover:bg-gray-200 rounded-md cursor-pointer">
                      <div className="grid py-1 grid-rows-3 gap-1">
                        <div className="flex gap-2 truncate ">
                          <div className="">Name: </div>
                          <div className="uppercase truncate" title={b.name}>
                            {b.name}
                          </div>
                        </div>

                        <div className="flex gap-2 ">
                          <div>Vici:</div>
                          <div title={b.viciIp}>
                            {b.viciIp || (
                              <div className="text-gray-400 lowercase italic font-normal first-letter:uppercase">
                                No vici ip.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ">
                          <div>Issabel: </div>
                          <div title={b.issabelIp}>
                            {b.issabelIp || (
                              <div className="text-gray-400 lowercase italic font-normal first-letter:uppercase">
                                No issabel.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2 items-center justify-end">
                        <div className="flex gap-2">
                          <div
                            onClick={() => {
                              handleUpdate(b);
                              setBuckets(true);
                            }}
                            title="UPDATE"
                            className="bg-blue-600 shadow-md cursor-pointer hover:bg-blue-700 transition-all p-1 text-white rounded-sm border border-blue-800 "
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

                          <div
                            className="bg-red-600 cursor-pointer hover:bg-red-700 transition-all p-1 text-white rounded-sm border border-red-800 shadow-md "
                            title="REMOVE"
                            onClick={() => handleSubmit("DELETE", b)}
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
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </div>
                        </div>
                        {/* <PiTrashFill className="text-red-400 hover:text-red-600 cursor-pointer" /> */}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="italic text-center text-gray-400 py-2">
                No bucket selected.
              </div>
            )}
          </div>
          <AnimatePresence>
            {buckets && (
              <div className=" z-50 absolute  top-0 left-0 justify-center items-center flex gap-5 w-full h-full flex-col">
                <motion.div
                  onClick={() => {
                    setBuckets(false);
                    setIsUpdate(false);
                    setIssabelIp("");
                    setViciIp("");
                    setBucket("");
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-black/40 backdrop-blur-sm z-10 cursor-pointer w-full h-full absolute top-0 left-0"
                ></motion.div>
                <motion.div
                  className="z-20 flex flex-col border-2 border-green-900 rounded-md "
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <h1 className="bg-green-700 px-20 font-black text-2xl uppercase text-center rounded-t-sm text-white py-2">
                    {isUpdate ? "update bucket" : "create bucket"}
                  </h1>
                  <div className="flex flex-col gap-2 bg-gray-100 rounded-b-sm py-10 px-10">
                    <input
                      type="text"
                      name="name_bucket"
                      id="name_bucket"
                      value={bucket}
                      autoComplete="off"
                      placeholder="Enter bucket name"
                      onChange={(e) => setBucket(e.target.value)}
                      className={`${
                        required && !bucket
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-300"
                      }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5`}
                    />
                    <input
                      type="text"
                      name="issabelIp"
                      id="issabelIp"
                      value={issabelIp}
                      autoComplete="off"
                      placeholder="Enter Issabel Ip"
                      onChange={(e) => setIssabelIp(e.target.value)}
                      className={`${
                        requiredIps && !issabelIp
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-300"
                      }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5`}
                    />
                    <input
                      type="text"
                      name="viciIp"
                      id="viciIp"
                      value={viciIp}
                      autoComplete="off"
                      placeholder="Enter Vici Ip"
                      onChange={(e) => setViciIp(e.target.value)}
                      className={`${
                        requiredIps && !viciIp
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-300"
                      }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5`}
                    />
                    {newDepts.length > 0 && (
                      <div className="flex justify-end w-full=">
                        {!isUpdate ? (
                          <button
                            type="button"
                            className={`bg-blue-600 hover:bg-blue-700 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                            onClick={() => handleSubmit("CREATE", null)}
                          >
                            Create
                          </button>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className={`bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                              onClick={() => {
                                handleSubmit("UPDATE", bucketToUpdate);
                              }}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className={`bg-slate-500 hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-medium rounded-lg text-sm px-5 py-2.5 mb-2  cursor-pointer`}
                              onClick={() => {
                                setBucketToUpdate({
                                  _id: "",
                                  name: "",
                                  dept: "",
                                  viciIp: "",
                                  issabelIp: "",
                                });
                                setIssabelIp("");
                                setViciIp("");
                                setBucket("");
                                setRequired(false);
                                setIsUpdate(false);
                                setBuckets(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </div>
  );
};

export default BucketSection;
