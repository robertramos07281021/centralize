import { gql, useMutation, useQuery } from "@apollo/client";
import { Link, useLocation } from "react-router-dom";
import { FaCircle } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import Pagination from "../../components/Pagination";
import {
  setAdminUsersPage,
  setServerError,
  setSuccess,
} from "../../redux/slices/authSlice";
import { BsFillUnlockFill, BsFillLockFill } from "react-icons/bs";
import { FaUserGear } from "react-icons/fa6";
import Confirmation from "../../components/Confirmation";
import { Department } from "../../middleware/types.ts";
import { motion, AnimatePresence } from "framer-motion";
import RegisterView from "./RegisterView.tsx";

type DeptBranchBucket = {
  _id: string;
  name: string;
};

const GET_DEPTS = gql`
  query getDepts {
    getDepts {
      id
      name
    }
  }
`;

const GET_BRANCHES = gql`
  query getBranches {
    getBranches {
      id
      name
    }
  }
`;

const GET_ALL_BUCKET = gql`
  query getAllBucket {
    getAllBucket {
      _id
      name
    }
  }
`;

const DELETE_USER = gql`
  mutation deleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

const FIND_QUERY = gql`
  query findUsers($search: String!, $page: Int!, $limit: Int!) {
    findUsers(search: $search, page: $page, limit: $limit) {
      total
      users {
        _id
        name
        username
        type
        departments
        branch
        isLock
        account_type
        change_password
        active
        callfile_id
        isOnline
        buckets
        createdAt
        user_id
        vici_id
      }
    }
  }
