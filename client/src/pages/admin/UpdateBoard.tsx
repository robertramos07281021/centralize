import { useMutation, useQuery } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import gql from "graphql-tag";
import { useCallback, useEffect, useRef, useState } from "react";
import Loading from "../Loading.tsx";
import { useAppDispatch } from "../../redux/store.ts";
import { setServerError, setSuccess } from "../../redux/slices/authSlice.ts";
import Confirmation from "../../components/Confirmation.tsx";

const ADD_PATCH_UPDATE = gql`
  mutation addPatchUpdate($input: patchUpdatesInput) {
    addPatchUpdate(input: $input) {
      message
      success
    }
  }
`;

const UPDATE_PATCH_UPDATE = gql`
  mutation updatePatchUpdate($id: ID!, $input: patchUpdatesInput) {
    updatePatchUpdate(id: $id, input: $input) {
      message
      success
    }
  }
`;

const REMOVE_PATCH_UPDATE = gql`
  mutation removePatch {
    removePatch {
      message
      success
    }
  }
`;

const PUSH_PATCH_UPDATE = gql`
  mutation pushPatch {
    pushPatch {
      message
      success
    }
  }
`;

const ALL_PATCH_UPDATE = gql`
  query getAllPatchUpdates {
    getAllPatchUpdates {
      _id
      type
      title
      descriptions
      pushPatch
    }
  }
`;

const DELETE_PATCH = gql`
  mutation deletePatchUpdate($id: ID!) {
    deletePatchUpdate(_id: $id) {
      success
      message
    }
  }
`;

type Success = {
  success: boolean;
  message: string;
};

type input = {
  _id?: string | null;
  type: string | null;
  title: string | null;
  descriptions: string | null;
  pushPatch?: boolean;
};
type updateInput = {
  type: string | null;
  title: string | null;
  descriptions: string | null;
};

enum Type {
  AGENT = "Agent",
  TL = "TL",
  MIS = "MIS",
  QA = "QA",
  QASUPERVISOR = "QA Supervisor",
}

