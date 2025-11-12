import { gql, useMutation, useQuery } from "@apollo/client";
import { Department } from "../../middleware/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

type Bucket = {
  name: string | null;
  dept: string | null;
  _id: string | null;
  viciIp: string | null;
  issabelIp: string | null;
  canCall: boolean;
  can_update_ca: boolean;
  principal: boolean;
};

const DEPARTMENT_QUERY = gql`
  query departmentQuery {
    getDepts {
      id
      name
      branch
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
      canCall
      can_update_ca
      principal
    }
  }
`;

const CREATEBUCKET = gql`
  mutation createBucket($input: CreateBucket) {
    createBucket(input: $input) {
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

  const [confirm, setConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (newDepts.length > 0 && deptSelected === null) {
      setDeptSelected(newDepts[1]);
    }
  }, [newDepts, deptSelected]);

  const [required, setRequired] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [bucketToUpdate, setBucketToUpdate] = useState<Bucket>({
    _id: null,
    name: null,
    dept: null,
    viciIp: null,
    issabelIp: null,
    can_update_ca: false,
    principal: false,
    canCall: false,
  });

  const handleResetToUpdate = useCallback(() => {
    setBucketToUpdate({
      _id: null,
      name: null,
      dept: null,
      viciIp: null,
      issabelIp: null,
      can_update_ca: false,
      principal: false,
      canCall: false,
    });
  }, [setBucketToUpdate]);

  const handleSelectDept = useCallback(
    (dept: string) => {
      setDeptSelected(dept);
      handleResetToUpdate();
      setRequired(false);
      setIsUpdate(false);
    },
    [setIsUpdate, setRequired, handleResetToUpdate, setDeptSelected]
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
      setBuckets(false);
      handleResetToUpdate();
      dispatch(
        setSuccess({
          success: res.createBucket.success,
          message: res.createBucket.message,
          isMessage: false,
        })
      );
    },
    onError: (error) => {
      const errorMessage = error?.message;
      if (errorMessage?.includes("Duplicate")) {
        setSuccess({
          success: true,
          message: "Bucket already exists",
          isMessage: false,
        });
        handleResetToUpdate();
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
      setBuckets(false);
      setIsUpdate(false);
      handleResetToUpdate();
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
      handleResetToUpdate();
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
    const { _id, dept, ...others } = bucketToUpdate;
    await createBucket({
      variables: {
        input: {
          ...others,
          dept: deptObject[deptSelected as keyof typeof deptObject],
        },
      },
    });
  }, [createBucket, deptObject, deptSelected, bucketToUpdate]);

  console.log(bucketToUpdate);
  const updatingBucket = useCallback(
    async (b: Bucket | null) => {
      if (b) {
        const { dept, __typename, ...others } = b as any;

        await updateBucket({ variables: { input: others } });
      }
    },
    [updateBucket]
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
        if (!bucketToUpdate.name) {
          setRequired(true);
          return;
        } else {
          setRequired(false);
        }
        if (!bucketToUpdate.viciIp && !bucketToUpdate.issabelIp) {
          setRequiredIps(true);
          return;
        } else {
          setRequiredIps(false);
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
      setRequired,
    ]
  );

  const handleUpdate = useCallback(
    (b: Bucket) => {
      setRequired(false);
      setIsUpdate(true);
      setBucketToUpdate(b);
    },
    [setRequired, setIsUpdate, setBucketToUpdate]
  );
  return (
    <div className="flex overflow-hidden">
      <div className="px-4 w-full flex flex-col overflow-hidden h-full">
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
        <div className="flex gap-2 justify-center overflow-hidden ">
          <div className=" h-full w-full flex flex-col gap-2 pr-1 overflow-y-auto">
            {newDepts.map((nd, index) => {
              const findBucket = dept?.getDepts.find((x) => x.id === nd);
              return (
                deptObject[nd] !== "ADMIN" && (
                  <motion.div
                    key={index}
                    className={`${
                      nd.toString() === deptSelected?.toString()
                        ? "bg-gray-400"
                        : "even:bg-gray-200 bg-gray-100"
                    } text-sm flex flex-col border uppercase font-black w-full text-slate-800 shadow-sm rounded-md even: p-2 border-black hover:bg-gray-400 cursor-pointer`}
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
          <div className="rounded-xl gap-2 h-full flex flex-col px-1 overflow-x-hidden w-full overflow-y-auto">
            {(bucketData?.findDeptBucket ?? []).length > 0 ? (
              <div className="gap-2 flex flex-col">
                {bucketData?.findDeptBucket.map((b, index) => {
                  console.log(b);
                  return (
                    <motion.div
                      key={b._id}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-200 border even:bg-gray-100 rounded-md shadow-sm"
                      onClick={() => {}}
                    >
                      <div className="text-xs overflow-hidden items-center font-black hover:shadow-md transition-all uppercase text-slate-800 px-5 py-2 hover:bg-gray-200 rounded-md cursor-pointer">
                        <div className="grid  py-1 grid-rows-3 gap-1">
                          <div className="flex gap-2 truncate ">
                            <div className="">Name: </div>
                            <div
                              className="uppercase truncate"
                              title={b.name || ""}
                            >
                              {b.name || ""}
                            </div>
                          </div>

                          <div className="flex gap-2 ">
                            <div>Vici:</div>
                            <div title={b.viciIp || ""}>
                              {b.viciIp || (
                                <div className="text-gray-400  italic font-normal capitalize">
                                  No vici IP.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ">
                            <div>Issabel: </div>
                            <div title={b.issabelIp || ""}>
                              {b.issabelIp || (
                                <div className="text-gray-400 italic font-normal capitalize">
                                  No issabel IP.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div>Principal: </div>
                            <div className="italic font-bold text-gray-400">
                              {b.principal ? "True" : "False"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div>Can Update: </div>
                            <div className="italic font-bold text-gray-400">
                              {b.can_update_ca ? "True" : "False"}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div>Can Call: </div>
                            <div className="italic font-bold text-gray-400">
                              {b.canCall ? "True" : "False"}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 mt-2 items-center justify-end">
                          <div className="flex gap-1">
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
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className={`" ${
                                  index === index ? "hover:rotate-90" : ""
                                } transition-all size-5.5  "`}
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                                  clipRule="evenodd"
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
                })}
              </div>
            ) : (
              <div className="italic text-center text-gray-400 py-2">
                No bucket selected.
              </div>
            )}
          </div>
          <AnimatePresence>
            {buckets && deptSelected && (
              <div className=" z-50 absolute  top-0 left-0 justify-center items-center flex gap-5 w-full h-full flex-col">
                <motion.div
                  onClick={() => {
                    setBuckets(false);
                    setIsUpdate(false);
                    handleResetToUpdate();
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-black/40 backdrop-blur-sm z-10 cursor-pointer w-full h-full absolute top-0 left-0"
                ></motion.div>
                <motion.div
                  className={`z-20 flex flex-col ${
                    isUpdate ? "border-orange-600" : "border-green-900"
                  } rounded-md border-2  `}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <h1
                    className={`${
                      isUpdate
                        ? "bg-orange-500 border-orange-800"
                        : "bg-green-700"
                    }  px-20 font-black text-2xl uppercase text-center rounded-t-sm text-white py-2 `}
                  >
                    {isUpdate ? "update bucket" : "create bucket"}
                  </h1>
                  <div className="flex font-black  uppercase flex-col gap-2 bg-gray-100 rounded-b-sm py-10 px-10">
                    <label className="w-full">
                      <p>Name:</p>
                      <input
                        type="text"
                        name="name_bucket"
                        id="name_bucket"
                        value={bucketToUpdate.name || ""}
                        autoComplete="off"
                        placeholder="Enter bucket name"
                        onChange={(e) => {
                          const value =
                            e.target.value.trim() === ""
                              ? null
                              : e.target.value;
                          setBucketToUpdate((prev) => ({
                            ...prev,
                            name: value,
                          }));
                        }}
                        className={`${
                          required && !bucketToUpdate.name
                            ? "bg-red-50 border-red-300"
                            : "bg-gray-50 border-gray-300"
                        }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full`}
                      />
                    </label>
                    <label className="w-full">
                      <p>Issabel IP:</p>
                      <input
                        type="text"
                        name="issabelIp"
                        id="issabelIp"
                        value={bucketToUpdate.issabelIp || ""}
                        autoComplete="off"
                        placeholder="Enter Issabel Ip"
                        onChange={(e) => {
                          const value =
                            e.target.value.trim() === ""
                              ? null
                              : e.target.value;
                          setBucketToUpdate((prev) => ({
                            ...prev,
                            issabelIp: value,
                          }));
                        }}
                        className={`${
                          requiredIps && !bucketToUpdate.issabelIp
                            ? "bg-red-50 border-red-300"
                            : "bg-gray-50 border-gray-300"
                        }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 w-full`}
                      />
                    </label>
                    <label className="w-full">
                      <p>Vici IP:</p>
                      <input
                        type="text"
                        name="viciIp"
                        id="viciIp"
                        value={bucketToUpdate.viciIp || ""}
                        autoComplete="off"
                        placeholder="Enter Vici Ip"
                        onChange={(e) => {
                          const value =
                            e.target.value.trim() === ""
                              ? null
                              : e.target.value;
                          setBucketToUpdate((prev) => ({
                            ...prev,
                            viciIp: value,
                          }));
                        }}
                        className={`${
                          requiredIps && !bucketToUpdate.viciIp
                            ? "bg-red-50 border-red-300"
                            : "bg-gray-50 border-gray-300"
                        }  border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 w-full`}
                      />
                    </label>

                    <div className="flex gap-2 text-xs">
                      <label
                        className={`"  ${
                          bucketToUpdate.principal
                            ? "bg-gray-400"
                            : "bg-gray-300 hover:bg-gray-400"
                        } flex gap-2   border border-gray-600 rounded-md shadow-md cursor-pointer py-2 px-3 transition-all "`}
                      >
                        <input
                          checked={bucketToUpdate.principal}
                          type="checkbox"
                          name="principal"
                          id="principal"
                          onChange={(e) => {
                            const value = e.target.checked;
                            setBucketToUpdate((prev) => ({
                              ...prev,
                              principal: value,
                            }));
                          }}
                        />
                        <p>Principal</p>
                      </label>
                      <label
                        className={`" ${
                          bucketToUpdate.can_update_ca
                            ? "bg-gray-400"
                            : "bg-gray-300 hover:bg-gray-400"
                        } flex gap-2   border border-gray-600 rounded-md shadow-md cursor-pointer py-2 px-3 transition-all "`}
                      >
                        <input
                          type="checkbox"
                          name="can_update"
                          id="can_update"
                          checked={bucketToUpdate.can_update_ca}
                          onChange={(e) => {
                            const value = e.target.checked;
                            setBucketToUpdate((prev) => ({
                              ...prev,
                              can_update_ca: value,
                            }));
                          }}
                        />
                        <p>Can Update</p>
                      </label>
                      <label
                        className={`" ${
                          bucketToUpdate.canCall
                            ? "bg-gray-400"
                            : "bg-gray-300 hover:bg-gray-400"
                        } flex gap-2   border border-gray-600 rounded-md shadow-md cursor-pointer py-2 px-3 transition-all   "`}
                      >
                        <input
                          type="checkbox"
                          name="can_call"
                          id="can_call"
                          checked={bucketToUpdate.canCall}
                          onChange={(e) => {
                            const value = e.target.checked;
                            setBucketToUpdate((prev) => ({
                              ...prev,
                              canCall: value,
                            }));
                          }}
                        />
                        <p>Can Call</p>
                      </label>
                    </div>

                    {newDepts.length > 0 && (
                      <div className="flex justify-end w-full=">
                        {!isUpdate ? (
                          <button
                            type="button"
                            className={`bg-green-600 hover:bg-green-700 transition-all uppercase font-black border-2 border-green-800 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                            onClick={() => handleSubmit("CREATE", null)}
                          >
                            Create
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className={`bg-slate-500 transition-all font-black uppercase hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400  border-2 border-gray-800 rounded-lg text-sm px-5 py-2.5 mb-2  cursor-pointer`}
                              onClick={() => {
                                handleResetToUpdate();
                                setRequired(false);
                                setIsUpdate(false);
                                setBuckets(false);
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={`bg-orange-500 border-2 border-orange-800 font-black hover:bg-orange-600 transition-all focus:outline-none text-white focus:ring-4 focus:ring-orange-400 uppercase rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                              onClick={() => {
                                handleSubmit("UPDATE", bucketToUpdate);
                              }}
                            >
                              Update
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
