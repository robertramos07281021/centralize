import { gql, useMutation, useQuery } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { PiNotePencilBold, PiTrashFill } from "react-icons/pi";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useAppDispatch } from "../../redux/store";
import { motion, AnimatePresence } from "framer-motion";

type UserInfo = {
  _id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  branch: string;
  aom: UserInfo;
};

const CREATEDEPT = gql`
  mutation createDept($name: String!, $branch: String!, $aom: String!) {
    createDept(branch: $branch, name: $name, aom: $aom) {
      success
      message
    }
  }
`;
const UPDATEDEPT = gql`
  mutation updateDept(
    $name: String!
    $branch: String!
    $aom: String!
    $id: ID!
  ) {
    updateDept(branch: $branch, name: $name, aom: $aom, id: $id) {
      success
      message
    }
  }
`;
const DELETEDEPT = gql`
  mutation deleteDept($id: ID!) {
    deleteDept(id: $id) {
      success
      message
    }
  }
`;
type Branch = {
  id: string;
  name: string;
};

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  }
`;

const AOM_USER = gql`
  query getAomUser {
    getAomUser {
      _id
      name
      username
      type
      departments
      branch
      change_password
    }
  }
`;

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

type BranchSectionProps = {
  campaign: boolean;
  setCampaign: React.Dispatch<React.SetStateAction<boolean>>;
};

const DepartmentSection: React.FC<BranchSectionProps> = ({
  campaign,
  setCampaign,
}) => {
  const { data, refetch } = useQuery<{ getBranches: Branch[] }>(BRANCH_QUERY);
  const dispatch = useAppDispatch();
  const { data: dept, refetch: refetchDept } = useQuery<{
    getDepts: Department[];
  }>(DEPARTMENT_QUERY);
  const [name, setName] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [aom, setAom] = useState<string>("");
  const [confirm, setConfirm] = useState<boolean>(false);
  const [required, setRequired] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [deptToModify, setDeptToModify] = useState<Department>({
    id: "",
    name: "",
    branch: "",
    aom: {
      _id: "",
      name: "",
    },
  });

  const { data: aomUsers, refetch: aomRefetch } = useQuery<{
    getAomUser: UserInfo[];
  }>(AOM_USER);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await aomRefetch();
        await refetch();
        await refetchDept();
      } catch (error) {
        dispatch(setServerError(true));
      }
    });
    return () => clearTimeout(timer);
  }, [aomRefetch, refetch, refetchDept]);

  // mutations ======================================================
  const [createDept] = useMutation(CREATEDEPT, {
    onCompleted: async () => {
      try {
        const res = await refetch();
        const resDept = await refetchDept();
        if (res.data || resDept.data) {
          dispatch(
            setSuccess({
              success: true,
              message: "Department successfully created",
              isMessage: false,
            })
          );
        }
      } catch (error) {
        dispatch(setServerError(true));
      }
      setName("");
      setBranch("");
      setAom("");
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("Duplicate")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Department already exists",
            isMessage: false,
          })
        );
        setName("");
        setBranch("");
        setAom("");
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [updateDept] = useMutation(UPDATEDEPT, {
    onCompleted: () => {
      refetch();
      setConfirm(false);
      refetchDept();
      dispatch(
        setSuccess({
          success: true,
          message: "Department successfully updated",
          isMessage: false,
        })
      );
      setName("");
      setBranch("");
      setAom("");
      setIsUpdate(false);
      setDeptToModify({
        id: "",
        name: "",
        branch: "",
        aom: {
          _id: "",
          name: "",
        },
      });
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("Duplicate")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Department already exists",
            isMessage: false,
          })
        );
        setConfirm(false);
        setName("");
        setBranch("");
        setAom("");
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [deleteDept] = useMutation(DELETEDEPT, {
    onCompleted: async () => {
      try {
        await refetch();
        await refetchDept();
      } catch (error) {
        dispatch(setServerError(true));
      }
      dispatch(
        setSuccess({
          success: true,
          message: "Department successfully deleted",
          isMessage: false,
        })
      );
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  // =================================================================
  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {},
  });

  const creatingCampaign = useCallback(async () => {
    await createDept({ variables: { name, branch, aom } });
  }, [createDept, name, branch, aom]);

  const updatingCampaign = useCallback(
    async (dept: Department | null) => {
      await updateDept({ variables: { id: dept?.id, name, branch, aom } });
    },
    [name, branch, aom, updateDept]
  );

  const deletingCampaign = useCallback(
    async (dept: Department | null) => {
      await deleteDept({ variables: { id: dept?.id } });
      setConfirm(false);
    },
    [name, branch, aom]
  );

  const confirmationFunction: Record<
    string,
    (dept: Department | null) => Promise<void>
  > = {
    CREATE: creatingCampaign,
    UPDATE: updatingCampaign,
    DELETE: deletingCampaign,
  };

  const handleSubmitCreate = useCallback(
    (action: "CREATE") => {
      if (!name || !branch || !aom) {
        setRequired(true);
      } else {
        setRequired(false);
        setConfirm(true);
        setModalProps({
          no: () => setConfirm(false),
          yes: () => {
            confirmationFunction[action]?.(null);
            setConfirm(false);
          },
          message: "Are you sure you want to add this department?",
          toggle: action,
        });
      }
    },
    [
      setModalProps,
      setConfirm,
      setRequired,
      name,
      branch,
      aom,
      confirmationFunction,
    ]
  );

  const handleSubmitUpdate = useCallback(
    (action: "UPDATE") => {
      if (!name || !branch || (!aom && deptToModify?.name !== "admin")) {
        setRequired(true);
      } else {
        setRequired(false);
        setConfirm(true);
        setModalProps({
          no: () => setConfirm(false),
          yes: () => {
            confirmationFunction[action]?.(deptToModify);
          },
          message: "Are you sure you want to add this department?",
          toggle: action,
        });
      }
    },
    [
      name,
      branch,
      aom,
      deptToModify,
      setConfirm,
      setRequired,
      setModalProps,
      confirmationFunction,
    ]
  );

  const handleSubmitDelete = useCallback(
    (dept: Department, action: "DELETE") => {
      setConfirm(true);
      setDeptToModify({
        id: "",
        name: "",
        branch: "",
        aom: {
          _id: "",
          name: "",
        },
      });
      setName("");
      setBranch("");
      setAom("");
      setModalProps({
        no: () => setConfirm(false),
        yes: () => {
          confirmationFunction[action]?.(dept);
          setConfirm(false);
        },
        message: "Are you sure you want to delete this department?",
        toggle: action,
      });
    },
    [
      setConfirm,
      setDeptToModify,
      setName,
      setBranch,
      setAom,
      setModalProps,
      confirmationFunction,
    ]
  );

  const handleUpdateDept = useCallback(
    (dept: Department) => {
      setDeptToModify(dept);
      setIsUpdate(true);
    },
    [setDeptToModify, setIsUpdate]
  );

  useEffect(() => {
    if (isUpdate) {
      setName(deptToModify?.name);
      setBranch(deptToModify?.branch);
      setAom(deptToModify?.aom?.name || "");
    }
  }, [deptToModify, isUpdate]);

  const handleCancelUpdate = useCallback(() => {
    setIsUpdate(false);
    setDeptToModify({
      id: "",
      name: "",
      branch: "",
      aom: {
        _id: "",
        name: "",
      },
    });
    setName("");
    setBranch("");
    setAom("");
  }, [setIsUpdate, setDeptToModify, setName, setBranch, setAom]);

  return (
    <div className=" h-full overflow-hidden">
      <div className="h-full">
        <div className=" items-center my-5 justify-center w-full">
          <div className="px-4 bg-white">
            <motion.h1
              className="font-black text-gray-300 uppercase text-center text-2xl "
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Campaign
            </motion.h1>
          </div>
        </div>
        <div className="flex gap-5 h-[60vh] justify-center">
          <div className="h-full  flex flex-col gap-3 pr-1 overflow-y-auto">
            {dept?.getDepts.map((d, index) => {
              return (
                d.name !== "ADMIN" && (
                  <motion.div
                    key={d.id}
                    className="justify-between shadow-sm font-black rounded-md bg-gray-200 even:bg-gray-300  px-5 py-2 hover:bg-gray-400  text-slate-800 grid grid-cols-5 gap-5 text-center items-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="col-span-2 text-left ">
                      {d?.name.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs">{d?.branch.toUpperCase()}</div>
                    <div
                      className="text-xs truncate  "
                      title={d?.aom?.name.toUpperCase()}
                    >
                      {d?.aom?.name.toUpperCase()}
                    </div>
                    <div className="flex justify-end text-2xl gap-2">
                      <div
                        onClick={() => {
                          handleUpdateDept(d);
                          setCampaign(true);
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
                        onClick={() => handleSubmitDelete(d, "DELETE")}
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
                      {/* <PiNotePencilBold
                        className="text-green-400 cursor-pointer hover:text-green-600"
                        onClick={() => handleUpdateDept(d)}
                      />
                      <PiTrashFill
                        className="text-red-400 hover:text-red-600 cursor-pointer"
                        onClick={() => handleSubmitDelete(d, "DELETE")}
                      /> */}
                    </div>
                  </motion.div>
                )
              );
            })}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {campaign && (
          <div className=" absolute z-50 top-0 left-0 w-full h-full flex justify-center items-center gap-5">
            <motion.div
              onClick={() => {
                setCampaign(false);
                setIsUpdate(false);
                setName("");
                setBranch("");
                setAom("");
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/40 backdrop-blur-sm z-10 cursor-pointer w-full h-full absolute top-0 left-0"
            ></motion.div>
            <motion.div
              className=" bg-gray-100 border-yellow-900 z-20 border-2 rounded-md overflow-hidden shadow-md"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <h1 className="bg-yellow-700 px-10 font-black text-2xl uppercase text-center text-white py-2">
                {isUpdate ? "update campaign" : "create campaign"}
              </h1>

              <div className="px-10 pt-10 flex flex-col gap-2 pb-5">
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="name"
                  value={name}
                  required
                  placeholder="Enter department name"
                  onChange={(e) => setName(e.target.value)}
                  className={`${
                    required && !name
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-300"
                  } bg-gray-50 border-gray-300 border w-full text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 `}
                />

                <select
                  id="branch"
                  name="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className={`${
                    required && !branch
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-300"
                  }  border  text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="">Choose a branch</option>.
                  {data?.getBranches.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name.toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  id="aom"
                  name="aom"
                  value={aom}
                  onChange={(e) => setAom(e.target.value)}
                  className={`${
                    required && !aom && deptToModify.name !== "admin"
                      ? "bg-red-50 border-red-300"
                      : "bg-gray-50 border-gray-300"
                  } bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5`}
                >
                  <option value="">Choose a aom</option>
                  {aomUsers?.getAomUser.map((aom) => (
                    <option key={aom._id} value={aom.name}>
                      {aom.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="px-9 pb-5 flex justify-end">
                {!isUpdate ? (
                  <button
                    type="button"
                    className={`bg-blue-600 hover:bg-blue-700 focus:outline-none text-white focus:ring-4 focus:ring-blue-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                    onClick={() => handleSubmitCreate("CREATE")}
                  >
                    Create
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer"
                      onClick={() => handleSubmitUpdate("UPDATE")}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="bg-slate-500 hover:bg-slate-600 focus:outline-none text-white focus:ring-4 focus:ring-slate-400 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer"
                      onClick={() => {
                        handleCancelUpdate;
                        setCampaign(false);
                        setName("");
                        setBranch("");
                        setAom("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {confirm && <Confirmation {...modalProps} />}
    </div>
  );
};

export default DepartmentSection;
