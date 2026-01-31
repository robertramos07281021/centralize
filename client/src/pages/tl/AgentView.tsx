import { useMutation, useQuery, useSubscription } from "@apollo/client";
import gql from "graphql-tag";
import { useCallback, useEffect, useState } from "react";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import AuthenticationPass from "../../components/AuthenticationPass";
import { RootState } from "../../redux/store";
import SetTargetsModal from "./SetTargetsModal";
import SetBucketTargetsModal from "./SetBucketTargetsModal";
import { motion } from "framer-motion";

const TL_AGENT = gql`
  query findDeptAgents {
    findDeptAgents {
      _id
      name
      user_id
      type
      isOnline
      isLock
      active
      attempt_login
      callfile_id
      vici_id
      buckets {
        name
      }
      departments {
        name
      }
      targets {
        daily
        weekly
        monthly
      }
      customer {
        fullName
      }
    }
  }
`;

type Bucket = {
  name: string;
};

type Department = {
  name: string;
};

type Target = {
  daily: number;
  weekly: number;
  monthly: number;
};

type Customer = {
  fullName: string;
};

type TLAgent = {
  _id: string;
  name: string;
  user_id: string;
  type: string;
  isOnline: boolean;
  isLock: boolean;
  active: boolean;
  attempt_login: number;
  callfile_id: string;
  buckets: Bucket[];
  departments: Department[];
  targets?: Target;
  vici_id: string;
  customer: Customer;
};

const AGENT_PRODUCTION = gql`
  query getAgentProductions {
    getAgentProductions {
      _id
      user
      prod_history {
        type
        existing
        start
      }
      createdAt
    }
  }
`;

type ProdHistory = {
  type: string;
  existing: boolean;
  start: string;
};

type AgentProductions = {
  _id: string;
  user: string;
  createdAt: string;
  prod_history: ProdHistory[];
};

const UNLOCK_USER = gql`
  mutation unlockUser($id: ID!) {
    unlockUser(id: $id) {
      success
      message
    }
  }
`;

const SOMETHING_LOCK = gql`
  subscription SomethingOnAgentAccount {
    somethingOnAgentAccount {
      buckets
      message
    }
  }
`;

