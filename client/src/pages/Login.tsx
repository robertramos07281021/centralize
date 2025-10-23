import { RootState, useAppDispatch } from "../redux/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { gql, useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
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
import Lottie from "lottie-react";
import animationData from "../Animations/Spider.json";
import pumpkin from "../Animations/Spooky Pumpkin.json";

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
  const [hide, setHide] = useState(false);

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
      dispatch(setUserLogged(res.login.user));
      dispatch(setMyToken(res.login.token));
      if (!res.login.user.change_password) {
        navigate("/change-password", { state: res.login.user });
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

  const lottieRefs = [
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
    useRef(),
  ];

  useEffect(() => {
    const delays = [0, 1000, 500, 1500, 2000, 700];

    const timers = lottieRefs.map((ref, index) => {
      return setTimeout(() => {
        ref.current?.stop(); 
        ref.current?.play();
      }, delays[index]);
    });

    return () => timers.forEach(clearTimeout);
  }, [hide]);

  const positions = [
    "left-10",
    "left-[300px]",
    "left-[600px]",
    "left-[1000px]",
    "left-[1300px]",
    "left-[1600px]",
  ];

  const widths = ["w-60", "w-96", "w-52", "w-72", "w-60", "w-80"];

  if (loading) return <Loading />;

  return (
    <div className="h-screen  w-screen overflow-hidden flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative ">
      <div className="w-full h-full absolute bg-blue-500/50 backdrop-blur-[4px]"></div>
      <AnimatePresence>
        {!hide && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {lottieRefs.map((ref, index) => (
              <div
                key={index}
                className={`absolute ${widths[index]} top-0 ${positions[index]}`}
              >
                <Lottie
                  lottieRef={ref}
                  animationData={animationData}
                  loop={false}
                  autoplay={false}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="absolute bg-black border-2 border-white shadow-md p-4 rounded-md uppercase text-white font-black text-xl bottom-10 right-10"
        initial={{scale: 0.5, opacity: 0}}
        animate={{scale: 1, opacity: 1}}
        layout
      >
        <div className=" mb-1 text-base text-center ">Too scary?</div>
        <div className="flex text-center cursor-pointer hover:bg-gray-300 transition-all justify-center bg-white rounded-full text-black text-base px-2 gap-2 ">
          {!hide ? (
            <div className="px-6" onClick={() => setHide(true)}>hide</div>
          ) : (
            <div className="px-6" onClick={() => setHide(false)}>Show</div>
          )}
        </div>
      </motion.div>

      <motion.form
        ref={loginForm}
        onSubmit={handleSubmitLogin}
        className="bg-white/70 backdrop-blur-lg relative border-2 border-gray-900 w-96 min-h-96 py-10 rounded-xl z-50 flex items-center justify-center flex-col gap-10 shadow-2xl shadow-black/80"
        noValidate
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
      >
        <AnimatePresence>
          {!hide && (
            <motion.div
              className="absolute  -top-[250px] left-0"
              initial={{y: 30, scale: 0.5, opacity: 0}}
              animate={{y: 0, scale: 1, opacity: 1}}
              exit={{y: 30,  scale: 0.8, opacity: 0 }}
            >
              <Lottie animationData={pumpkin} loop={true} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-col text-center text-blue-500">
          <h1 className="text-2xl font-black italic text-shadow-sm">
            Bernales & Associates
          </h1>
          <h1 className=" font-black uppercase text-shadow-sm dark:text-white ">
            Collection System
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
              <span className="block text-sm font-black uppercase text-gray-900 dark:text-white">
                Username:
              </span>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="off"
                placeholder="Ex. JohnDoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </label>
          </div>
          <div className="relative">
            <label>
              <span className="block uppercase text-sm font-black text-gray-900 dark:text-white">
                Password:
              </span>
              <input
                type={`${eye ? "text" : "password"}`}
                id="password"
                name="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
              className="text-white transition-all cursor-pointer border-2 border-blue-800 bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-md px-8 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
