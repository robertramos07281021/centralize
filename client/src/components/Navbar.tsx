import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import { useCallback, useEffect, useRef, useState } from "react";
import Confirmation from "./Confirmation";
import Loading from "../pages/Loading";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { RootState, useAppDispatch } from "../redux/store";
import {
  setBreakValue,
  setDeselectCustomer,
  setIsOnlineOnVici,
  setLogout,
  setServerError,
  setStart,
  setSuccess,
  setUserLogged,
} from "../redux/slices/authSlice";
import NavbarExtn from "./NavbarExtn";
import { useSelector } from "react-redux";
import IdleAutoLogout from "./IdleAutoLogout";
import { accountsNavbar, BreakEnum, breaks } from "../middleware/exports";
import ServerError from "../pages/ServerError";
import SuccessToast from "./SuccessToast";
import { persistor } from "../redux/store";
import { motion, AnimatePresence } from "framer-motion";

type Targets = {
  daily: number;
  weekly: number;
  monthly: number;
};

type UserInfo = {
  _id: string;
  type: "AGENT" | "ADMIN" | "AOM" | "TL" | "CEO" | "OPERATION" | "MIS";
  branch: string;
  username: string;
  name: string;
  change_password: boolean;
  department: string[];
  bucket: string[];
  user_id: string;
  isOnline: boolean;
  targets: Targets;
};

const myUserInfos = gql`
  query getMe {
    getMe {
      _id
      name
      username
      type
      departments
      branch
      change_password
      isOnline
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`;

const LOGOUT = gql`
  mutation logout {
    logout {
      message
      success
    }
  }
`;

const DESELECT_TASK = gql`
  mutation DeselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`;

const LOGOUT_USING_PERSIST = gql`
  mutation logoutToPersist($id: ID!) {
    logoutToPersist(id: $id) {
      message
      success
    }
  }
`;

type UpdateProduction = {
  message: string;
  success: boolean;
  start: string;
};

const UPDATE_PRODUCTION = gql`
  mutation UpdateProduction($type: String!) {
    updateProduction(type: $type) {
      message
      success
      start
    }
  }
`;

const AGENT_BUCKETS = gql`
  query getTLBucket {
    getTLBucket {
      canCall
    }
  }
`;

type AgentLock = {
  message: string;
  agentId: string;
};

const LOCK_AGENT = gql`
  subscription AgentLocked {
    agentLocked {
      message
      agentId
    }
  }
`;

const OFFLINE_USER = gql`
  subscription accountOffline {
    accountOffline {
      message
      agentId
    }
  }
`;

