/* eslint-disable @typescript-eslint/no-explicit-any */
import { gql, useMutation, useQuery } from "@apollo/client";
import { useCallback, useRef, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { useAppDispatch } from "../../redux/store";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

const BRANCH_QUERY = gql`
  query branchQuery {
    getBranches {
      id
      name
    }
  }
`;
const CREATEBRANCH = gql`
  mutation createBranch($name: String!) {
    createBranch(name: $name) {
      success
      message
    }
  }
`;
const UPDATEBRANCH = gql`
  mutation updateBranch($name: String!, $id: ID!) {
    updateBranch(name: $name, id: $id) {
      success
      message
    }
  }
`;
const DELETEBRANCH = gql`
  mutation deleteBranch($id: ID!) {
    deleteBranch(id: $id) {
      success
      message
    }
  }
`;

type Branch = {
  id: string;
  name: string;
};

type BranchSectionProps = {
  branch: boolean;
  setBranch: React.Dispatch<React.SetStateAction<boolean>>;
};

const BranchSection: React.FC<BranchSectionProps> = ({ branch, setBranch }) => {
  const { data, refetch } = useQuery<{ getBranches: Branch[] }>(BRANCH_QUERY);
  const dispatch = useAppDispatch();

  const form = useRef<HTMLFormElement | null>(null);
  const [name, setName] = useState<string>("");
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [required, setRequired] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [branchToUpdate, setBranchToUpdate] = useState<Branch | null>(null);

  const [createBranch] = useMutation(CREATEBRANCH, {
    onCompleted: async () => {
      await refetch();
      dispatch(
        setSuccess({
          success: true,
          message: "Branch successfully created",
          isMessage: false,
        })
      );
      setName("");
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Branch already exists",
            isMessage: false,
          })
        );
        setName("");
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [updateBranch] = useMutation(UPDATEBRANCH, {
    onCompleted: async () => {
      try {
        const res = await refetch();
        if (res.data) {
          dispatch(
            setSuccess({
              success: true,
              message: "Branch successfully updated",
              isMessage: false,
            })
          );
        }
      } catch (error) {
        dispatch(setServerError(true));
      }
      setBranch(false);
      setName("");
      setIsUpdate(false);
      setBranchToUpdate(null);
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Branch already exists",
            isMessage: false,
          })
        );
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [deleteBranch] = useMutation(DELETEBRANCH, {
    onCompleted: async () => {
      try {
        const res = await refetch();
        if (res.data) {
          dispatch(
            setSuccess({
              success: true,
              message: "Branch successfully deleted",
              isMessage: false,
            })
          );
        }
      } catch (error) {
        dispatch(setServerError(true));
      }
      setName("");
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const creatingBranch = useCallback(async () => {
    await createBranch({ variables: { name } });
  }, [createBranch, name]);

  const updatingBranch = useCallback(async () => {
    await updateBranch({ variables: { id: branchToUpdate?.id, name } });
  }, [branchToUpdate, name, updateBranch]);

  const deletingBranch = useCallback(
    async (branch?: Branch) => {
      if (!branch) return;
      await deleteBranch({ variables: { id: branch.id } });
      setBranchToUpdate(null);
    },
    [deleteBranch, setBranchToUpdate]
  );

  const confirmationFunction: Record<
    string,
    (branch?: Branch) => Promise<void>
  > = {
    CREATE: creatingBranch,
    UPDATE: updatingBranch,
    DELETE: deletingBranch,
  };

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE",
    yes: () => {},
    no: () => {},
  });

  const handleUpdateBranch = useCallback(
    (branch: Branch) => {
      setIsUpdate(true);
      setBranchToUpdate(branch);
      setName(branch.name);
    },
    [setIsUpdate, setBranchToUpdate, setName]
  );

  const handleSubmitForm = useCallback(
    (
      e: React.FormEvent<HTMLFormElement> | null,
      action: "CREATE" | "UPDATE" | "DELETE" | "LOGOUT"
    ) => {
      if (e) {
        e.preventDefault();
      }
      if (!form?.current?.checkValidity()) {
        setRequired(true);
      } else {
        setConfirm(true);

        if (action === "CREATE") {
          setRequired(false);
          setModalProps({
            no: () => setConfirm(false),
            yes: () => {
              confirmationFunction[action]?.();
              setConfirm(false);
            },
            message: "Are you sure you want to add this branch?",
            toggle: action,
          });
        } else if (action === "UPDATE") {
          setRequired(false);
          setModalProps({
            no: () => setConfirm(false),
            yes: () => {
              confirmationFunction[action]?.();
              setConfirm(false);
            },
            message: "Are you sure you want to update this branch?",
            toggle: action,
          });
        }
      }
    },
    [setModalProps, setRequired, confirmationFunction, setConfirm, form]
  );

  return (
    <motion.div
      className="border rounded-md bg-gray-200 w-full h-full overflow-hidden"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0 }}
    >
      <div className=" h-full w-full">
        <div className="flex bg-purple-600 text-white items-center justify-center py-3 border-b border-black w-full">
          <h1 className="text-2xl font-black uppercase">Branch</h1>
        </div>
        <div className="flex gap-10 bg-purple-300 justify-center items-center w-full h-full">
          <div className="h-full w-full flex flex-col gap-2 rounded-xl overflow-y-auto p-4">
            {data?.getBranches?.map((branch, index) => (
              <div
                key={branch.id}
                className="even:bg-purple-100 text-black border shadow-md odd:bg-purple-200 rounded-md"
              >
                <div className="flex flex-row justify-between items-center px-4 shadow-sm py-2 gap-10 hover:shadow-lg transition-all rounded-md">
                  <p className="uppercase font-black  ">{branch.name}</p>
                  <div className="flex gap-2">
                    <div
                      onClick={() => {
                        handleUpdateBranch(branch);
                        setBranch(true);
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
                      onClick={() => {
                        setConfirm(true);
                        setModalProps({
                          no: () => setConfirm(false),
                          yes: async () => {
                            if (branch) {
                              await confirmationFunction["DELETE"](branch);
                            }
                            setConfirm(false);
                          },
                          message:
                            "Are you sure you want to delete this branch?",
                          toggle: "DELETE",
                        });
                      }}
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
                    {/* <PiTrashFill className="text-red-400 hover:text-red-600 cursor-pointer" /> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AnimatePresence>
            {branch && (
              <form
                ref={form}
                onSubmit={(e) =>
                  handleSubmitForm(e, isUpdate ? "UPDATE" : "CREATE")
                }
                className=" h-full top-0 left-0 absolute justify-center  items-center w-full flex flex-col gap-5"
                noValidate
              >
                <motion.div
                  onClick={() => {
                    setBranch(false);
                    setIsUpdate(false);
                    setName("");
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-black/40 backdrop-blur-sm cursor-pointer w-full h-full absolute top-0 left-0"
                ></motion.div>
                <motion.div
                  className="bg-gray-100 border-2 rounded-md border-purple-900 z-20 "
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  {isUpdate ? (
                    <h1 className="text-2xl px-10 py-2 bg-purple-700 font-black uppercase text-center text-white ">
                      Update Branch
                    </h1>
                  ) : (
                    <h1 className="text-2xl  px-10  py-2 bg-purple-700 font-black uppercase text-center text-white ">
                      CREATE Branch
                    </h1>
                  )}
                  <div className=" px-5 pb-5   pt-10">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      value={name}
                      required
                      placeholder="Enter name"
                      onChange={(e) => setName(e.target.value)}
                      className={`${
                        required
                          ? "bg-red-100 border-red-300 "
                          : "bg-gray-50 border-gray-300 "
                      } border text-gray-900 w-full text-sm shadow-md rounded-lg focus:ring-blue-500 focus:border-blue-500  p-2.5 `}
                    />
                  </div>

                  <div className="flex justify-end px-3 mb-2 ">
                    {isUpdate && (
                      <button
                        type="button"
                        className={` bg-slate-400 hover:bg-slate-500 focus:outline-none text-white  focus:ring-4 focus:ring-slate-300 font-black uppercase border-gray-800 border-2 transition-all rounded-lg text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                        onClick={() => {
                          setIsUpdate(false);
                          setName("");
                          setBranch(false);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`${
                        isUpdate
                          ? "bg-purple-500 border-purple-800 hover:bg-purple-600"
                          : " bg-purple-500 hover:bg-purple-600 border-purple-800"
                      } focus:outline-none text-white border-2 focus:ring-4 focus:ring-blue-300 shadow-md font-black uppercase transition-all rounded-md text-sm px-5 py-2.5 me-2 mb-2  cursor-pointer`}
                    >
                      {!isUpdate ? "Create" : "Update"}
                    </button>
                  </div>
                </motion.div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </motion.div>
  );
};

export default BranchSection;