const AgentView = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const isAgentProd = location.pathname !== "/agent-production";
  const { data: tlAgentData, refetch } = useQuery<{
    findDeptAgents: TLAgent[];
  }>(TL_AGENT, { skip: isAgentProd, notifyOnNetworkStatusChange: true });
  const { data: agentProdData, refetch: agentProdDataRefetch } = useQuery<{
    getAgentProductions: AgentProductions[];
  }>(AGENT_PRODUCTION, {
    skip: isAgentProd,
    notifyOnNetworkStatusChange: true,
  });
  const [agentProduction, setAgentProduction] = useState<TLAgent[]>([]);
  const [option, setOption] = useState(0);
  const [width, setWidth] = useState(50);

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await agentProdDataRefetch();
    };
    refetching();
  }, []);

  useSubscription<{
    somethingOnAgentAccount: { buckets: string[]; message: string };
  }>(SOMETHING_LOCK, {
    onData: async ({ data }) => {
      if (data) {
        if (
          data.data?.somethingOnAgentAccount.message ===
            "SOMETHING_ON_AGENT_ACCOUNT" &&
          data.data?.somethingOnAgentAccount.buckets.some((bucket) =>
            userLogged?.buckets.includes(bucket),
          )
        ) {
          await refetch();
          await agentProdDataRefetch();
        }
      }
    },
  });
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (!tlAgentData?.findDeptAgents) return;

    let filtered = tlAgentData.findDeptAgents;
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (e) =>
          e.user_id?.includes(search) ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.buckets.some((bucket) =>
            bucket.name.toLowerCase()?.includes(search.toLowerCase()),
          ) ||
          e.departments.some((dept) =>
            dept.name.toLowerCase()?.includes(search.toLowerCase()),
          ),
      );
    }
    if (option === 50) {
      filtered = filtered.filter((e) => e.isOnline);
    } else if (option === 95) {
      filtered = filtered.filter((e) => !e.isOnline);
    }

    setAgentProduction(filtered);
  }, [search, tlAgentData, option]);

  useEffect(() => {
    const filteredData = tlAgentData?.findDeptAgents?.filter(
      (e) =>
        e.user_id?.includes(search) ||
        e.name.toLowerCase()?.includes(search.toLowerCase()) ||
        e.buckets.some((bucket) =>
          bucket.name.toLowerCase()?.includes(search.toLowerCase()),
        ) ||
        e.departments.some((dept) =>
          dept.name.toLowerCase()?.includes(search.toLowerCase()),
        ),
    );
    if (filteredData) {
      setAgentProduction(filteredData);
    }
  }, [search, tlAgentData]);

  const [unlockUser] = useMutation<{
    unlockUser: { success: boolean; message: string };
  }>(UNLOCK_USER, {
    onCompleted: async (res) => {
      setIsAuthorize(false);
      dispatch(
        setSuccess({
          success: res.unlockUser.success,
          message: res.unlockUser.message,
          isMessage: false,
        }),
      );
      await refetch();
      await agentProdDataRefetch();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [authentication, setAuthentication] = useState({
    yesMessage: "",
    event: () => {},
    no: () => {},
  });

  const [isAuthorize, setIsAuthorize] = useState<boolean>(false);

  enum ButtonType {
    SET = "SET",
    UNLOCK = "UNLOCK",
    SET_TARGETS = "SET_TARGETS",
  }

  const [userToUpdateTargets, setUserToUpdateTargets] = useState<string | null>(
    null,
  );
  const [updateSetTargets, setUpdateSetTarget] = useState<boolean>(false);
  const [bucketTargetModal, setBucketTargetModal] = useState<boolean>(false);

  useEffect(() => {
    if (!tlAgentData?.findDeptAgents) return;

    let filtered = tlAgentData.findDeptAgents;
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (e) =>
          e.user_id.includes(search) ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.buckets.some((bucket) =>
            bucket.name.toLowerCase().includes(search.toLowerCase()),
          ) ||
          e.departments.some((dept) =>
            dept?.name.toLowerCase().includes(search.toLowerCase()),
          ) ||
          e.customer?.fullName?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (option === 50) {
      filtered = filtered.filter((e) => e.isOnline);
    } else if (option === 95) {
      filtered = filtered.filter((e) => !e.isOnline);
    }

    setAgentProduction(filtered);
  }, [search, tlAgentData, option]);

  const unlockingUser = useCallback(
    async (userId: string | null) => {
      await unlockUser({ variables: { id: userId } });
    },
    [unlockUser],
  );

  const eventType: Record<
    keyof typeof ButtonType,
    (userId: string | null) => Promise<void>
  > = {
    SET: async (userId) => {
      setUserToUpdateTargets(userId);
      setUpdateSetTarget(true);
      setIsAuthorize(false);
    },
    UNLOCK: unlockingUser,
    SET_TARGETS: async () => {
      setBucketTargetModal(true);
      setIsAuthorize(false);
    },
  };

  const onClickAction = useCallback(
    (
      userId: string | null,
      lock: boolean,
      eventMethod: keyof typeof ButtonType,
    ) => {
      const message = eventMethod.toLowerCase();
      if (
        (lock && eventMethod === ButtonType.UNLOCK) ||
        eventMethod === ButtonType.SET ||
        eventMethod === ButtonType.SET_TARGETS
      ) {
        setIsAuthorize(true);
        setAuthentication({
          yesMessage: message,
          event: () => {
            eventType[eventMethod]?.(userId);
          },
          no: () => {
            setIsAuthorize(false);
          },
        });
      }
    },
    [eventType, setAuthentication, setIsAuthorize],
  );

  const formatCurrency = useCallback((amount?: number | null) => {
    const numericValue =
      typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
    return numericValue.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  }, []);

  return (
    <>
      {updateSetTargets && (
        <SetTargetsModal
          agentToUpdate={userToUpdateTargets || null}
          cancel={() => {
            setUpdateSetTarget(false);
            setUserToUpdateTargets(null);
          }}
          success={(message, success) => {
            dispatch(
              setSuccess({
                success,
                message,
                isMessage: false,
              }),
            );
            refetch();
            agentProdDataRefetch();
            setUserToUpdateTargets(null);
            setUpdateSetTarget(false);
          }}
        />
      )}
      {bucketTargetModal && (
        <SetBucketTargetsModal
          cancel={() => setBucketTargetModal(false)}
          refetch={() => {
            setBucketTargetModal(false);
            refetch();
            agentProdDataRefetch();
          }}
        />
      )}
      <div className="h-full w-full flex flex-col overflow-hidden p-4 gap-2">
        <div className="flex justify-between">
          <div className="flex justify-end w-full gap-3 items-center relative">
            <div className="flex">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="h-full border flex pl-2 rounded-md shadow-md items-center gap-2"
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
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>

                <input
                  type="search"
                  name="search"
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className=" py-2.5 w-full focus:outline-none h-full px-3 text-gray-500 text-sm"
                  placeholder="Enter Agent ID here..."
                  autoComplete="off"
                />
              </motion.div>
            </div>
            <motion.div
              className=" relative border-2 border-blue-800 bg-blue-50 overflow-hidden h-full rounded-md shadow-md flex text-gray-400 font-black uppercase items-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div
                onClick={() => {
                  setOption(0);
                  setWidth(45);
                }}
                className={`" ${
                  option === 0 ? "text-gray-500" : " text-gray-400"
                } transition-all text-xs z-20  px-3 h-full flex items-center cursor-pointer "`}
              >
                ALL
              </div>
              <div
                onClick={() => {
                  setOption(45);
                  setWidth(45);
                }}
                className={`"  ${
                  option === 45 ? "text-green-600" : " text-gray-400"
                } transition-all cursor-pointer px-3 items-center flex w-full h-full  z-20 text-green-500 "`}
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
                  setOption(90);
                  setWidth(55);
                }}
                className={`" ${
                  option === 90 ? "text-red-600" : " text-red-500"
                } transition-all cursor-pointer  px-3 h-full flex items-center z-20  "`}
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
                  option === 45
                    ? "bg-green-200"
                    : option === 90
                      ? "bg-red-200"
                      : "bg-gray-200"
                } absolute z-10 top-0 overflow-hidden left-0 h-full flex items-center justify-center "`}
                initial={{ x: 0, width: 50 }}
                animate={{ x: option, width: width }}
                transition={{ duration: 0.6, type: "spring" }}
              ></motion.div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="shadow-md"
              onClick={() => onClickAction(null, false, ButtonType.SET_TARGETS)}
            >
              <div className="right-5 px-5 py-2 text-sm bg-orange-500 transition-all rounded-md text-white border-2 cursor-pointer font-black uppercase  border-orange-800 hover:bg-orange-600">
                Set Targets
              </div>
            </motion.button>
          </div>
        </div>

        <motion.div
          className="h-full overflow-hidden text-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0 }}
        >
          <div className="grid px-2 border-2 rounded-t-md gap-2 border-blue-800 grid-cols-11 font-black uppercase  text-white text-shadow-2xs bg-blue-500 ">
            <div className=" py-1 flex items-center">Name</div>
            <div className="py-1 truncate flex items-center">VICI ID</div>
            <div className="py-1 truncate flex items-center">Bucket</div>
            <div className="py-1 truncate flex items-center">Campaign</div>
            <div className="py-1 truncate flex items-center text-center justify-center">
              Online
            </div>
            <div className="py-1 truncate flex items-center text-center justify-center">
              Lock
            </div>
            <div className="py-1 truncate flex items-center">Status</div>
            <div className="py-1 truncate flex items-center">Customer</div>
            <div className="py-1 col-span-2 flex flex-col">
              <div className="text-center">Targets</div>
              <div className="grid grid-cols-3 text-center text-[0.8em]">
                <div>Daily</div>
                <div>Weekly</div>
                <div>Montly</div>
              </div>
            </div>
            <div className="py-1 truncate flex items-center justify-end mr-4">
              Action
            </div>
          </div>
          <div className="h-[93%] overflow-y-auto">
            {agentProduction.length !== 0 ? (
              <div>
                {agentProduction.map((e, index) => {
                  const findAgentProd = agentProdData?.getAgentProductions.find(
                    (y) => y.user === e._id,
                  );
                  const findExsitingStatus = findAgentProd?.prod_history.find(
                    (x) => x.existing === true,
                  );
                  return (
                    e.type === "AGENT" &&
                    e.active && (
                      <motion.div
                        key={e._id}
                        className="cursor-default border-x-2 hover:bg-blue-300 transition-all border-b-2 border-gray-600 even:bg-blue-200 odd:bg-blue-100 last:rounded-b-md last:shadow-md  "
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="items-center transition-all gap-2 px-2 py-2 grid grid-cols-11 lg:text-xs 2xl:text-sm text-gray-800 font-normal">
                          <div className="capitalize truncate">{e.name}</div>
                          <div>
                            {e.vici_id || (
                              <div className="text-gray-400 italic text-xs">
                                No vici ID
                              </div>
                            )}
                          </div>

                          <div
                            className=" truncate pr-6"
                            title={e.buckets.map((e) => e.name).join(", ")}
                          >
                            {e.buckets.map((e) => e.name).join(", ") || (
                              <div className="text-gray-400 italic text-xs">
                                No bucket
                              </div>
                            )}
                          </div>
                          <div className=" truncate pr-2">
                            {e.departments.map((e) => e.name).join(", ") || (
                              <div className="text-gray-400 italic text-xs">
                                No campaign
                              </div>
                            )}
                          </div>
                          <div className="text-center flex justify-center">
                            {e.isOnline ? (
                              <div className=" shadow-md bg-green-600 w-5 rounded-full animate-pulse h-5"></div>
                            ) : (
                              <div className=" shadow-md bg-red-600 w-5 rounded-full h-5"></div>
                            )}
                          </div>
                          <div className=" flex  text-center justify-center">
                            {e.isLock ? (
                              <div
                                onClick={() =>
                                  onClickAction(
                                    e._id,
                                    e.isLock,
                                    ButtonType.UNLOCK,
                                  )
                                }
                                className=" bg-red-700 cursor-pointer hover:bg-red-800 shadow-md h-full  px-2 py-1 border-2  rounded-sm border-red-900 text-white"
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
                          <div className="flex items-center ">
                            {findExsitingStatus ? (
                              findExsitingStatus?.type
                            ) : (
                              <div className="text-gray-400 italic text-xs">
                                No status
                              </div>
                            )}
                          </div>
                          <div className="truncate">
                            {e?.customer?.fullName || (
                              <div className="text-gray-400 italic text-xs">
                                No Customer Handled
                              </div>
                            )}
                          </div>
                          <div className="col-span-2 ">
                            <div className="w-full grid grid-cols-3">
                              <div
                                className="text-center"
                                title={formatCurrency(e.targets?.daily)}
                              >
                                {formatCurrency(e.targets?.daily)}
                              </div>
                              <div
                                className="text-center"
                                title={formatCurrency(e.targets?.weekly)}
                              >
                                {formatCurrency(e.targets?.weekly)}
                              </div>
                              <div
                                className="text-center"
                                title={formatCurrency(e.targets?.monthly)}
                              >
                                {formatCurrency(e.targets?.monthly)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row justify-end text-white gap-1">
                            <div
                              onClick={() =>
                                onClickAction(e._id, e.isLock, ButtonType.SET)
                              }
                              className=" w-hull flex px-2 justify-center hover:bg-orange-700 transition-all items-center border-2 border-orange-800 bg-orange-600 cursor-pointer rounded-sm h-full py-1"
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
                                  d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                              </svg>
                            </div>
                            <Link to="/agent-recordings" state={e._id}>
                              <div
                                className=" w-hull flex justify-center hover:bg-green-700 transition-all items-center border-2 border-green-800 bg-green-600 cursor-pointer rounded-sm h-full px-2 py-1"
                                title="Agent Recordings"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2.5"
                                  stroke="currentColor"
                                  className="size-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                                  />
                                </svg>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )
                  );
                })}
              </div>
            ) : (
              <div className="italic font-sans border-x-2 border-b-2 border-blue-800 bg-blue-100 py-2 rounded-b-md text-center text-gray-400 text-base">
                No agent found
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {isAuthorize && <AuthenticationPass {...authentication} />}
    </>
  );
};

export default AgentView;