const CHECK_USER_ONLINE_ON_VICI = gql`
  query checkUserIsOnlineOnVici($_id: ID!) {
    checkUserIsOnlineOnVici(_id: $_id)
  }
`;

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { userLogged, selectedCustomer, breakValue, serverError, success } =
    useSelector((state: RootState) => state.auth);
  const modalRef = useRef<HTMLDivElement>(null);
  const { error, data, refetch } = useQuery<{ getMe: UserInfo }>(myUserInfos, {
    notifyOnNetworkStatusChange: true,
  });
  const [poPupUser, setPopUpUser] = useState<boolean>(false);

  const { data: userIsOnlineOnVici, error: viciDialError } = useQuery<{
    checkUserIsOnlineOnVici: boolean;
  }>(CHECK_USER_ONLINE_ON_VICI, {
    variables: { _id: userLogged?._id },
    notifyOnNetworkStatusChange: true,
    skip:
      !location.pathname.includes("cip") &&
      !["AGENT", "TL"].includes(userLogged?.type as keyof typeof String),
    pollInterval: 3000,
  });

  const {data: agentBucketsData,refetch:agentBucketRefetch} = useQuery<{getTLBucket:{canCall:boolean}[]}>(AGENT_BUCKETS,{
    notifyOnNetworkStatusChange: true,
  })

  const canCallMap = agentBucketsData?.getTLBucket.map(x=> x.canCall)

  useEffect(() => {
    if (Boolean(viciDialError) && canCallMap?.includes(true)) {
      dispatch(
        setSuccess({
          isMessage: true,
          success: true,
          message: "Please tell you admin to add you Vici Dial ID!",
        })
      );
    }
  }, [viciDialError]);

  useEffect(() => {
    if (userIsOnlineOnVici && canCallMap?.includes(true)) {
      dispatch(setIsOnlineOnVici(userIsOnlineOnVici?.checkUserIsOnlineOnVici));
    }
  }, [userIsOnlineOnVici]);

  const [deselectTask] = useMutation(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
      await agentBucketRefetch()
    };
    refetching();
  }, []);

  const [popUpBreak, setPopUpBreak] = useState<boolean>(false);

  useSubscription<{ agentLocked: AgentLock }>(LOCK_AGENT, {
    onData: async ({ data }) => {
      if (data) {
        if (
          data.data?.agentLocked.message === "AGENT_LOCK" &&
          data.data?.agentLocked.agentId === userLogged?._id
        ) {
          await refetch();
        }
      }
    },
  });

  useSubscription<{ accountOffline: AgentLock }>(OFFLINE_USER, {
    onData: async ({ data }) => {
      if (data) {
        if (
          data.data?.accountOffline.message === "OFFLINE_USER" &&
          data.data?.accountOffline.agentId === userLogged?._id
        ) {
          await refetch();
        }
      }
    },
  });

  useEffect(() => {
    dispatch(setSuccess({ success: false, message: "", isMessage: false }));
  }, [location.pathname]);

  const [logout, { loading }] = useMutation(LOGOUT, {
    onCompleted: async () => {
      dispatch(setLogout());
      await persistor.purge();
      navigate("/");
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [confirmation, setConfirmation] = useState<boolean>(false);

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "LOGOUT" as "LOGOUT" | "IDLE",
    yes: () => {},
    no: () => {},
  });

  const handleSubmit = useCallback(() => {
    setConfirmation(true);
    setModalProps({
      no: () => setConfirmation(false),
      yes: async () => {
        await logout();
        if (selectedCustomer) {
          await deselectTask({ variables: { id: selectedCustomer?._id } });
        }
      },
      message: "Are you sure you want to logout?",
      toggle: "LOGOUT",
    });
  }, [
    selectedCustomer,
    setConfirmation,
    deselectTask,
    dispatch,
    logout,
    setModalProps,
  ]);

  const [logoutToPersist, { loading: logoutToPEristsLoading }] = useMutation<{
    logoutToPersist: { success: boolean; message: string };
  }>(LOGOUT_USING_PERSIST, {
    onCompleted: async () => {
      dispatch(setLogout());
      await persistor.purge();
      navigate("/");
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [updateProduction] = useMutation<{
    updateProduction: UpdateProduction;
  }>(UPDATE_PRODUCTION, {
    onCompleted: () => {
      dispatch(setStart(new Date().toString()));
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const forceLogout = useCallback(async () => {
    await logoutToPersist({ variables: { id: userLogged?._id } });
    if (selectedCustomer) {
      await deselectTask({
        variables: { id: selectedCustomer?._id, user_id: userLogged?._id },
      });
    }
  }, [deselectTask, logoutToPersist, selectedCustomer, userLogged]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (error) {
        if (
          error?.message === "Not authenticated" ||
          error?.message === "Unauthorized"
        ) {
          setConfirmation(true);
          setModalProps({
            no: () => {
              setConfirmation(false);
              forceLogout();
            },
            yes: () => {
              setConfirmation(false);
              forceLogout();
            },
            message: "You have been force to logout!",
            toggle: "IDLE",
          });
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    error,
    navigate,
    dispatch,
    logoutToPersist,
    userLogged,
    deselectTask,
    selectedCustomer,
  ]);

  useEffect(() => {
    if (breakValue !== BreakEnum.PROD && userLogged?.type === "AGENT") {
      navigate("/break-view");
    }
  }, [breakValue, navigate]);

  const onClickBreakSelection = async (
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.checked) {
      setPopUpBreak(false);
      setPopUpUser(false);
      dispatch(setBreakValue(BreakEnum[value as keyof typeof BreakEnum]));
      await updateProduction({ variables: { type: value } });
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setPopUpUser(false);
    }
  };

  useEffect(() => {
    if (poPupUser) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [poPupUser]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data && userLogged) {
        dispatch(
          setUserLogged({
            ...userLogged,
            isOnline: data?.getMe?.isOnline,
            targets: data?.getMe?.targets || {
              daily: 0,
              weekly: 0,
              monthly: 0,
            },
          })
        );
        if (!data?.getMe?.isOnline) {
          setConfirmation(true);
          setModalProps({
            no: () => {
              setConfirmation(false);
              forceLogout();
            },
            yes: () => {
              setConfirmation(false);
              forceLogout();
            },
            message: "You have been force to logout!",
            toggle: "IDLE",
          });
        }
      }
    });
    return () => clearTimeout(timer);
  }, [data]);

  if (loading || logoutToPEristsLoading) return <Loading />;

  return (
    userLogged && (
      <>
        {serverError && <ServerError />}
        {success.success && (
          <SuccessToast
            successObject={success || null}
            close={() =>
              dispatch(
                setSuccess({ success: false, message: "", isMessage: false })
              )
            }
          />
        )}
        <div className="sticky top-0 z-50 print:hidden">
          <div className="py-2 px-5 bg-blue-500 flex justify-between items-center ">
            <div className="flex text-2xl gap-2 font-medium items-center text-white italic">
              <img src="/singlelogo.jpg" alt="Bernales Logo" className="w-10" />
              Collections System
              {userLogged?.type === "AGENT" &&
                breakValue !== BreakEnum.WELCOME &&
                !selectedCustomer && <IdleAutoLogout />}
            </div>
            <div className="p-1 flex gap-2 text-xs z-50">
              <p className="font-black text-lg mr-2 flex items-center text-white text-shadow-sm uppercase">
                Hello!&nbsp;
                <span className="uppercase">{userLogged?.name}</span>
              </p>
              <div
                onClick={() => {
                  setPopUpUser(!poPupUser);
                  setPopUpBreak(false);
                }}
                className=" bg-white border-2 flex  border-blue-800 px-2 hover:shadow-none cursor-pointer hover:bg-gray-200 text-blue-800 transition-all items-center shadow-md rounded-md "
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
                  />
                </svg>
              </div>
              <AnimatePresence>
                {poPupUser && (
                  <motion.div
                    ref={modalRef}
                    className="w-auto h-auto border-2 z-50  border-blue-800  shadow-xl shadow-black/8 rounded-xl top-13 end-5 bg-white absolute flex flex-col text-blue-800 uppercase font-black"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                  >
                    {accountsNavbar[userLogged?.type]?.map((e, index) => {
                      const navTo =
                        userLogged?.type === "AGENT" &&
                        breakValue !== BreakEnum.PROD
                          ? "/break-view"
                          : e.link;
                      return (
                        <Link
                          key={index}
                          to={navTo}
                          className={`${
                            index === 0 && "rounded-t-lg"
                          } grow odd:bg-gray-100 px-5 border-b border-slate-200 flex items-center hover:bg-gray-200 duration-200 ease-in-out cursor-pointer py-2`}
                          onClick={() => setPopUpUser(false)}
                        >
                          {e.name === "Customer Interaction Panel"
                            ? "CIP"
                            : e.name}
                        </Link>
                      );
                    })}
                    {userLogged?.type === "AGENT" &&
                      breakValue !== BreakEnum.WELCOME && (
                        <div className="grow border-b border-slate-200 flex items-center cursor-pointer ">
                          <h1
                            className="pl-5 py-2 h-full w-full hover:bg-gray-300 hover:text-white   duration-200 ease-in-out"
                            onClick={() => setPopUpBreak(!popUpBreak)}
                          >
                            Breaks
                          </h1>
                          <AnimatePresence>
                            {popUpBreak && (
                              <motion.div
                                className="absolute -left-[180px] z-40  shadow-md border-blue-800  border-2 rounded-xl w-auto bg-white h-auto flex flex-col -top-1 "
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                              >
                                {breaks.map((e, index) => (
                                  <label
                                    className={`pl-2  hover:bg-blue-200 border-b border-gray-200 odd:bg-gray-100  pr-2 cursor-pointer duration-200 py-2 ease-in-out ${
                                      index === 0 ? "rounded-t-xl" : ""
                                    } ${
                                      index === breaks.length - 1
                                        ? "rounded-b-xl"
                                        : ""
                                    } flex items-center gap-2`}
                                    key={index}
                                  >
                                    <input
                                      type="radio"
                                      name="break"
                                      id={e.value}
                                      value={
                                        BreakEnum[
                                          e.value as keyof typeof BreakEnum
                                        ]
                                      }
                                      onChange={(e) =>
                                        onClickBreakSelection(e.target.value, e)
                                      }
                                      checked={
                                        breakValue === BreakEnum[e.value]
                                      }
                                    />
                                    <span>{e.name}</span>
                                  </label>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    <div
                      className="grow px-5 flex items-center justify-between hover:bg-gray-200 duration-200 ease-in-out cursor-pointer rounded-b-lg py-2"
                      onClick={handleSubmit}
                    >
                      Logout
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="size-5 rotate-180"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                        />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {((breakValue === BreakEnum.PROD && userLogged?.type === "AGENT") ||
            userLogged?.type !== "AGENT") && <NavbarExtn />}
        </div>
        {confirmation && <Confirmation {...modalProps} />}
      </>
    )
  );
};

export default Navbar;
