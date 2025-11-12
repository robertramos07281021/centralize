import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import Confirmation from "../../components/Confirmation";
import Pagination from "../../components/Pagination";
import Loading from "../Loading";
import {
  setPage,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice";
import { debounce } from "lodash";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

type AccountBucket = {
  name: string;
  dept: string;
};

type CustomerInfo = {
  fullName: string;
  dob: string;
  gender: string;
  contact_no: string;
  emails: string;
  addresses: string;
  _id: string;
};

type DispoType = {
  _id: string;
  name: string;
  code: string;
};

type Group = {
  _id: string;
  name: string;
  description?: string;
  members?: Member[];
};

type User = {
  _id: string;
  name: string;
  user_id: string;
};

type Assigned = Group | User;

type CustomerAccounts = {
  _id: string;
  dpd: number;
  assigned: Assigned;
  account_bucket: AccountBucket;
  customer_info: CustomerInfo;
  dispoType: DispoType;
};

type FindCustomerAccount = {
  CustomerAccounts: CustomerAccounts[];
  totalCountCustomerAccounts: string[];
};

const FIND_CUSTOMER_ACCOUNTS = gql`
  query findCustomerAccount($query: QueryCustomerAccount) {
    findCustomerAccount(query: $query) {
      CustomerAccounts {
        _id
        dpd
        assigned {
          ... on User {
            name
            user_id
          }
          ... on Group {
            _id
            name
            description
            members {
              _id
              name
              user_id
            }
          }
        }
        account_bucket {
          name
          dept
        }
        customer_info {
          fullName
          dob
          gender
          contact_no
          emails
          addresses
          _id
        }
        dispoType {
          _id
          name
          code
        }
      }
      totalCountCustomerAccounts
    }
  }
`;

const ADD_GROUP_TASK = gql`
  mutation Mutation($groupId: ID!, $task: [ID]) {
    addGroupTask(groupId: $groupId, task: $task) {
      message
      success
    }
  }
`;
type Member = {
  _id: string;
  name: string;
  user_id: string;
};

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
      }
    }
  }
`;
const DELETE_GROUP_TASK = gql`
  mutation Mutation($caIds: [ID]) {
    deleteGroupTask(caIds: $caIds) {
      message
      success
    }
  }
