import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useMemo, useState } from "react";
import { FaPlusCircle, FaMinusCircle, FaEdit } from "react-icons/fa";
import Confirmation from "../../components/Confirmation";
import {
  setSelectedGroup,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice";
import { RootState, useAppDispatch } from "../../redux/store";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

type Member = {
  _id: string;
  name: string;
  user_id: string;
  buckets: string[];
};
type Group = {
  _id: string;
  name: string;
  description: string;
  members: Member[];
};

type DeptAgent = {
  _id: string;
  name: string;
  user_id: string;
  group: string;
  buckets: string[];
};

const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!, $description: String!) {
    createGroup(name: $name, description: $description) {
      message
      success
    }
  }
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id) {
      success
      message
    }
  }
`;
const UPDATE_GROUP = gql`
  mutation DeleteGroup($id: ID!, $name: String, $description: String) {
    updateGroup(id: $id, name: $name, description: $description) {
      message
      success
    }
  }
`;

const DEPT_GROUP = gql`
  query Query {
    findGroup {
      _id
      name
      description
      members {
        _id
        name
        user_id
        buckets
      }
    }
  }
`;

const DEPT_AGENT = gql`
  query FindAgents {
    findAgents {
      _id
      name
      user_id
      group
      buckets
    }
  }
`;

const ADD_GROUP_MEMBER = gql`
  mutation AddGroupMember($addGroupMemberId: ID!, $member: ID!) {
    addGroupMember(id: $addGroupMemberId, member: $member) {
      message
      success
    }
  }
`;

const DELETE_GROUP_MEMBER = gql`
  mutation Mutation($id: ID!, $member: ID!) {
    deleteGroupMember(id: $id, member: $member) {
      message
      success
    }
  }
`;

type Bucket = {
  _id: string;
  name: string;
  dept: string;
};

const GET_DEPT_BUCKETS = gql`
  query Query {
    getDeptBucket {
      _id
      name
      dept
    }
  }
