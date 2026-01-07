import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RootState, useAppDispatch } from "../redux/store";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { gql, useMutation, useQuery } from "@apollo/client";
import { motion } from "framer-motion";
import {
  setBreakValue,
  setDeselectCustomer,
  setLogout,
  setMyToken,
  setServerError,
  setStart,
  setUserLogged,
} from "../redux/slices/authSlice";
import Loading from "./Loading";
import { useSelector } from "react-redux";
import { BreakEnum } from "../middleware/exports";
import { persistor } from "../redux/store";

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      prodStatus
      start
      token
      user {
        _id
        change_password
        name
        type
        username
        branch
        departments
        buckets
        isOnline
        account_type
        group
        vici_id
        targets {
          daily
          weekly
          monthly
        }
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

const GET_UPDATES_COUNT = gql`
  query getAllPatchUpdates {
    getAllPatchUpdates {
      pushPatch
    }
  }
`;

type Targets = {
  daily: number;
  weekly: number;
  monthly: number;
};

type User = {
  _id: string;
  change_password: boolean;
  name: string;
  type: string;
  username: string;
  branch: string;
  departments: string[];
  buckets: string[];
  account_type: string;
  group: string;
  targets: Targets;
  isOnline: boolean;
  vici_id: string;
};

type Login = {
  user: User;
  prodStatus: keyof typeof BreakEnum;
  start: string;
  token: string;
};

const Login = () => {
  const { userLogged, selectedCustomer } = useSelector(
    (state: RootState) => state.auth
  );
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const userRoutes = useMemo(
    () => ({
      AGENT: "/agent-dashboard",
      ADMIN: "/admin-dashboard",
      AOM: "/aom-dashboard",
      TL: "/tl-dashboard",
      CEO: "/ceo-dashboard",
      OPERATION: "/operation-dashboard",
      MIS: "/mis-dashboard",
      QA: "/qa-agents-dashboard",
      QASUPERVISOR: "/qasv-dashboard",
      COMPLIANCE: "/compliance-dashboard",
    }),
    []
  );

  const [eye, setEye] = useState<boolean>(false);
  const [required, setRequired] = useState<boolean>(false);
  const loginForm = useRef<HTMLFormElement | null>(null);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [already, setAlready] = useState<boolean>(false);
  const [lock, setLock] = useState<boolean>(false);
  const [invalid, setInvalid] = useState<boolean>(false);
  const logo = "/bernalesLogo.png";

  const { data: updatesData } = useQuery<{
    getAllPatchUpdates: { pushPatch?: boolean }[];
  }>(GET_UPDATES_COUNT, { notifyOnNetworkStatusChange: true });
  const updatesCount =
    updatesData?.getAllPatchUpdates?.filter((u) => u.pushPatch)?.length ?? 0;

  const [deselectTask] = useMutation(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [logout] = useMutation(LOGOUT, {
    onCompleted: async () => {
      dispatch(setLogout());
      await persistor.purge();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [login, { loading }] = useMutation<{ login: Login }>(LOGIN, {
    onCompleted: async (res) => {
      await persistor.purge();
      dispatch(setUserLogged(res?.login?.user));
      dispatch(setMyToken(res?.login?.token));
      if (!res?.login?.user?.change_password) {
        navigate("/change-password", { state: res?.login?.user });
      } else {
        if (res.login.user.type === "AGENT") {
          dispatch(setBreakValue(res.login.prodStatus));
          dispatch(setStart(res.login.start));
          const navigateString =
            res.login.prodStatus === BreakEnum.PROD
              ? userRoutes[res.login.user.type as keyof typeof userRoutes]
              : "/break-view";
          navigate(navigateString);
        } else {
          navigate(userRoutes[res.login.user.type as keyof typeof userRoutes]);
        }
      }
    },
    onError: async (error) => {
      await persistor.purge();
      const errorMessage = ["Invalid", "Already", "Lock"];
      if (!errorMessage.includes(error.message)) {
        dispatch(setServerError(true));
      } else {
        const message = error.message;
        if (message === "Invalid") {
          setRequired(false);
          setInvalid(true);
          setAlready(false);
          setLock(false);
          setUsername("");
          setPassword("");
        } else if (message === "Already") {
          setRequired(false);
          setInvalid(false);
          setAlready(true);
          setLock(false);
          setUsername("");
          setPassword("");
        } else if (message === "Lock") {
          setRequired(false);
          setInvalid(false);
          setAlready(false);
          setLock(true);
          setUsername("");
          setPassword("");
        } else {
          dispatch(setServerError(true));
        }
      }
    },
  });

  const handleEyeClick = useCallback(() => {
    setEye((prev) => !prev);
  }, [setEye]);

  const handleSubmitLogin = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!loginForm?.current?.checkValidity()) {
        setRequired(true);
        setInvalid(false);
        setAlready(false);
        setLock(false);
        return;
      }

      await login({ variables: { username, password } });
    },
    [
      login,
      username,
      password,
      setRequired,
      setInvalid,
      setAlready,
      setLock,
      loginForm,
    ]
  );

  useEffect(() => {
    if (userLogged && userLogged.change_password) {
      const userType = userLogged.type as keyof typeof userRoutes;
      if (userRoutes[userType]) navigate(userRoutes[userType]);
    }
  }, [userLogged, userRoutes, navigate]);

  useEffect(() => {
    if (userLogged && !userLogged.change_password) {
      const timer = setTimeout(async () => {
        await logout();
        if (selectedCustomer) {
          await deselectTask({ variables: { id: selectedCustomer._id } });
        }
      });
      return () => clearTimeout(timer);
    }
  }, [dispatch, userLogged, logout, selectedCustomer, deselectTask]);

  if (loading) return <Loading />;

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative ">
      <div className="w-full h-full absolute bg-blue-500/70 backdrop-blur-[4px]"></div>

      <motion.a
        className="absolute max-h-[100%] z-20 bottom-2 right-2 "
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        href="/updates"
        target="_blank"
      >
        <div className="h-full flex gap-4 items-center transition-all border-2 cursor-pointer hover:bg-blue-700 font-black uppercase text-white px-4 py-2 bg-blue-600 border-blue-900 rounded-md overflow-hidden shadow-md ">
          {updatesCount === 0 ? null : (
            <div>
              <div className="absolute -left-1 -top-1 w-4 h-4 bg-red-600 rounded-full z-20 shadow-md"></div>
              <div className="absolute -left-1 -top-1 w-4 h-4 bg-red-600 rounded-full z-10 animate-ping "></div>
            </div>
          )}
          <div className="flex text-shadow-md text-sm">VIEW updates</div>
          <div className=" px-2 items-center flex justify-center h-6 rounded-full border-2 border-amber-800 bg-amber-600 text-xs">
            {updatesCount}
          </div>
        </div>
      </motion.a>

      <motion.form
        ref={loginForm}
        onSubmit={handleSubmitLogin}
        className="bg-white backdrop-blur-lg relative border border-gray-900 w-[420px] min-h-96 py-10 rounded-xl z-50 flex items-center justify-center flex-col gap-2 shadow-2xl shadow-black/80"
        noValidate
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
      >
        <div className="flex flex-col px-6 text-center text-blue-800">
          <div>
            {" "}
            <img src={logo} />{" "}
          </div>
          <h1 className=" font-black text-2xl uppercase text-shadow-sm dark:text-white ">
            Collection System
          </h1>{" "}
          <h1 className=" font-black text-xl uppercase text-shadow-sm dark:text-white ">
            login
          </h1>
        </div>
        <div className="flex gap-5 w-full flex-col px-10">
          {invalid && (
            <h1 className="text-xs text-center text-red-500 font-medium">
              Incorrect username or password.
            </h1>
          )}
          {already && (
            <h1 className="text-xs text-center text-red-500 font-medium">
              Account already logged in.
            </h1>
          )}
          {lock && (
            <h1 className="text-xs text-center text-red-500 font-medium">
              Account has been lock.
            </h1>
          )}
          {required && (
            <h1 className="text-xs text-center text-red-500 font-medium">
              All fields are required
            </h1>
          )}
          <div className="w-full">
            <label>
              <span className="block text-sm font-black uppercase text-blue-900 dark:text-white">
                Username:
              </span>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="off"
                placeholder="Eg. JDoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 focus:outline-none border shadow-md text-gray-900 text-sm rounded-sm focus:ring-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </label>
          </div>
          <div className="relative">
            <label>
              <span className="block uppercase text-sm font-black text-blue-900 dark:text-white">
                Password:
              </span>
              <input
                type={`${eye ? "text" : "password"}`}
                id="password"
                name="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border focus:outline-none shadow-md  text-gray-900 text-sm rounded-sm focus:ring-blue-500
                
                
                block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                required
              />
              {eye ? (
                <FaEyeSlash
                  className="absolute top-7.5 text-2xl right-4"
                  onClick={handleEyeClick}
                />
              ) : (
                <FaEye
                  className="absolute top-7.5 text-2xl right-4"
                  onClick={handleEyeClick}
                />
              )}
            </label>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="text-white uppercase w-full transition-all hover:rounded-2xl cursor-pointer border-2 border-blue-800 bg-blue-600 hover:bg-blue-700 font-black rounded-md px-8 py-2.5 text-center "
            >
              Login
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default Login;