`;

type CADQueryValue = {
  disposition: string[];
  page: number;
  groupId: string;
  assigned: string;
  selectedBucket: string | null;
  dpd: number | null;
  limit: number;
};

type Props = {
  selectedBucket: string | null;
  dpd: number | null;
};

const TaskDispoSection: React.FC<Props> = ({ selectedBucket, dpd }) => {
  const {
    selectedGroup,
    selectedAgent,
    page,
    tasker,
    taskFilter,
    selectedDisposition,
    limit,
  } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isTaskManager = location.pathname.includes("tl-task-manager");
  const { data: GroupData, refetch: groupRefetch } = useQuery<{
    findGroup: Group[];
  }>(DEPT_GROUP, { skip: !isTaskManager, notifyOnNetworkStatusChange: true });
  const groupDataNewObject: { [key: string]: string } = useMemo(() => {
    const group = GroupData?.findGroup || [];
    return Object.fromEntries(group.map((e) => [e.name, e._id]));
  }, [GroupData]);
  const selected = selectedGroup
    ? groupDataNewObject[selectedGroup]
    : selectedAgent;

  const query: CADQueryValue = {
    disposition: selectedDisposition,
    page: page,
    groupId: selected,
    assigned: taskFilter,
    limit: limit,
    selectedBucket,
    dpd,
  };

  const {
    data: CustomerAccountsData,
    refetch: CADRefetch,
    loading,
  } = useQuery<{ findCustomerAccount: FindCustomerAccount }>(
    FIND_CUSTOMER_ACCOUNTS,
    {
      variables: { query: query },
      skip: !isTaskManager,
      notifyOnNetworkStatusChange: true,
    }
  );

  const debouncedSearch = useMemo(() => {
    return debounce(async (val: CADQueryValue) => {
      await CADRefetch({ query: val });
    }, 300);
  }, [CADRefetch]);

  useEffect(() => {
    if (selectedBucket) {
      debouncedSearch(query);
    }
  }, [selectedDisposition, page, taskFilter, selectedBucket, dpd]);

  const [handleCheckAll, setHandleCheckAll] = useState<boolean>(false);
  const [taskToAdd, setTaskToAdd] = useState<string[]>([]);
  const [required, setRequired] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<boolean>(false);
  const [taskManagerPage, setTaskManagerPage] = useState("1");

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedBucket) {
        await CADRefetch();
        await groupRefetch();
      }
    });
    return () => clearTimeout(timer);
  }, [selectedBucket, CADRefetch, groupRefetch]);

  useEffect(() => {
    setTaskManagerPage(page.toString());
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (selectedBucket) {
        await CADRefetch();
        setRequired(false);
        setTaskToAdd([]);
        setHandleCheckAll(false);
        setTaskManagerPage("1");
        dispatch(setPage(1));
      }
    });

    return () => clearTimeout(timer);
  }, [
    selectedGroup,
    tasker,
    taskFilter,
    selectedAgent,
    selectedDisposition,
    selectedBucket,
    dpd,
    CADRefetch,
  ]);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT" | "ADDED",
    yes: () => {},
    no: () => {},
  });

  const [deleteGroupTask] = useMutation(DELETE_GROUP_TASK, {
    onCompleted: async () => {
      try {
        const res = await CADRefetch();
        if (res.data) {
          dispatch(
            setSuccess({
              success: true,
              message: "Task successfully removed",
              isMessage: false,
            })
          );
        }
      } catch (error) {
        dispatch(setServerError(true));
      }

      setConfirm(false);
      setTaskToAdd([]);
      setHandleCheckAll(false);
      setRequired(false);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const handleClickDeleteGroupTaskButton = useCallback(() => {
    if (taskToAdd.length === 0) {
      setRequired(true);
    } else {
      setConfirm(true);
      setModalProps({
        message: `Remove this task?`,
        toggle: "DELETE",
        yes: async () => {
          await deleteGroupTask({ variables: { caIds: taskToAdd } });
        },
        no: () => {
          setConfirm(false);
        },
      });
    }
  }, [setRequired, setConfirm, setModalProps, deleteGroupTask, taskToAdd]);

  const handleSelectAllToAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newArray =
        CustomerAccountsData?.findCustomerAccount.totalCountCustomerAccounts.map(
          (e) => e.toString()
        );
      if (e.target.checked) {
        setTaskToAdd(newArray ?? []);
        setHandleCheckAll(true);
      } else {
        setHandleCheckAll(false);
        setTaskToAdd([]);
      }
    },
    [setTaskToAdd, CustomerAccountsData, setTaskToAdd]
  );

  const handleCheckBox = useCallback(
    (value: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const check = e.target.checked
        ? [...taskToAdd, value]
        : taskToAdd.filter((d) => d !== value);
      setTaskToAdd(check);
    },
    [setTaskToAdd, taskToAdd]
  );

  const [addGroupTask] = useMutation(ADD_GROUP_TASK, {
    onCompleted: async () => {
      await CADRefetch();
      setConfirm(false);
      setRequired(false);
      setTaskToAdd([]);
      setHandleCheckAll(false);
      dispatch(
        setSuccess({
          success: true,
          message: "Task successfully added",
          isMessage: false,
        })
      );
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const handleAddTask = useCallback(() => {
    if (taskToAdd.length === 0) {
      setRequired(true);
    } else {
      setRequired(false);
      setConfirm(true);
      setModalProps({
        message: `You assigning the task?`,
        toggle: "CREATE",
        yes: async () => {
          await addGroupTask({
            variables: { groupId: selected, task: taskToAdd },
          });
        },
        no: () => {
          setConfirm(false);
        },
      });
    }
  }, [taskToAdd, setModalProps, setConfirm, setRequired]);

  const pages = CustomerAccountsData?.findCustomerAccount
    ?.totalCountCustomerAccounts
    ? Math.ceil(
        CustomerAccountsData?.findCustomerAccount?.totalCountCustomerAccounts
          .length / limit
      )
    : 1;

  const valuePage =
    parseInt(taskManagerPage) > pages ? pages.toString() : taskManagerPage;


  if (loading) return <Loading />;

  return (
    <>
      <motion.div
        className="h-full w-full flex flex-col rounded-md shadow-2xl  px-5 py-2 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
      >
        {(selectedGroup || selectedAgent) && (
          <div
            className={`flex ${
              required ? "justify-between" : "justify-end"
            }  items-center`}
          >
            {required && (
              <div
                className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
                role="alert"
              >
                <span className="font-medium">No Item Selected!</span> Please
                add one or more task.
              </div>
            )}
            <div className="flex gap-2">
              {taskFilter !== "assigned" ? (
                <button
                  type="button"
                  className="focus:outline-none text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-black uppercase border-2 border-green-900 cursor-pointer rounded-md text-xs px-5 h-10 me-2 "
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
              ) : (
                <button
                  type="button"
                  className="focus:outline-none font-black text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 uppercase border-2 border-red-900 cursor-pointer rounded-md text-xs px-5 h-10 me-2"
                  onClick={handleClickDeleteGroupTaskButton}
                >
                  Remove task
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-800 border py-3 gap-8 px-6 items-center uppercase bg-gray-300 rounded-t-md dark:bg-gray-700 dark:text-gray-400 grid grid-cols-8 font-black mt-2">
          <div className=" col-span-2">Customer Name</div>
          <div className=" col-span-2">Current Disposition</div>
          <div className="">Bucket</div>
          <div className="">DPD</div>
          <div className="">Assigned</div>
          <div className="">Action</div>
        </div>
        <div className=" w-full h-full text-gray-500 flex flex-col overflow-y-auto rounded-b-md relative mb-2">
          {(selectedGroup || selectedAgent) && (
            <div className="bg-white flex border-b border-x rounded-b-md border-black hover:bg-blue-100 py-2 items-center text-xs justify-end sticky top-0">
              <label className=" flex cursor-pointer gap-1 justify-end px-2 ">
                <input
                  type="checkbox"
                  name="all"
                  id="all"
                  checked={handleCheckAll}
                  onChange={(e) => handleSelectAllToAdd(e)}
                  className={`${taskFilter === "assigned" && "accent-red-600"}  `}
                />
                <span className="font-black uppercase text-black">Select All</span>
              </label>
            </div>
          )}
          {CustomerAccountsData?.findCustomerAccount?.CustomerAccounts
            ?.length === 0 && (!selectedGroup || selectedAgent) ? (
            <div className="italic font-sans border-b border-x border-black shadow-md flex text-center justify-center w-full py-2 rounded-b-md bg-gray-100">
              No customer found.
            </div>
          ) : (
            <div>
              {CustomerAccountsData?.findCustomerAccount?.CustomerAccounts.map(
                (ca, index) => (
                  <motion.div
                    key={ca._id}
                    className="even:bg-gray-100 border-b last:rounded-b-md la st:shadow-md  border-x border-black cursor-default gap-10 bg-gray-200 hover:bg-gray-300 transition-all grid grid-cols-8 py-2 items-center text-sm px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className="font-medium col-span-2 truncate text-gray-900 whitespace-nowrap dark:text-white uppercase"
                      title={ca.customer_info.fullName}
                    >
                      {ca.customer_info.fullName}dsa
                    </div>
                    <div className="  col-span-2">
                      {ca.dispoType
                        ? ca.dispoType.code === "PAID"
                          ? `${ca.dispoType.code}`
                          : ca.dispoType.code
                        : "New Endorsed"}
                    </div>
                    <div className="">{ca.account_bucket.name}</div>
                    <div className="">
                      {ca.dpd || (
                        <div className="italic font-sans text-gray-400 text-xs">
                          No DPD
                        </div>
                      )}
                    </div>
                    <div className="">
                      {ca.assigned?.name || (
                        <div className="italic font-sans text-gray-400 text-xs">
                          No name assigned{" "}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      {(selectedGroup || selectedAgent) && (
                        <input
                          type="checkbox"
                          name={ca.customer_info.fullName}
                          id={ca.customer_info.fullName}
                          onChange={(e) => handleCheckBox(ca._id, e)}
                          checked={taskToAdd.includes(ca._id)}
                          className={`${
                            taskFilter === "assigned" && "accent-red-600"
                          }`}
                        />
                      )}
                    </div>
                  </motion.div>
                )
              )}
            </div>
          )}
        </div>
        <Pagination
          value={valuePage}
          onChangeValue={(e) => setTaskManagerPage(e)}
          onKeyDownValue={(e) => dispatch(setPage(e))}
          totalPage={pages}
          currentPage={page}
        />
      </motion.div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default TaskDispoSection;