`;

type Users = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean;
  departments: string[];
  buckets: string[];
  isOnline: boolean;
  isLock: boolean;
  callfile_id: string;
  active: boolean;
  account_type: string;
  createdAt: string;
  user_id: string;
  vici_id: string;
};

const AccountsView = () => {
  const [page, setPage] = useState<string>("1");
  const [search, setSearch] = useState("");
  const dispatch = useAppDispatch();
  const { limit, adminUsersPage } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();
  const isAccounts = location.pathname.includes("accounts");
  const [create, setCreate] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);

  const { data: getDeptData, refetch: deptRefetch } = useQuery<{
    getDepts: Department[];
  }>(GET_DEPTS, { skip: !isAccounts, notifyOnNetworkStatusChange: true });

  const { data: getBranchData, refetch: branchRefetch } = useQuery<{
    getBranches: DeptBranchBucket[];
  }>(GET_BRANCHES, { skip: !isAccounts, notifyOnNetworkStatusChange: true });

  const { data: getAllBucketsData, refetch: bucketRefetch } = useQuery<{
    getAllBucket: DeptBranchBucket[];
  }>(GET_ALL_BUCKET, { skip: !isAccounts, notifyOnNetworkStatusChange: true });

  const [totalPage, setTotalPage] = useState<number>(1);

  const deptObject: { [key: string]: string } = useMemo(() => {
    const deptData = getDeptData?.getDepts || [];
    return Object.fromEntries(deptData.map((db) => [db.id, db.name]));
  }, [getDeptData]);

  const bucketObject: { [key: string]: string } = useMemo(() => {
    const allBucketData = getAllBucketsData?.getAllBucket || [];
    return Object.fromEntries(allBucketData.map((adb) => [adb._id, adb.name]));
  }, [getAllBucketsData]);

  const branchObject: { [key: string]: string } = useMemo(() => {
    const branchData = getBranchData?.getBranches || [];
    return Object.fromEntries(branchData.map((bd) => [bd._id, bd.name]));
  }, [getBranchData]);

  const { data: searchData, refetch } = useQuery<{
    findUsers: { users: Users[]; total: number };
  }>(FIND_QUERY, { variables: { search, page: adminUsersPage, limit } });

  const users = searchData?.findUsers.users || [];

  const [confirm, setConfirm] = useState<boolean>(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "DELETE" as "DELETE",
    yes: () => {},
    no: () => {},
  });

  const [deleteUser] = useMutation<{
    deleteUser: { success: boolean; message: string };
  }>(DELETE_USER, {
    onCompleted: async (result) => {
      setSearch("");
      const res = await refetch();
      if (res.data) {
        dispatch(
          setSuccess({
            success: result.deleteUser.success,
            message: result.deleteUser.message,
            isMessage: false,
          })
        );
      }
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const onClickDelete = useCallback(
    (user: Users) => {
      setConfirm(true);
      setModalProps({
        message: `Do you want to delete ${user.name} account`,
        toggle: "DELETE",
        yes: async () => {
          await deleteUser({ variables: { id: user._id } });
          setConfirm(false);
        },
        no: () => {
          setConfirm(false);
        },
      });
    },
    [setConfirm, setModalProps]
  );

  useEffect(() => {
    setPage(adminUsersPage.toString());
  }, [adminUsersPage]);

  useEffect(() => {
    if (searchData) {
      const searchExistingPages = Math.ceil(
        (searchData?.findUsers.total || 1) / limit
      );
      setTotalPage(searchExistingPages);
    }
  }, [searchData]);

  useEffect(() => {
    const timer = async () => {
      await refetch();
      await deptRefetch();
      await branchRefetch();
      await bucketRefetch();
    };
    timer();
  }, []);

  return (
    <>
      <div className="h-full relative flex flex-col overflow-hidden p-2">
        <div className=" flex justify-between  items-center p-3">
          <h1 className="text-2xl text-gray-500 uppercase font-black">
            Accounts
          </h1>
          <div className="flex gap-3 h-full">
            <motion.div
              className="h-full flex rounded-md shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              <label className="flex border h-full border-slate-500 rounded-md">
                <div className=" inset-y-0 start-0 flex items-center px-2 pointer-events-none">
                  <CiSearch />
                </div>
                <input
                  type="search"
                  id="default-search"
                  name="default-search"
                  autoComplete="off"
                  value={search}
                  className=" w-full focus:outline-none"
                  placeholder="Search . . ."
                  onChange={(e) => {
                    setSearch(e.target.value);
                    dispatch(setAdminUsersPage(1));
                    setPage(adminUsersPage.toString());
                  }}
                  required
                />
              </label>
            </motion.div>

            <motion.div
              onClick={() => setCreate(true)}
              className="focus:outline-none shadow-md font-black text-white bg-green-500   hover:bg-green-600 focus:ring-4 focus:ring-green-300 uppercase rounded-lg text-sm px-5 py-2.5 me-2  dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 border-2 border-green-800 cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
            >
              Create Account
            </motion.div>
          </div>
        </div>
        <div className="flex justify-center "></div>

        <motion.div
          className=" h-full overflow-y-hidden flex flex-col mx-3 "
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className=" rounded-t-md pr-3 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 grid grid-cols-12 py-2 font-black uppercase">
            <div className="col-span-2 px-2">Name</div>
            <div>Username</div>
            <div>SIP ID</div>
            <div>Type</div>
            <div>Branch</div>
            <div>Campaign</div>
            <div>Bucket</div>
            <div className="text-center">Active</div>
            <div className="text-center">Online</div>
            <div className="text-center">Lock</div>
            <div></div>
          </div>
          <div className="overflow-y-auto">
            {users?.map((user, index) => (
              <motion.div
                key={user._id}
                className="grid grid-cols-12 py-2 hover:bg-blue-50 even:bg-gray-100 cursor-default items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="font-medium px-2 text-gray-700 whitespace-nowrap dark:text-white truncate col-span-2"
                  title={user.name.toUpperCase()}
                >
                  {user.name.toUpperCase()}
                </div>
                <div className="truncate">{user.username}</div>
                <div>{user.user_id || "-"}</div>
                <div>{user.type || "-"}</div>
                <div>{branchObject[user.branch] || "-"}</div>
                <div
                  className="pr-5 truncate"
                  title={user.departments
                    ?.map((e) => deptObject[e]?.toString())
                    .join(", ")}
                >
                  {user.departments
                    ?.map((e) => deptObject[e]?.toString())
                    .join(", ") || "-"}
                </div>
                <div
                  className="pr-5 truncate"
                  title={user.buckets
                    ?.map((b) => bucketObject[b]?.toString())
                    .join(", ")}
                >
                  {user.buckets
                    ?.map((b) => bucketObject[b]?.toString())
                    .join(", ") || "-"}
                </div>
                <div className="flex items-center justify-center h-full">
                  <FaCircle
                    className={`${
                      user.active
                        ? "text-green-500 w-5 h-5 animate-pulse"
                        : "text-red-700 w-5 h-5 "
                    } `}
                  />
                </div>
                <div className="flex items-center justify-center h-full">
                  {user.isOnline ? (
                    <div className=" shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                  ) : (
                    <div className=" shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                  )}
                </div>
                <div className="flex items-center justify-center h-full">
                  {user.isLock ? (
                    <div className=" bg-red-700 cursor-pointer hover:bg-red-800 shadow-md h-full  px-2 py-1 border-2  rounded-sm border-red-900 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className=" bg-green-700 cursor-pointer hover:bg-green-800 shadow-md h-full  px-2 py-1 border-2  rounded-sm border-green-900 text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex justify-center items-center gap-2">
                  <Link
                    to="/user-account"
                    state={user}
                    className="font-medium bg-blue-700 hover:bg-blue-800 border-2 border-blue-900 rounded-sm px-2 py-1 text-blue-600 dark:text-blue-500 hover:underline relative"
                  >
                    <FaUserGear className="text-xl text-white " title="View" />
                  </Link>

                  <div className="items-center flex ">
                    <div
                      onClick={() => onClickDelete(user)}
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
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="">
          <Pagination
            value={page}
            onChangeValue={(e) => setPage(e)}
            onKeyDownValue={(e) => dispatch(setAdminUsersPage(e))}
            totalPage={totalPage}
            currentPage={adminUsersPage}
          />
        </div>
        <AnimatePresence>
          {create && (
            <div className="absolute flex z-10 top-0 justify-center items-center left-0 w-full h-full">
              <motion.div
                onClick={() => setCreate(false)}
                className="bg-[#00000050] cursor-pointer relative flex z-10 backdrop-blur-sm w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              ></motion.div>
              <motion.div
                className="absolute flex justify-center items-center z-20 bg-[#fff] p-2 rounded-md  "
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <RegisterView />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {updateModal && (
            <div className="absolute flex z-10 top-0 justify-center items-center left-0 w-full h-full">
              <motion.div
                onClick={() => setCreate(false)}
                className="bg-[#00000050] cursor-pointer relative flex z-10 backdrop-blur-sm w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              ></motion.div>
              <motion.div
                className="absolute flex justify-center items-center z-20 bg-[#fff] p-2 rounded-md  "
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <RegisterView />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {confirm && <Confirmation {...modalProps} />}
      </AnimatePresence>
    </>
  );
};

export default AccountsView;
