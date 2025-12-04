import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gql, useMutation, useQuery } from "@apollo/client";
import { VscLoading } from "react-icons/vsc";
import Confirmation from "../../components/Confirmation.tsx";
import { RootState, useAppDispatch } from "../../redux/store.ts";
import {
  setAdminUsersPage,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice.ts";
import Loading from "../Loading.tsx";
import Pagination from "../../components/Pagination.tsx";
import { useSelector } from "react-redux";

const GET_ALL_DEPTS = gql`
  query getDepts {
    getDepts {
      id
      name
      branch
    }
  }
`;

const GET_ALL_BUCKETS = gql`
  query GetAllBucket {
    getAllBucket {
      _id
      name
      dept
    }
  }
`;

const GET_USERS = gql`
  query getQAUsers($page: Int!, $limit: Int!) {
    getQAUsers(page: $page, limit: $limit) {
      users {
        _id
        name
        active
        type
        buckets
        isOnline
        isLock
        departments
      }
      total
    }
  }
`;

const GET_DEPARTMENT_BUCKET = gql`
  query getDepartmentBucket($depts: [ID]) {
    getDepartmentBucket(depts: $depts) {
      _id
      name
    }
  }
`;

const UPDATE_QA_USER = gql`
  mutation updateQAUser($input: UpdateQAInput) {
    updateQAUser(input: $input) {
      success
      message
    }
  }
`;

const UNLOCK_USER = gql`
  mutation unlockUser($id: ID!) {
    unlockUser(id: $id) {
      message
      success
      user {
        name
      }
    }
  }
`;

const SCORE_CARD_ITEMS = [
  "Default Score Card",
  "UB CARDS Score Card",
  "EASTWEST Score Card",
  "UB MORTGAGE Score Card",
];

type Bucket = {
  _id: string;
  name: string;
};

type User = {
  _id: string;
  name: string;
  buckets: string[];
  departments: string[];
  type: string;
  active: boolean;
  isOnline: boolean;
  isLock: boolean;
};

type GetUser = {
  users: User[];
  total: number;
};

type ForUpdate = {
  userId: User | null;
  departments: string[];
  buckets: string[];
};

type SuccessUpdate = {
  user: User;
  success: boolean;
  message: string;
};

const QASupervisorView = () => {
  const { adminUsersPage, limit } = useSelector((state: RootState) => state.auth);

  const dispatch = useAppDispatch();
  const [update, setUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<ForUpdate>({
    userId: null,
    departments: [],
    buckets: [],
  });
  const [option, setOption] = useState(0);
  const [width, setWidth] = useState(50);
  const [activeScoreCardUserId, setActiveScoreCardUserId] = useState<
    string | null
  >(null);
  const [scoreCardSelections, setScoreCardSelections] = useState<
    Record<string, string>
  >({});
  const scoreCardDropdownRefs = useRef<Record<string, HTMLDivElement | null>>(
    {}
  );
  const [page, setPage] = useState<string>("1");
  const [totalPage, setTotalPage] = useState<number>(1);

  const { data: deptData } = useQuery<{
    getDepts: { id: string; name: string; branch: string }[];
  }>(GET_ALL_DEPTS, { notifyOnNetworkStatusChange: true });

  const { data: bucketData } = useQuery<{
    getAllBucket: { _id: string; name: string; branch: string }[];
  }>(GET_ALL_BUCKETS, { notifyOnNetworkStatusChange: true });

  useEffect(() => {
    if (userId) {
      if (userId?.userId) {
        setUserId((prev) => ({
          ...prev,
          departments: userId?.userId?.departments ?? [],
          buckets: userId?.userId?.buckets ?? [],
        }));
      }
    }
  }, [userId?.userId]);

  const deptVariables = useMemo(() => ({ depts: userId?.departments }), [userId?.departments]);

  const {
    data: deptBucketData,
    refetch: deptBucketRefetch,
    loading,
  } = useQuery<{
    getDepartmentBucket: Bucket[];
  }>(GET_DEPARTMENT_BUCKET, {
    variables: {
      deptVariables,
    },
    skip: !userId?.userId,
    notifyOnNetworkStatusChange: true,
  });
  useEffect(() => {
    const refetching = async () => {
      await deptBucketRefetch();
    };

    if (userId?.userId) {
      refetching();
    }
  }, [userId.departments]);

  const newBucketMap = useMemo(() => {
    const data = bucketData?.getAllBucket || [];
    return Object.fromEntries(data.map((d) => [d._id, d.name]));
  }, [bucketData]);

  const newDeptMap = useMemo(() => {
    const data = deptData?.getDepts || [];
    return Object.fromEntries(data.map((d) => [d.id, d.name]));
  }, [deptData]);

  const {
    data: usersData,
    refetch: usersRefetch,
    loading: usersLoading,
  } = useQuery<{
    getQAUsers: GetUser;
  }>(GET_USERS, {
    variables: { page: 1, limit: limit },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (usersData) {
      const searchExistingPages = Math.ceil(
        (usersData?.getQAUsers.total || 1) / limit
      );
      setTotalPage(searchExistingPages);
    }
  }, [usersData]);


  useEffect(() => {
    const refetching = async () => {
      await usersRefetch();
      await deptBucketRefetch();
    };
    refetching();
  }, []);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "UPDATE" as "UPDATE" | "CREATE",
    yes: () => {},
    no: () => {},
  });
  const [confirm, setConfirm] = useState<boolean>(false);

  const [updateQAUser, { loading: updateLoading }] = useMutation<{
    updateQAUser: { success: boolean; message: string };
  }>(UPDATE_QA_USER, {
    onCompleted: async (data) => {
      dispatch(
        setSuccess({
          success: data.updateQAUser.success,
          message: data.updateQAUser.message,
          isMessage: false,
        })
      );
      setModalProps({
        message: "",
        toggle: "UPDATE" as "UPDATE",
        yes: () => {},
        no: () => {},
      });
      setConfirm(false);
      setRequired(false);
      setUserId({
        userId: null,
        departments: [],
        buckets: [],
      });
      setUpdate(false);
      await usersRefetch();
    },
    onError: () => {
      setModalProps({
        message: "",
        toggle: "UPDATE" as "UPDATE",
        yes: () => {},
        no: () => {},
      });
      setConfirm(false);
      setRequired(false);
      setUserId({
        userId: null,
        departments: [],
        buckets: [],
      });
      setUpdate(false);
      dispatch(setServerError(true));
    },
  });

  const [required, setRequired] = useState<boolean>(false);

  useEffect(() => {
    if (!activeScoreCardUserId) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const dropdownNode = scoreCardDropdownRefs.current[activeScoreCardUserId];
      if (dropdownNode && !dropdownNode.contains(event.target as Node)) {
        setActiveScoreCardUserId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeScoreCardUserId]);

  const handleUpdateUser = useCallback(() => {
    if (
      !userId.userId ||
      userId.departments.length <= 0 ||
      userId.buckets.length <= 0
    ) {
      setRequired(true);
    } else {
      setConfirm(true);
      setRequired(false);
      setModalProps({
        message: "Are you sure you want to update user?",
        toggle: "UPDATE",
        yes: async () => {
          await updateQAUser({
            variables: {
              input: {
                userId: userId?.userId?._id,
                departments: userId.departments,
                buckets: userId.buckets,
              },
            },
          });
          setConfirm(false);
        },
        no: () => setConfirm(false),
      });
    }
  }, [userId, setModalProps, setRequired, updateQAUser, setConfirm]);

  const [unlockUser] = useMutation<{ unlockUser: SuccessUpdate }>(UNLOCK_USER, {
    onCompleted: async (res) => {
      const result = await usersRefetch();
      if (result.data) {
        dispatch(
          setSuccess({
            success: res.unlockUser.success,
            message: res.unlockUser.message,
            isMessage: false,
          })
        );
      }
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const handleUnlockUser = useCallback(
    async (id: string) => {
      setConfirm(true);
      setModalProps({
        message: `Do you want to unlock this user?`,
        toggle: "CREATE",
        yes: async () => {
          await unlockUser({ variables: { id: id } });
          setConfirm(false);
        },
        no: () => {
          setConfirm(false);
        },
      });
    },
    [setModalProps, setConfirm, unlockUser]
  );

  const handleScoreCardSelect = (id: string, scoreCard: string) => {
    setScoreCardSelections((prev) => ({
      ...prev,
      [id]: scoreCard,
    }));
    setActiveScoreCardUserId(null);
  };

  if (usersLoading || updateLoading) return <Loading />;

  const filteredUsers =
    usersData?.getQAUsers?.users
      ?.filter((user) => {
        if (option === 50) return user.isOnline;
        if (option === 95) return !user.isOnline;
        return true;
      })
      ?.filter((user) => {
        if (!searchTerm.trim()) return true;

        const lowerSearch = searchTerm.toLowerCase();

        const nameMatch = user.name.toLowerCase().includes(lowerSearch);

        const departmentMatch = user.departments
          .map((deptId) => newDeptMap[deptId]?.toLowerCase() || "")
          .some((deptName) => deptName.includes(lowerSearch));

        const bucketMatch = user.buckets
          .map((bucketId) => newBucketMap[bucketId]?.toLowerCase() || "")
          .some((bucketName) => bucketName.includes(lowerSearch));

        return nameMatch || departmentMatch || bucketMatch;
      }) || [];

  return (
    <div className="h-full relative overflow-hidden">
      <div className=" w-full h-full flex flex-col px-5 pt-5">
        {/* <div className="px-5 flex justify-end pt-4">
          <select
            name="campaign"
            id="campaign"
            className="px-6 text-center border border-slate-500 rounded py-1.5"
          >
            <option value="">Selecte Campaign</option>
            <option>dsa</option>
          </select>
        </div> */}
        <div className="flex justify-between">
          <div className="uppercase text-2xl font-black">QA Account</div>
          <div className="flex items-center gap-3">
            <div>
              <motion.div
                className="bg-white flex-row relative border-2 border-gray-500 overflow-hidden px-4 py-1 rounded-full flex gap-6 text-gray-400 font-black uppercase items-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div
                  onClick={() => {
                    setOption(0);
                    setWidth(50);
                  }}
                  className={`" ${
                    option === 0 ? "text-gray-500" : " text-gray-400"
                  } transition-all text-xs z-20  cursor-pointer "`}
                >
                  ALL
                </div>
                <div
                  onClick={() => {
                    setOption(50);
                    setWidth(45);
                  }}
                  className={`"  ${
                    option === 50 ? "text-green-600" : " text-gray-400"
                  } transition-all cursor-pointer  z-20 text-green-500 "`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
                      clipRule="evenodd"
                    />
                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                  </svg>
                </div>
                <div
                  onClick={() => {
                    setOption(95);
                    setWidth(50);
                  }}
                  className={`" ${
                    option === 95 ? "text-red-600" : " text-red-500"
                  } transition-all cursor-pointer z-20  "`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
                      clipRule="evenodd"
                    />
                    <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
                  </svg>
                </div>
                <motion.div
                  className={`" ${
                    option === 50
                      ? "bg-green-200"
                      : option === 95
                      ? "bg-red-200"
                      : "bg-gray-200"
                  } absolute z-10 top-0 overflow-hidden left-0 h-full flex items-center justify-center "`}
                  initial={{ x: 0, width: 50 }}
                  animate={{ x: option, width: width }}
                  transition={{ duration: 0.6, type: "spring" }}
                ></motion.div>
              </motion.div>
            </div>
            <div className="flex px-2 py-1 rounded-md shadow-md items-center border ">
              <div>
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
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <input
                className="px-3 py-1 focus:outline-none"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <motion.div
          className="  flex flex-col overflow-hidden mt-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid shadow-md border rounded-t-md bg-gray-300  grid-cols-8 gap-3 px-2 py-2 font-black uppercase ">
            <div
              className="
            "
            >
              Name
            </div>
            <div className="">Campaign</div>
            <div className="">buckets</div>
            <div className="flex justify-center">activity</div>
            <div className="flex justify-center">online</div>
            <div className="flex justify-center">Score card</div>

            <div className="flex justify-center">lock</div>

            <div className="flex justify-center"></div>
          </div>
          <div className="flex  flex-col overflow-auto h-full rounded-b-md">
            {filteredUsers?.length === 0 ? (
              <motion.div
                className="flex justify-center italic items-center text-gray-300 font-bold h-[200px] text-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No accounts found.
              </motion.div>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  className="grid grid-cols-8 hover:bg-gray-300 border-x border-b last:rounded-b-md gap-3 items-center bg-gray-100 py-2 pl-2 text-sm odd:bg-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className=" first-letter:uppercase">{user.name}</div>
                  <div
                    className="truncate"
                    title={user.departments
                      .map((dept) => newDeptMap[dept])
                      .join(", ")}
                  >
                    {user.departments
                      .map((dept) => newDeptMap[dept])
                      .join(", ") || (
                      <div className="italic text-gray-400 text-xs">
                        No campaign
                      </div>
                    )}
                  </div>
                  <div
                    className="truncate"
                    title={user.buckets
                      .map((bucket) => newBucketMap[bucket])
                      .join(", ")}
                  >
                    {user.buckets
                      .map((bucket) => newBucketMap[bucket])
                      .join(", ") || (
                      <div className="italic text-gray-400 text-xs">
                        No bucket
                      </div>
                    )}
                  </div>
                  <div className="justify-center flex">
                    {user.active ? (
                      <div className="shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                    ) : (
                      <div className="shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {user.isOnline ? (
                      <div className="shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                    ) : (
                      <div className="shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                    )}
                  </div>
                  <div
                    className="border border-black flex px-3 justify-between items-center rounded-sm cursor-pointer hover:bg-gray-200 bg-gray-100 shadow-md py-1 relative"
                    ref={(node) => {
                      scoreCardDropdownRefs.current[user._id] = node;
                    }}
                  >
                    <button
                      type="button"
                      className="w-full flex cursor-pointer  justify-between items-center gap-2"
                      onClick={() =>
                        setActiveScoreCardUserId((prev) =>
                          prev === user._id ? null : user._id
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActiveScoreCardUserId((prev) =>
                            prev === user._id ? null : user._id
                          );
                        }
                      }}
                      aria-haspopup="listbox"
                      aria-expanded={activeScoreCardUserId === user._id}
                    >
                      <div className="rounded-sm text-left truncate outline-none">
                        {scoreCardSelections[user._id] || SCORE_CARD_ITEMS[0]}
                      </div>
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="3"
                          stroke="currentColor"
                          className={`size-4 transition-transform ${
                            activeScoreCardUserId === user._id
                              ? "rotate-90"
                              : ""
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </div>
                    </button>
                    <AnimatePresence>
                      {activeScoreCardUserId === user._id && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-full rounded-sm overflow-hidden border border-black bg-white shadow-lg z-10"
                          role="listbox"
                        >
                          {SCORE_CARD_ITEMS.map((item) => (
                            <button
                              type="button"
                              key={item}
                              className="w-full even:bg-gray-100 truncate odd:bg-gray-200 text-left px-3 py-2 text-sm cursor-pointer hover:bg-gray-300 border-b last:border-b-0"
                              onClick={() =>
                                handleScoreCardSelect(user._id, item)
                              }
                              role="option"
                              aria-selected={
                                scoreCardSelections[user._id] === item
                              }
                            >
                              {item}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="justify-center flex">
                    {user.isLock ? (
                      <div
                        className="bg-red-500 px-2 border-2 rounded-sm border-red-800 shadow-md cursor-pointer hover:bg-red-600 transition-all text-white py-1"
                        onClick={() => handleUnlockUser(user._id)}
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
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-gray-300 px-2 border-2 rounded-sm border-gray-400 transition-all text-gray-400 py-1">
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
                            d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <div
                      onClick={() => {
                        setUpdate(true);
                        setUserId((prev) => ({ ...prev, userId: user }));
                      }}
                      className="bg-blue-500 text-white border-2 cursor-pointer border-blue-800 rounded-sm px-2 py-1 hover:bg-blue-600"
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
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
        <AnimatePresence>
          {update && (
            <div className="absolute top-0 z-20 left-0 flex flex-col justify-center items-center w-full h-full overflow-hidden">
              <motion.div
                className="w-full flex h-full overflow-hidden bg-[#00000050] backdrop-blur-sm relative z-10 cursor-pointer "
                onClick={() => {
                  setUpdate(false);
                  setUserId({
                    userId: null,
                    departments: [],
                    buckets: [],
                  });
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              ></motion.div>
              <motion.div
                className="bg-white absolute border z-20 h-9/10 w-6/10 overflow-hidden flex flex-col rounded-md shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <div className="bg-gray-400 px-10 py-1 border-b border-black">
                  <div className="text-xl lg:text-3xl uppercase text-center font-black">
                    Select the campaign and buckets
                  </div>
                  <h1 className="text-center capitalize font-sans text-black  font-normal text-sm lg:text-md ">
                    Username: {userId.userId?.name}
                  </h1>
                </div>

                <div className="p-5 flex flex-col max-h-[90%]">
                  {required && (
                    <h1 className="text-center text-sm text-red-500">
                      {userId.departments.length <= 0 &&
                        userId.buckets.length > 0 &&
                        "Please select Department"}
                      {userId.departments.length > 0 &&
                        userId.buckets.length <= 0 &&
                        "Please select Buckets"}
                      {userId.departments.length <= 0 &&
                        userId.buckets.length <= 0 &&
                        "Please select Department and Bucket"}
                    </h1>
                  )}
                  <div className="grid grid-cols-2 gap-3 lg:text-xl font-semibold">
                    <div className="text-center border py-1 bg-gray-400 rounded-t-md font-black uppercase">
                      Campaign
                    </div>

                    <div className="text-center border py-1 bg-gray-400 rounded-t-md font-black uppercase">
                      Buckets
                    </div>
                  </div>
                  <div className="flex flex-col h-full  overflow-hidden relative">
                    <div className="grid grid-cols-2 gap-3 text-sm lg:text-lg h-full overflow-hidden">
                      <div className="flex border-x border-b rounded-b-sm p-2 bg-gray-200 flex-col gap-1 h-full overflow-auto gap-x-3 py-2 ">
                        {deptData?.getDepts?.map((dept) => {
                          return (
                            dept.name !== "ADMIN" && (
                              <label
                                key={dept.id}
                                className="flex bg-gray-100 cursor-pointer border px-3 rounded-sm hover:bg-gray-300 transition-all gap-2 items-center"
                              >
                                <input
                                  type="checkbox"
                                  id={dept.id}
                                  checked={userId.departments.includes(dept.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setUserId((prev) => ({
                                      ...prev,
                                      departments: checked
                                        ? [...prev.departments, dept.id]
                                        : prev.departments.filter(
                                            (id) => id !== dept.id
                                          ),
                                    }));
                                  }}
                                />

                                <label htmlFor={dept.id} className="capitalize">
                                  {dept.name.replace(/_/g, " ")}
                                </label>
                              </label>
                            )
                          );
                        })}
                      </div>
                      <div className="overflow-hidden h-full flex-col">
                        {loading ? (
                          <div className="h-full flex items-center justify-center">
                            <VscLoading className="animate-spin text-5xl" />
                          </div>
                        ) : userId.departments.length === 0 ? (
                          <div className="text-gray-500 border-black border-x border-b rounded-b-md text-sm text-center py-2 italic">
                            No campaign selected
                          </div>
                        ) : (
                          <div className="flex border-x border-b rounded-b-sm p-2 bg-gray-200 flex-col gap-1 h-full overflow-auto gap-x-3 py-2 ">
                            {deptBucketData?.getDepartmentBucket?.map(
                              (bucket) => (
                                <label
                                  key={bucket._id}
                                  className="flex bg-gray-100 cursor-pointer hover:bg-gray-300 transition-all border px-3 rounded-sm items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    id={bucket._id}
                                    checked={userId.buckets.includes(
                                      bucket._id
                                    )}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setUserId((prev) => ({
                                        ...prev,
                                        buckets: checked
                                          ? [...prev.buckets, bucket._id]
                                          : prev.buckets.filter(
                                              (id) => id !== bucket._id
                                            ),
                                      }));
                                    }}
                                  />
                                  <label htmlFor={bucket._id}>
                                    {bucket.name}
                                  </label>
                                </label>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className=" flex justify-end items-end mt-3">
                    <div
                      className="bg-blue-500  flex gap-2 items-center shadow-md border-2 border-blue-800 font-black text-white  uppercase cursor-pointer hover:bg-blue-600 transition-all px-4 py-2 rounded-lg"
                      onClick={handleUpdateUser}
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
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                      </svg>
                      Update
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Pagination
          value={page}
          onChangeValue={(e) => setPage(e)}
          onKeyDownValue={(e) => dispatch(setAdminUsersPage(e))}
          totalPage={totalPage}
          currentPage={adminUsersPage}
        />
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </div>
  );
};

export default QASupervisorView;