`;

const GroupSection = () => {
  const dispatch = useAppDispatch();
  const { selectedGroup } = useSelector((state: RootState) => state.auth);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [confirm, setConfirm] = useState<boolean>(false);
  const [addMember, setAddMember] = useState(false);
  const [required, setRequire] = useState(false);
  const [groupRequired, setGroupRequired] = useState(false);
  const { data: deptGroupData, refetch: deptGroupDataRefetch } = useQuery<{
    findGroup: Group[];
  }>(DEPT_GROUP);
  const { data: deptAgentData, refetch: deptAgentDataRefetch } = useQuery<{
    findAgents: DeptAgent[];
  }>(DEPT_AGENT);
  const selectedGroupData = deptGroupData?.findGroup.find(
    (dgd) => dgd.name === selectedGroup
  );

  const [updatedGroup, setUpdateGroup] = useState<boolean>(false);
  const { data: deptBucketData } = useQuery<{ getDeptBucket: Bucket[] }>(
    GET_DEPT_BUCKETS
  );

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const bucketData = deptBucketData?.getDeptBucket || [];
    return Object.fromEntries(bucketData.map((bd) => [bd._id, bd.name]));
  }, [deptBucketData]);

  const dgdObject: { [key: string]: string } = useMemo(() => {
    const deptGroup = deptGroupData?.findGroup || [];
    return Object.fromEntries(deptGroup.map((fg) => [fg.name, fg._id]));
  }, [deptGroupData]);

  const dgdObjectName: { [key: string]: string } = useMemo(() => {
    const deptGroup = deptGroupData?.findGroup || [];
    return Object.fromEntries(deptGroup.map((fg) => [fg._id, fg.name]));
  }, [deptGroupData]);

  useEffect(() => {
    setUpdateGroup(false);
  }, [selectedGroup]);

  useEffect(() => {
    if (updatedGroup) {
      setName(selectedGroupData ? selectedGroupData?.name : "");
      setDescription(selectedGroupData ? selectedGroupData?.description : "");
    } else {
      setName("");
      setDescription("");
    }
  }, [updatedGroup, selectedGroupData]);

  //mutations ============================================================================
  const [createGroup] = useMutation(CREATE_GROUP, {
    onCompleted: (result) => {
      setName("");
      setDescription("");
      setConfirm(false);
      deptGroupDataRefetch();
      dispatch(
        setSuccess({
          success: result.createGroup.success,
          message: result.createGroup.message,
          isMessage: false,
        })
      );
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Group name already exists",
            isMessage: false,
          })
        );
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [updateGroup] = useMutation(UPDATE_GROUP, {
    onCompleted: (result) => {
      setName("");
      setDescription("");
      setConfirm(false);
      dispatch(setSelectedGroup(""));
      deptGroupDataRefetch();
      setUpdateGroup(false);
      dispatch(
        setSuccess({
          success: result.updateGroup.success,
          message: result.updateGroup.message,
          isMessage: false,
        })
      );
    },
    onError: (error) => {
      const errorMessage = error.message;
      if (errorMessage?.includes("E11000")) {
        dispatch(
          setSuccess({
            success: true,
            message: "Group name already exists",
            isMessage: false,
          })
        );
        setConfirm(false);
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const [deleteGroup] = useMutation(DELETE_GROUP, {
    onCompleted: (result) => {
      setName("");
      deptGroupDataRefetch();
      setDescription("");
      deptAgentDataRefetch();
      dispatch(setSelectedGroup(""));
      setConfirm(false);
      setAddMember(false);
      dispatch(
        setSuccess({
          success: result.deleteGroup.success,
          message: result.deleteGroup.message,
          isMessage: false,
        })
      );
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [addGroupMember] = useMutation(ADD_GROUP_MEMBER, {
    onCompleted: () => {
      deptGroupDataRefetch();
      deptAgentDataRefetch();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [deleteGroupMember] = useMutation(DELETE_GROUP_MEMBER, {
    onCompleted: () => {
      deptGroupDataRefetch();
      deptAgentDataRefetch();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  //mutations end =========================================================================

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {},
  });

  const onSubmitCreateGroup = () => {
    if (!name) {
      setRequire(true);
    } else {
      setRequire(false);
      setConfirm(true);
      setModalProps({
        message: "Do you want to add this group?",
        toggle: "CREATE",
        yes: async () => {
          await createGroup({ variables: { name, description } });
        },
        no: () => {
          setConfirm(false);
        },
      });
    }
  };

  const handleAddGroupMember = async (memberId: string) => {
    await addGroupMember({
      variables: {
        addGroupMemberId: dgdObject[selectedGroup],
        member: memberId,
      },
    });
  };

  const handleAddMemberTransition = () => {
    if (!addMember) {
      if (!selectedGroup) {
        setGroupRequired(true);
      } else {
        setGroupRequired(false);
        setAddMember(true);
      }
    } else {
      setAddMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    await deleteGroupMember({
      variables: { id: dgdObject[selectedGroup], member: memberId },
    });
  };

  const handleClickDeleteGroup = () => {
    setConfirm(true);
    setModalProps({
      message: "Do you want to delete this group?",
      toggle: "DELETE",
      yes: async () => {
        await deleteGroup({ variables: { id: dgdObject[selectedGroup] } });
      },
      no: () => {
        setConfirm(false);
      },
    });
  };

  const handleClickUpdateGroupSubmit = () => {
    if (!name) {
      setRequire(true);
    } else {
      setRequire(false);
      setConfirm(true);
      setModalProps({
        message: "Do you want to update this group?",
        toggle: "UPDATE",
        yes: async () => {
          await updateGroup({
            variables: {
              id: dgdObject[selectedGroup],
              name: name,
              description: description,
            },
          });
        },
        no: () => {
          setConfirm(false);
        },
      });
    }
  };

  return (
    <>
      <div className=" flex justify-between h-full w-full gap-5 items-end flex-col">
        <div className="flex gap-2 pt-3 w-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5, type: "spring" }}
          >
            <input
              type="text"
              name="name"
              id="name"
              autoComplete="off"
              value={name}
              className={`border h-full shadow-sm  ${
                required ? "border-red-500 bg-red-50" : "border-black bg-white"
              } rounded-md lg:py-1  2xl:py-1.5 focus:outline-none pl-4 lg:text-sm 2xl:text-sm`}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Group Name..."
            />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5, type: "spring" }}
            className="w-full"
          >
            <input
              type="text"
              name="discription"
              id="discription"
              autoComplete="off"
              value={description}
              className="border shadow-sm h-full border-black focus:outline-none bg-slate-50 rounded-md  lg:py-1 pl-4  2xl:py-1.5 flex  w-full text-sm "
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Group Description..."
            />
          </motion.div>
          {!updatedGroup ? (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5, type: "spring" }}
              type="button"
              className="shadow-md text-white bg-green-500 border-2 font-black uppercase whitespace-nowrap border-green-800 hover:bg-green-600 focus:ring-4 focus:ring-green-300 cursor-pointer rounded-lg text-sm px-5 h-10 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
              onClick={onSubmitCreateGroup}
            >
              Add Group
            </motion.button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                className="focus:outline-none border-2 border-orange-900 text-white bg-orange-600 hover:bg-orange-700 cursor-pointer transition-all font-black rounded-md uppercase text-xs px-5 py-2.5 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-green-800"
                onClick={handleClickUpdateGroupSubmit}
              >
                Submit
              </button>
              <button
                type="button"
                className="text-white bg-gray-600 hover:bg-gray-700 focus:outline-none border-2 border-gray-800 focus:ring-4 focus:ring-gray-300 font-black uppercase cursor-pointer rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                onClick={() => setUpdateGroup(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 lg:text-[0.6em] 2xl:text-xs">
          {selectedGroup && (
            <>
              <div>
                <div
                  className="p-1 bg-green-600 border-2 cursor-pointer hover:bg-green-700 transition-all border-green-900 rounded-sm shadow-md  text-white"
                  title="Add Member"
                  onClick={handleAddMemberTransition}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
                {/* <FaPlusCircle
                  className={`${
                    addMember && "rotate-45"
                  } peer text-3xl transition-transform hover:scale-105 cursor-pointer `}
                  onClick={handleAddMemberTransition}
                /> */}
                {/* <p className="peer-hover:block hidden absolute text-xs -translate-x-1/2 left-4 -top-5 font-bold text-slate-700 bg-white ">
                  {addMember ? "Close" : "Add Member"}
                </p> */}
              </div>
              <div>
                <div
                  className="p-1 bg-orange-500 border-2 cursor-pointer hover:bg-orange-600 transition-all border-orange-900 rounded-sm shadow-md  text-white"
                  title="Update Group"
                  onClick={() => setUpdateGroup(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </div>
                {/* <FaEdit
                  className="peer w-8 h-8 border rounded-full p-1 bg-orange-400 text-white hover:scale-105 cursor-pointer "
                  onClick={() => setUpdateGroup(true)}
                />
                <p className="peer-hover:block hidden absolute text-xs -translate-x-1/2 left-16 -top-5 font-bold text-slate-700 bg-white">
                  Update Group
                </p> */}
              </div>
              <div>
                <div
                  className="p-1 bg-red-600 border-2 cursor-pointer hover:bg-red-700 transition-all border-red-900 rounded-sm shadow-md  text-white"
                  title="Delete Group"
                  onClick={handleClickDeleteGroup}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </div>
                {/* <FaMinusCircle
                  className="peer text-3xl text-red-700 hover:scale-105 cursor-pointer"
                  onClick={handleClickDeleteGroup}
                />
                <p className="peer-hover:block hidden absolute text-xs translate-x-1/2 left-10 -top-5 font-bold text-slate-700 bg-white">
                  Delete Group
                </p> */}
              </div>
            </>
          )}
          {!addMember ? (
            <motion.select
              id="group"
              name="group"
              value={selectedGroup}
              className={`${
                groupRequired
                  ? "border-red-500 bg-red-50"
                  : "bg-gray-50 border-black "
              } border text-black focus:outline-none uppercase cursor-pointer shadow-md text-sm font-bold rounded-lg block lg:w-50 2xl:w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
              onChange={(e) => {
                dispatch(setSelectedGroup(e.target.value));
                setGroupRequired(false);
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration:  0.5, type: "spring" }}
            >
              <option value="">Select Group</option>
              {deptGroupData?.findGroup?.map((dgd) => (
                <option key={dgd._id} value={dgd.name}>
                  {dgd.name}
                </option>
              ))}
            </motion.select>
          ) : (
            <div className=" ps-3.5 h-10 pe-0 lg:w-50 2xl:w-96 border border-slate-300 rounded-lg bg-slate-50 cursor-default flex justify-between items-center">
              <p>{selectedGroup}</p>{" "}
            </div>
          )}
          <AnimatePresence>
            {addMember && (
              <div className="absolute top-0 p-20 left-0 w-full h-full justify-center items-center  flex gap-2">
                <motion.div
                  className="bg-black/40 absolute w-full h-full z-50 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                ></motion.div>
                <motion.div
                  className="flex gap-2 bg-white p-3 rounded-sm border z-60 "
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <AnimatePresence>
                    <motion.div
                      className="bg-white rounded-md h-full border overflow-hidden shadow-md z-60 "
                      layout
                    >
                      <div className="grid uppercase py-2 bg-gray-300 border-b shadow-md grid-cols-5 text-center">
                        <div>id</div>
                        <div className="col-span-2">name</div>
                        <div className="col-span-2">bucket</div>
                      </div>
                      {deptAgentData?.findAgents.map((da) => (
                        <div
                          key={da._id}
                          className="grid grid-cols-5 text-sm items-center text-center px-5 py-2 odd:bg-gray-100 hover:bg-gray-200 "
                        >
                          <div className="cursor-default">
                            {da.user_id || (
                              <div className="text-xs text-gray-400 italic">
                                No ID
                              </div>
                            )}
                          </div>
                          <div
                            className="text-nowrap truncate uppercase cursor-default"
                            title={da.name.toUpperCase()}
                          >
                            {da.name}
                          </div>
                          <div className="col-span-2 cursor-default">
                            {da.buckets.map((e) => bucketObject[e]).join(", ")}
                          </div>
                          <div className="flex justify-end cursor-default">
                            {da.group ? (
                              dgdObjectName[da.group]
                            ) : (
                              <div
                                className="bg-green-600 cursor-pointer hover:bg-green-700 transition-all shadow-md p-1 border-2 rounded-md text-white border-green-800"
                                onClick={() => handleAddGroupMember(da._id)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                  className="size-6"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                  />
                                </svg>
                              </div>
                              // <FaPlusCircle
                              //   className="lg:text-base 2xl:text-lg text-green-500"
                              //   onClick={() => handleAddGroupMember(da._id)}
                              // />
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                    <motion.div
                      className="bg-white rounded-md min-w-60 border h-full text-sm uppercase p-2 overflow-hidden shadow-md z-60 "
                      layout
                    >
                      <div className="flex flex-col overflow-y-auto">
                        <h1 className="font-black text-black">Description</h1>
                        <div className="flex flex-col overflow-y-auto text-justify px-2">
                          {selectedGroupData?.description}
                        </div>
                      </div>
                      <div className="h-2/3 flex flex-col">
                        <h1 className="font-black text-black">
                          Member
                          {selectedGroupData?.members &&
                          selectedGroupData?.members?.length > 1
                            ? "s"
                            : ""}
                        </h1>
                        <div
                          className={`" ${
                            selectedGroupData?.members ? "border" : ""
                          } max-h-40 flex flex-col rounded-sm shadow-md  overflow-y-auto "`}
                        >
                          {selectedGroupData?.members.length === 0 && (
                            <p className="text-center italic lowercase text-gray-500 py-2">
                              No members in this group.
                            </p>
                          )}
                          {selectedGroupData?.members.map((m) => (
                            <div
                              key={m._id}
                              className="grid grid-cols-5 items-center text-center odd:bg-gray-100 py-1"
                            >
                              <p className="cursor-default">{m.user_id}</p>
                              <p
                                className="uppercase text-nowrap truncate cursor-default"
                                title={m.name.toUpperCase()}
                              >
                                {m.name}
                              </p>
                              <p className="col-span-2 cursor-default">
                                {m.buckets
                                  .map((e) => bucketObject[e])
                                  .join(", ")}
                              </p>
                              <div className="flex justify-end mr-3">
                                <div
                                  className="p-1 bg-red-600 hover:bg-red-700 transition-all rounded-md border-2 border-red-900 text-white cursor-pointer"
                                  onClick={() => handleDeleteMember(m._id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="size-6"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 12h14"
                                    />
                                  </svg>
                                </div>
                                {/* <FaMinusCircle
                              className="lg:text-base 2xl:text-lg text-red-500"
                              onClick={() => handleDeleteMember(m._id)}
                            /> */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <div className="">
                    <div
                      className="p-1 rounded-full text-white border-2 border-red-900 cursor-pointer shadow-md bg-red-600 hover:bg-red-700 transition-all"
                      onClick={() => setAddMember(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
                {/* <div className="bg-white z-10  border -translate-x-full -left-2 h-96 top-0 rounded-lg border-slate-300 shadow-lg shadow-black/15 p-3 flex flex-col">
                <p className="font-bold text-slate-700">Agent</p>
                <div className="h-full overflow-y-auto mt-2 text-slate-700">
                  {deptAgentData && deptAgentData?.findAgents?.length > 0 && (
                    <div>dsadasdas</div>
                  )}
                  {deptAgentData?.findAgents.map((da) => (
                    <div
                      key={da._id}
                      className="grid grid-cols-5 text-center py-1.5  odd:bg-slate-100"
                    >
                      <p className="cursor-default">{da.user_id}</p>
                      <p
                        className="text-nowrap truncate uppercase cursor-default"
                        title={da.name.toUpperCase()}
                      >
                        {da.name}
                      </p>
                      <p className="col-span-2 cursor-default">
                        {da.buckets.map((e) => bucketObject[e]).join(", ")}
                      </p>
                      <p className="flex justify-center cursor-default">
                        {da.group ? (
                          dgdObjectName[da.group]
                        ) : (
                          <FaPlusCircle
                            className="lg:text-base 2xl:text-lg text-green-500"
                            onClick={() => handleAddGroupMember(da._id)}
                          />
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white z-10 border rounded-lg border-slate-300 shadow-lg shadow-black/15 p-2 flex flex-col">
                <div className="flex flex-col overflow-y-auto h-1/3">
                  <h1 className="font-bold text-slate-700">Description</h1>
                  <div className="indent-5 mt-2 flex flex-col overflow-y-auto text-justify px-2">
                    {selectedGroupData?.description}
                  </div>
                </div>
                <div className="h-2/3 flex flex-col">
                  <h1 className="font-bold text-slate-700">
                    Member
                    {selectedGroupData?.members &&
                    selectedGroupData?.members?.length > 1
                      ? "s"
                      : ""}
                  </h1>
                  <div className="h- flex flex-col overflow-y-auto">
                    {selectedGroupData?.members.map((m) => (
                      <div
                        key={m._id}
                        className="grid grid-cols-5 text-center odd:bg-slate-100 py-1"
                      >
                        <p className="cursor-default">{m.user_id}</p>
                        <p
                          className="uppercase text-nowrap truncate cursor-default"
                          title={m.name.toUpperCase()}
                        >
                          {m.name}
                        </p>
                        <p className="col-span-2 cursor-default">
                          {m.buckets.map((e) => bucketObject[e]).join(", ")}
                        </p>
                        <p className="flex justify-center">
                          <FaMinusCircle
                            className="lg:text-base 2xl:text-lg text-red-500"
                            onClick={() => handleDeleteMember(m._id)}
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default GroupSection;
