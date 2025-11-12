import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RootState, useAppDispatch } from "../redux/store";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { gql, useMutation } from "@apollo/client";
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

  const [deselectTask] = useMutation(DESELECT_TASK, {
    onCompleted: () => {
      dispatch(setDeselectCustomer());
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  type Snowflake = {
    id: string;
    style: CSSProperties &
      Record<
        | "--flake-size"
        | "--flake-scale"
        | "--flake-opacity"
        | "--drift-start"
        | "--drift-end",
        string
      >;
  };

  const snowStyles = `
    .snow-layer {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 5;
    }
    .snowflake {
      position: absolute;
      top: -12vh;
      width: var(--flake-size);
      height: var(--flake-size);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,var(--flake-opacity)) 0%, rgba(255,255,255,0) 100%);
      transform: translate3d(var(--drift-start), -12vh, 0) scale(var(--flake-scale));
      animation-name: snow-fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    @keyframes snow-fall {
      to {
        transform: translate3d(var(--drift-end), 110vh, 0) scale(var(--flake-scale));
      }
    }
  `;
  const snowflakes = useMemo<Snowflake[]>(
    () =>
      Array.from({ length: 120 }, (_, index) => {
        const size = (4 + Math.random() * 8).toFixed(1);
        const scale = (0.6 + Math.random() * 0.9).toFixed(2);
        const opacity = (0.25 + Math.random() * 0.75).toFixed(2);
        const driftStart = (Math.random() * 2 - 1) * 6;
        const driftEnd = driftStart + (Math.random() * 2 - 1) * 14;
        const style = {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * -20}s`,
          animationDuration: `${14 + Math.random() * 12}s`,
          opacity,
          ["--flake-size"]: `${size}px`,
          ["--flake-scale"]: scale,
          ["--flake-opacity"]: opacity,
          ["--drift-start"]: `${driftStart.toFixed(2)}vw`,
          ["--drift-end"]: `${driftEnd.toFixed(2)}vw`,
        } as Snowflake["style"];
        return { id: `flake-${index}`, style };
      }),
    []
  );

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

  // useEffect(() => {
  //   const updateCountdown = () => {
  //     const now = new Date();
  //     setCurrentTime(now);
  //     const currentYear = now.getFullYear();
  //     let christmas = new Date(currentYear, 11, 25, 0, 0, 0, 0);
  //     if (now > christmas) {
  //       christmas = new Date(currentYear + 1, 11, 25, 0, 0, 0, 0);
  //     }
  //     const diff = Math.max(0, christmas.getTime() - now.getTime());
  //     const totalSeconds = Math.floor(diff / 1000);
  //     setCountdown({
  //       hours: Math.floor(totalSeconds / 3600),
  //       minutes: Math.floor((totalSeconds % 3600) / 60),
  //       seconds: totalSeconds % 60,
  //     });
  //   };

  //   // updateCountdown();
  //   const intervalId = setInterval(updateCountdown, 1000);
  //   return () => clearInterval(intervalId);
  // }, []);

  // const formattedDate = useMemo(
  //   () =>
  //     currentTime.toLocaleDateString(undefined, {
  //       month: "long",
  //       day: "numeric",
  //       year: "numeric",
  //     }),
  //   [currentTime]
  // );
  // const formattedCountdown = useMemo(
  //   () =>
  //     `${countdown.hours} hrs ${countdown.minutes} mins ${countdown.seconds} secs`,
  //   [countdown]
  // );

  if (loading) return <Loading />;

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative ">
      <style>{snowStyles}</style>
      <div className="w-full h-full absolute bg-blue-500/70 backdrop-blur-[4px]"></div>
      <div className="snow-layer z " aria-hidden="true">
        {snowflakes.map((flake) => (
          <span key={flake.id} className="snowflake" style={flake.style} />
        ))}
      </div>
      <motion.div
        className=" absolute hidden md:flex bottom-5 justify-center  right-5  "
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
        layout
      >
        {/* <div className=" absolute z-20 -top-[145px] w-[90%] h-20">
          <Lottie animationData={tree} />
        </div>
        <motion.div
          layout
          className="bg-blue-600 z-10 text-white font-black px-5 pb-2 pt-8 border-2 border-blue-900 rounded-md text-center space-y-1"
        >
          <div className="text-xs tracking-wide uppercase ">
            {formattedDate}
          </div>
          <div className="text-sm">{formattedCountdown}</div>
        </motion.div> */}
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
                className="bg-gray-50 focus:outline-none border shadow-md text-gray-900 text-sm rounded-lg focus:ring-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
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
                className="bg-gray-50 border focus:outline-none shadow-md  text-gray-900 text-sm rounded-lg focus:ring-blue-500
                
                
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
              className="text-white w-full transition-all cursor-pointer border-2 border-blue-800 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-md px-8 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