const UpdateBoard = () => {
  const dispatch = useAppDispatch();

  const [input, setInput] = useState<input>({
    type: null,
    title: null,
    descriptions: null,
  });
  const [updateInput, setUpdateInput] = useState<updateInput>({
    type: null,
    title: null,
    descriptions: null,
  });

  const resetInput = () => {
    setInput({
      type: null,
      title: null,
      descriptions: null,
    });
  };
  const resetUpdateInput = () => {
    setUpdateInput({
      type: null,
      title: null,
      descriptions: null,
    });
  };

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE",
    yes: () => {},
    no: () => {},
  });

  const { data, refetch } = useQuery<{ getAllPatchUpdates: input[] }>(
    ALL_PATCH_UPDATE,
    {
      notifyOnNetworkStatusChange: true,
    }
  );

  const pushedPatch = data?.getAllPatchUpdates.filter((x) => x.pushPatch);
  const otherPatch = data?.getAllPatchUpdates.filter((x) => !x.pushPatch);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, []);

  const [addPatchUpdate, { loading }] = useMutation<{
    addPatchUpdate: Success;
  }>(ADD_PATCH_UPDATE, {
    onCompleted: async (data) => {
      dispatch(
        setSuccess({
          success: data.addPatchUpdate.success,
          message: data.addPatchUpdate.message,
          isMessage: false,
        })
      );

      await refetch();
      resetInput();
    },
    onError: () => {
      dispatch(setServerError(true));
      resetInput();
    },
  });

  const [updatePatchUpdate, { loading: updateLoading }] = useMutation<{
    updatePatchUpdate: Success;
  }>(UPDATE_PATCH_UPDATE, {
    onCompleted: async (data) => {
      dispatch(
        setSuccess({
          success: data.updatePatchUpdate.success,
          message: data.updatePatchUpdate.message,
          isMessage: false,
        })
      );
      setUpdate(null);
      setUpdateRequired(false);
      await refetch();
      resetUpdateInput();
    },
    onError: () => {
      dispatch(setServerError(true));
      setUpdate(null);
      resetUpdateInput();
    },
  });

  const [pushPatchUpdate, { loading: pushLoading }] = useMutation<{
    pushPatch: Success;
  }>(PUSH_PATCH_UPDATE, {
    onCompleted: async (data) => {
      dispatch(
        setSuccess({
          success: data.pushPatch.success,
          message: data.pushPatch.message,
          isMessage: false,
        })
      );

      await refetch();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [removePatchUpdate, { loading: removeLoading }] = useMutation<{
    removePatch: Success;
  }>(REMOVE_PATCH_UPDATE, {
    onCompleted: async (data) => {
      dispatch(
        setSuccess({
          success: data.removePatch.success,
          message: data.removePatch.message,
          isMessage: false,
        })
      );

      await refetch();
    },
    onError: async () => {
      dispatch(setServerError(true));
      await refetch();
    },
  });

  const [deletePatchUpdate] = useMutation<{ deletePatchUpdate: Success }>(
    DELETE_PATCH,
    {
      onCompleted: async (data) => {
        dispatch(
          setSuccess({
            success: data.deletePatchUpdate.success,
            message: data.deletePatchUpdate.message,
            isMessage: false,
          })
        );
        await refetch();
      },
      onError: async () => {
        dispatch(setServerError(true));
        await refetch();
      },
    }
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  const updateFormRef = useRef<HTMLFormElement | null>(null);
  const [updateRequired, setUpdateRequired] = useState<boolean>(false);
  const [required, setRequired] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [update, setUpdate] = useState<input | null>(null);

  useEffect(() => {
    if (update?._id) {
      setUpdateInput({
        type: update?.type,
        title: update?.title,
        descriptions: update?.descriptions,
      });
    }
  }, [update]);

  const submitAddPatch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formRef.current?.checkValidity()) {
        setRequired(true);
        setConfirm(false);
      } else {
        setRequired(false);
        setConfirm(true);
        setModalProps({
          message: "Are you sure for this Patch Update?",
          toggle: "CREATE",
          yes: async () => {
            await addPatchUpdate({ variables: { input } });
            setConfirm(false);
            setUpdate(null);
          },
          no: () => {
            setConfirm(false);
          },
        });
      }
    },
    [input, setConfirm, setModalProps, formRef]
  );

  const submitUpdatePatch = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!updateFormRef.current?.checkValidity()) {
        setUpdateRequired(true);
        setConfirm(false);
      } else {
        setUpdateRequired(false);
        setConfirm(true);
        setModalProps({
          message: "Are you sure you want to update this Patch Update?",
          toggle: "UPDATE",
          yes: async () => {
            await updatePatchUpdate({
              variables: {
                id: update?._id,
                input: updateInput,
              },
            });
            setConfirm(false);
          },
          no: () => {
            setConfirm(false);
          },
        });
      }
    },
    [
      update,
      updatePatchUpdate,
      setConfirm,
      setModalProps,
      setUpdateRequired,
      updateInput,
    ]
  );

  const [forDeletePatch, setForDeletePatch] = useState<string | null>(null);

  const deleteUpdatePatch = useCallback(
    (id: string) => {
      setForDeletePatch(id);
      setModalProps({
        message: "Are you sure you want to delete this Patch Update?",
        toggle: "DELETE",
        yes: async () => {
          await deletePatchUpdate({
            variables: {
              id: id,
            },
          });
          setForDeletePatch(null);
        },
        no: () => {
          setForDeletePatch(null);
        },
      });
    },
    [setForDeletePatch, deletePatchUpdate, forDeletePatch, setModalProps]
  );

  const handlePushPatch = useCallback(async () => {
    if (!otherPatch || otherPatch.length === 0) return;
    setConfirm(true);
    setModalProps({
      message: "Are you sure you want to push all Patch Update?",
      toggle: "CREATE",
      yes: async () => {
        await pushPatchUpdate();
        setConfirm(false);
      },
      no: () => {
        setConfirm(false);
      },
    });
  }, [otherPatch, pushPatchUpdate, setModalProps, setConfirm]);

  const handleRemovePatch = useCallback(async () => {
    if (!pushedPatch || pushedPatch.length === 0) return;
    setConfirm(true);
    setModalProps({
      message: "Are you sure you want to push all Patch Update?",
      toggle: "DELETE",
      yes: async () => {
        await removePatchUpdate();
        setConfirm(false);
      },
      no: () => {
        setConfirm(false);
      },
    });
  }, [pushedPatch, removePatchUpdate, setModalProps, setConfirm]);

  if (loading || updateLoading || pushLoading || removeLoading)
    return <Loading />;

  return (
    <>
      {(confirm || forDeletePatch) && <Confirmation {...modalProps} />}
      <AnimatePresence>
        {update && (
          <motion.div
            className="absolute top-0 left-0 backdrop-blur-sm w-full h-full bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              className=" relative h-1/2 w-1/3 bg-white rounded-md overflow-hidden border shadow-lg flex flex-col"
              ref={updateFormRef}
              noValidate
              onSubmit={submitUpdatePatch}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="text-center border-b bg-gray-400 text-2xl font-black uppercase p-5">
                Update Patch Note
              </div>

              {updateRequired && (
                <div className="w-full text-center text-sm font-medium px-2 text-red-500 py-2">
                  All fields are required.
                </div>
              )}
              <div className="p-5 justify-between flex flex-col h-full ">
                <div>
                  <label className="flex flex-col justify-start  items-left font-semibold">
                    <div>
                      Account Type:{" "}
                      {!updateInput.type && updateRequired && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                    <select
                      name="type"
                      id="type"
                      className="w-full outline-none border px-2 py-1 rounded-sm shadow-md"
                      required
                      value={updateInput.type || ""}
                      onChange={(e) => {
                        const value =
                          e.target.value.trim() === "" ? null : e.target.value;
                        setUpdateInput((prev) => ({ ...prev, type: value }));
                      }}
                    >
                      <option value="">Select Type</option>
                      {Object.entries(Type).map(([_, value], index) => {
                        return (
                          <option key={index} value={value}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label className="flex flex-col justify-start  items-left font-semibold">
                    <div>
                      Title:{" "}
                      {!updateInput.title && updateRequired && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                    <div className="border px-2 w-full py-1 rounded-sm shadow-md">
                      <input
                        className="w-full outline-none"
                        required
                        placeholder="Bug Fixes and Improvements"
                        value={updateInput.title || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value.trim() === ""
                              ? null
                              : e.target.value;
                          setUpdateInput((prev) => ({ ...prev, title: value }));
                        }}
                      />
                    </div>
                  </label>
                  <label className="flex flex-col justify-start  items-left font-semibold">
                    <div>
                      Description:{" "}
                      {!updateInput.descriptions && updateRequired && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                    <div className="border px-2 w-full py-1 rounded-sm shadow-md">
                      <textarea
                        className="w-full outline-none"
                        required
                        placeholder="Fixed bug on customer disposition."
                        value={updateInput.descriptions || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value.trim() === ""
                              ? null
                              : e.target.value;
                          setUpdateInput((prev) => ({
                            ...prev,
                            descriptions: value,
                          }));
                        }}
                      />
                    </div>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 bg-red-600 hover:bg-red-700 font-black text-white uppercase border-red-900 cursor-pointer transition-all py-1 rounded-sm border-2 "
                    type="button"
                    onClick={() => {
                      setUpdateRequired(false);
                      setUpdate(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 bg-green-600 hover:bg-green-700 font-black text-white uppercase border-green-900 cursor-pointer transition-all py-1 rounded-sm border-2 "
                    type="submit"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-h-[90dvh] gap-2  h-full w-full grid grid-cols-3 p-5">
        <motion.form
          className="w-full overflow-hidden h-full flex flex-col bg-gray-100 border rounded-md shadow-md"
          ref={formRef}
          noValidate
          onSubmit={submitAddPatch}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className=" py-2.5 bg-gray-400 font-black uppercase text-2xl flex justify-center items-center border-b">
            create NEw patch note
          </div>
          <div className="h-full flex flex-col justify-between bg-gray-100 overflow-y-auto p-5">
            <div className="flex flex-col gap-2">
              {required && (
                <div className="w-full text-center text-sm font-medium px-2 text-red-500">
                  All fields are required.
                </div>
              )}
              <label className="flex flex-col justify-start  items-left font-semibold">
                <div>
                  Account Type:{" "}
                  {!input.type && required && (
                    <span className="text-red-500 font-bold">*</span>
                  )}
                </div>
                <select
                  name="type"
                  id="type"
                  className="w-full outline-none border px-2 py-1 rounded-sm shadow-md"
                  required
                  value={input.type || ""}
                  onChange={(e) => {
                    const value =
                      e.target.value.trim() === "" ? null : e.target.value;
                    setInput((prev) => ({ ...prev, type: value }));
                  }}
                >
                  <option value="">Select Type</option>
                  {Object.entries(Type).map(([_, value], index) => {
                    return (
                      <option key={index} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="flex flex-col justify-start  items-left font-semibold">
                <div>
                  Title:{" "}
                  {!input.title && required && (
                    <span className="text-red-500 font-bold">*</span>
                  )}
                </div>
                <div className="border px-2 w-full py-1 rounded-sm shadow-md">
                  <input
                    className="w-full outline-none"
                    required
                    placeholder="Bug Fixes and Improvements"
                    value={input.title || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value.trim() === "" ? null : e.target.value;
                      setInput((prev) => ({ ...prev, title: value }));
                    }}
                  />
                </div>
              </label>

              <label className="flex flex-col justify-start  items-left font-semibold">
                <div>
                  Description:{" "}
                  {!input.descriptions && required && (
                    <span className="text-red-500 font-bold">*</span>
                  )}
                </div>
                <div className="border px-2 w-full py-1 rounded-sm shadow-md">
                  <textarea
                    className="w-full outline-none"
                    required
                    placeholder="Fixed bug on customer disposition."
                    value={input.descriptions || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value.trim() === "" ? null : e.target.value;
                      setInput((prev) => ({ ...prev, descriptions: value }));
                    }}
                  />
                </div>
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  input.descriptions === null ||
                  input.title === null ||
                  input.type === null
                }
                className={`" ${
                  input.descriptions === null ||
                  input.title === null ||
                  input.type === null
                    ? "bg-gray-400 border-gray-500 cursor-not-allowed text-gray-200 "
                    : "bg-blue-600 hover:bg-blue-700 text-white border-blue-900 cursor-pointer"
                }   transition-all  font-black uppercase px-3 py-1 border-2 rounded-sm  "`}
              >
                QUEUE
              </button>{" "}
            </div>
          </div>
        </motion.form>
        <motion.div
          className="w-full overflow-hidden h-full bg-gray-100 border rounded-md col-span-2 shadow-md flex flex-col"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
        >
          <div className=" bg-gray-400 font-black uppercase text-2xl flex justify-center items-center border-b py-2.5">
            Live Patch notes
          </div>
          <div className="h-full grid grid-cols-3 overflow-y-auto p-3 gap-2">
            <div className="border flex-col p-2 h-full border-black text-gray-400 flex items-center justify-center rounded-md bg-gray-200 overflow-hidden">
              <div className="w-full h-full flex p-2 flex-col gap-2 text-black overflow-auto">
                {otherPatch && otherPatch?.length > 0 ? (
                  otherPatch?.map((patch, idx) => {
                    return (
                      <motion.div
                        key={patch._id}
                        className="border w-full rounded shadow-md"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 100,
                          delay: idx * 0.2,
                        }}
                      >
                        <p className="w-full text-center rounded-t-sm font-black uppercase border-b bg-gray-400 p-2">
                          {patch.type}
                        </p>
                        <div className="p-2 h-full">
                          <div className="flex gap-1">
                            <div>Title:</div>
                            <p>{patch.title}</p>
                          </div>
                          <div className="flex gap-1">
                            <div>Description:</div>
                            <p>{patch.descriptions}</p>
                          </div>
                          <div className="flex items-end justify-end gap-2">
                            <div
                              onClick={() => setUpdate(patch)}
                              className="p-1 bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer border-2 border-blue-900 rounded-md text-white"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M11.828 2.25c-.916 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 0 1-.517.608 7.45 7.45 0 0 0-.478.198.798.798 0 0 1-.796-.064l-.453-.324a1.875 1.875 0 0 0-2.416.2l-.243.243a1.875 1.875 0 0 0-.2 2.416l.324.453a.798.798 0 0 1 .064.796 7.448 7.448 0 0 0-.198.478.798.798 0 0 1-.608.517l-.55.092a1.875 1.875 0 0 0-1.566 1.849v.344c0 .916.663 1.699 1.567 1.85l.549.091c.281.047.508.25.608.517.06.162.127.321.198.478a.798.798 0 0 1-.064.796l-.324.453a1.875 1.875 0 0 0 .2 2.416l.243.243c.648.648 1.67.733 2.416.2l.453-.324a.798.798 0 0 1 .796-.064c.157.071.316.137.478.198.267.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.344c.916 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 0 1 .517-.608 7.52 7.52 0 0 0 .478-.198.798.798 0 0 1 .796.064l.453.324a1.875 1.875 0 0 0 2.416-.2l.243-.243c.648-.648.733-1.67.2-2.416l-.324-.453a.798.798 0 0 1-.064-.796c.071-.157.137-.316.198-.478.1-.267.327-.47.608-.517l.55-.091a1.875 1.875 0 0 0 1.566-1.85v-.344c0-.916-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 0 1-.608-.517 7.507 7.507 0 0 0-.198-.478.798.798 0 0 1 .064-.796l.324-.453a1.875 1.875 0 0 0-.2-2.416l-.243-.243a1.875 1.875 0 0 0-2.416-.2l-.453.324a.798.798 0 0 1-.796.064 7.462 7.462 0 0 0-.478-.198.798.798 0 0 1-.517-.608l-.091-.55a1.875 1.875 0 0 0-1.85-1.566h-.344ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div
                              onClick={() => {
                                deleteUpdatePatch(patch._id as string);
                              }}
                              className="p-1 bg-red-600 hover:bg-red-700 transition-all cursor-pointer border-2 border-red-900 rounded-md text-white"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-6"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full items-center italic flex justify-center text-gray-400">
                    No Patch Notes to Live
                  </div>
                )}
              </div>
              <div className="flex justify-end text-right w-full h-[10%] items-end px-3 py-2">
                <div
                  className={`" ${
                    otherPatch?.length === 0
                      ? "bg-gray-400 border-gray-500 cursor-not-allowed text-gray-200 "
                      : "bg-green-600 border-green-900 hover:bg-green-700 text-white cursor-pointer"
                  }  px-3 py-1 border-2 rounded-md   font-black uppercase "`}
                  onClick={handlePushPatch}
                >
                  PUSH
                </div>
              </div>
            </div>

            <div className="border flex-col col-span-2 p-2 h-full border-black text-gray-400 flex items-center justify-center rounded-md bg-gray-200 overflow-hidden">
              <div className="w-full h-[90%] p-2 flex flex-col gap-2 text-black overflow-auto">
                {pushedPatch && pushedPatch?.length > 0 ? (
                  pushedPatch?.map((patch) => {
                    return (
                      <div
                        key={patch._id}
                        className="border w-full rounded shadow-md "
                      >
                        <p className="w-full text-center rounded-t-sm font-black uppercase border-b bg-gray-400 p-2">
                          {patch.type}
                        </p>
                        <div className="p-2">
                          <div className="flex gap-1">
                            <div>Title:</div>
                            <p>{patch.title}</p>
                          </div>
                          <div className="flex gap-1">
                            <div>Description:</div>
                            <p>{patch.descriptions}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full items-center italic flex justify-center text-gray-400">
                    No Patch Notes are Live
                  </div>
                )}
              </div>
              <div className="flex justify-end text-right items-end w-full h-[10%] px-3 py-2">
                <div
                  className={`" ${
                    pushedPatch?.length === 0
                      ? "bg-gray-400 border-gray-500 cursor-not-allowed text-gray-200"
                      : "bg-red-600 hover:bg-red-700  border-red-900 cursor-pointer text-white "
                  }  px-3 py-1 border-2 rounded-md font-black uppercase "`}
                  onClick={handleRemovePatch}
                >
                  REMOVE
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default UpdateBoard;
