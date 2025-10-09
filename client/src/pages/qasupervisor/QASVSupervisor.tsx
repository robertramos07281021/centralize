import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gql, useMutation, useQuery } from "@apollo/client";
import { VscLoading } from "react-icons/vsc";
import Confirmation from "../../components/Confirmation.tsx";
import { useAppDispatch } from "../../redux/store.ts";
import { setServerError, setSuccess } from "../../redux/slices/authSlice.ts";
import Loading from "../Loading.tsx";

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
        type
        buckets
        departments
      }
      total
    }
  }
`;

const GET_DEPARTMENT_BUCKET = gql`
  query GetDepartmentBucket($depts: [ID]) {
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

const QASupervisorView = () => {
  const dispatch = useAppDispatch();
  const [update, setUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<ForUpdate>({
    userId: null,
    departments: [],
    buckets: [],
  });

  const { data: deptData } = useQuery<{
    getDepts: { id: string; name: string; branch: string }[];
  }>(GET_ALL_DEPTS);

  const { data: bucketData } = useQuery<{
    getAllBucket: { _id: string; name: string; branch: string }[];
  }>(GET_ALL_BUCKETS);

  const {
    data: deptBucketData,
    refetch: deptBucketRefetch,
    loading,
  } = useQuery<{
    getDepartmentBucket: Bucket[];
  }>(GET_DEPARTMENT_BUCKET, {
    variables: {
      depts: userId.departments,
      skip: userId?.departments?.length < 1,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await deptBucketRefetch();
    };

    if (userId.departments.length > 0) {
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
    variables: { page: 1, limit: 10 },
  });

  useEffect(() => {
    const refetching = async () => {
      await usersRefetch();
    };
    refetching();
  }, []);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "UPDATE" as "UPDATE",
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
    onError: (error) => {
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

  if (usersLoading || updateLoading) return <Loading />;

  return (
    <>
      <div className="relative w-full h-full">
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
        <div className="flex pt-4 px-5 justify-end">
          <div className="flex px-2 py-1 rounded-md shadow-md items-center border">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="size-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
            <input
              className="px-3 focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="p-5  overflow-hidden">
          <div className="grid grid-cols-9 gap-3 px-2 py-2 rounded-t-md font-black uppercase bg-gray-300">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Campaign</div>
            <div className="col-span-4">buckets</div>
            <div className="col-span-1">Actions</div>
          </div>
          <div className="flex  flex-col">
            {usersData?.getQAUsers?.users
              ?.filter((user) => {
                const term = searchTerm.toLowerCase();

                const nameMatch = user.name.toLowerCase().includes(term);

                const deptMatch = user.departments
                  .map((id) => newDeptMap[id]?.toLowerCase() || "")
                  .some((dept) => dept.includes(term));

                const bucketMatch = user.buckets
                  .map((id) => newBucketMap[id]?.toLowerCase() || "")
                  .some((bucket) => bucket.includes(term));

                return nameMatch || deptMatch || bucketMatch;
              })
              .map((user, index) => (
                <motion.div
                  key={user._id}
                  className="grid grid-cols-9 gap-3 items-center bg-gray-100 py-2 px-2 even:bg-gray-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="col-span-2 first-letter:uppercase">
                    {user.name}
                  </div>
                  <div className="col-span-2">
                    {user.departments
                      .map((dept) => newDeptMap[dept])
                      .join(", ")}
                  </div>
                  <div className="col-span-4">
                    {user.buckets
                      .map((bucket) => newBucketMap[bucket])
                      .join(", ")}
                  </div>

                  <div className="col-span-1 flex">
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
              ))}
          </div>
        </div>
        <AnimatePresence>
          {update && (
            <div className="absolute top-0  left-0 flex justify-center items-center w-full h-full overflow-hidden">
              <motion.div
                className="w-full h-full overflow-hidden bg-[#00000050] backdrop-blur-sm relative z-10 cursor-pointer "
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
                className="bg-white absolute z-20 h-9/10 w-4/10 p-10 overflow-hidden flex flex-col rounded-md shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <div className="text-xl uppercase text-center pb-2 font-black">
                  Select the campaign and buckets
                </div>
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
                <div className="grid grid-cols-2 font-semibold">
                  <div className="text-center">Campaign</div>

                  <div className="text-center">Buckets</div>
                </div>
                <div className="flex flex-col h-full  overflow-hidden relative">
                  <div className="grid grid-cols-2 gap-3 h-full overflow-hidden">
                    <div className="overflow-auto flex flex-col gap-0">
                      {deptData?.getDepts?.map((dept) => {
                        return (
                          dept.name !== "ADMIN" && (
                            <label
                              key={dept.id}
                              className="flex gap-2 items-center"
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
                        <div className="text-gray-500 text-center mt-2 italic">
                          No campaign selected
                        </div>
                      ) : (
                        <div className="flex  flex-col h-full overflow-auto gap-x-3 py-2 ">
                          {deptBucketData?.getDepartmentBucket?.map(
                            (bucket) => (
                              <label
                                key={bucket._id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  id={bucket._id}
                                  checked={userId.buckets.includes(bucket._id)}
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
                    className="bg-blue-500  flex gap-2 items-center shadow-md border-2 border-blue-800 font-black text-blue-800  uppercase cursor-pointer hover:bg-blue-600 transition-all px-4 py-2 rounded-lg"
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      {confirm && <Confirmation {...modalProps} />}
    </>
  );
};

export default QASupervisorView;
