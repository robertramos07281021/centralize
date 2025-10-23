import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import { accountsNavbar, BreakEnum, breaks } from "../../middleware/exports";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  increamentBreakTimer,
  setBreakTimer,
  setBreakValue,
  setServerError,
  setStart,
} from "../../redux/slices/authSlice";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import AgentTimer from "./AgentTimer";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Wrapper from "../../components/Wrapper.tsx";
import Navbar from "../../components/Navbar.tsx";
import NavbarExtn from "../../components/NavbarExtn.tsx";
import animationData from "../../Animations/Spooky Ghost.json";
import clinic from "../../Animations/3D Doctor Dancing.json";
import coffee from "../../Animations/Coffee Time.json";
import Lottie from "lottie-react";
import cr from "../../Animations/pepe poo poo.json";
import nego from "../../Animations/nego.json";
import technical from "../../Animations/No Connection.json";
import eating from "../../Animations/Couple eating.json";
import meeting from "../../Animations/Meeting.json";
import skiptracing from "../../Animations/searching for profile.json";
import hrmeeting from "../../Animations/Business Meeting Animation.json";
import coaching from "../../Animations/Online Teaching.json";

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

const LOGIN_PRODUCTION = gql`
  mutation loginToProd($password: String) {
    loginToProd(password: $password) {
      message
      success
    }
  }
`;
type LoginProd = {
  message: string;
  success: boolean;
};

const BreakView = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { breakValue, userLogged, breakTimer, start } = useSelector(
    (state: RootState) => state.auth
  );
  const [password, setPassword] = useState<string>("");
  const [requried, setRequired] = useState<boolean>(false);
  const [eye, setEye] = useState<boolean>(false);
  const [incorrect, setIncorrect] = useState<boolean>(false);

  const [updateProduction] = useMutation<{
    updateProduction: UpdateProduction;
  }>(UPDATE_PRODUCTION, {
    onCompleted: (res) => {
      dispatch(setBreakValue(BreakEnum.PROD));
      navigate("/agent-dashboard");
      dispatch(setStart(res.updateProduction.start));
      setIncorrect(false);
      setRequired(false);
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [loginToProd] = useMutation<{ loginToProd: LoginProd }>(
    LOGIN_PRODUCTION,
    {
      onCompleted: async () => {
        setIncorrect(false);
        dispatch(setBreakValue(BreakEnum.PROD));
        setRequired(false);
        await updateProduction({ variables: { type: BreakEnum.PROD } });
      },
      onError: (error) => {
        const message = error.message;
        if (message.includes("Incorrect")) {
          setIncorrect(true);
          setRequired(false);
        } else {
          dispatch(setServerError(true));
        }
      },
    }
  );

  const OnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password) {
      await loginToProd({ variables: { password: password } });
    } else {
      setIncorrect(false);
      setRequired(true);
    }
  };

  useEffect(() => {
    if (start.length > 0) {
      const startTime = Math.floor(new Date(start).getTime() / 1000);
      const existingTime = Math.floor(new Date().getTime() / 1000);

      const setBreak = existingTime - startTime;
      dispatch(setBreakTimer(setBreak));
    } else {
      dispatch(setBreakTimer(0));
    }
  }, [start]);

  const content = breaks.find((e) => e.value === breakValue);

  const images: Record<string, string | object> = {
    LUNCH: eating,
    COFFEE: coffee,
    MEETING: meeting,
    TECHSUPP: technical,
    CRBREAK: cr,
    COACHING: coaching,
    HRMEETING: hrmeeting,
    HANDSETNEGO: nego,
    SKIPTRACING: skiptracing,
    CLINIC: clinic,
    WELCOME: "/welcomeIcon.png",
  };

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch(increamentBreakTimer());
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  if (
    (breakValue === BreakEnum.PROD ||
      (userLogged?.type !== "AGENT" && userLogged?.type !== "TL")) &&
    userLogged
  ) {
    return <Navigate to={accountsNavbar[userLogged?.type][0]?.link} />;
  }

  const onClickStart = async () => {
    await updateProduction({ variables: { type: BreakEnum.PROD } });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(secs).padStart(2, "0")}`;
    } else {
      return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    }
  };

  const currentMedia = images[breakValue];

  return userLogged && ["AGENT", "QA"].includes(userLogged?.type) ? (
    <Wrapper>
      <Navbar />
      <NavbarExtn />
      <div className="w-full h-full flex flex-col p-5">
        <div>
          <AgentTimer />
        </div>
        <div className="flex h-full w-full flex-col items-center justify-center">
          {breakValue !== BreakEnum.WELCOME && (
            <>
              {/* <img
                src={images[breakValue]}
                alt={`${content?.name} icon`}
                className="w-80 animate-[bounce_20s_ease-in-out_infinite]"
              /> */}

              {typeof currentMedia === "string" ? (
                <img
                  src={currentMedia}
                  alt={`${content?.name} icon`}
                  className="w-80 animate-[bounce_20s_ease-in-out_infinite]"
                />
              ) : (
                <Lottie
                  animationData={currentMedia}
                  className="w-96"
                  loop
                  autoplay
                />
              )}
              <h1 className="text-2xl font-bold text-gray-500 ">
                {formatTime(breakTimer)}
              </h1>
              <h1 className="text-5xl font-black uppercase text-gray-600 text-shadow-sm ">
                {content?.name}
              </h1>
              <div className="mt-2 flex flex-col gap-2">
                {incorrect && (
                  <h1 className="text-sm text-red-500 text-center">
                    Password is incorrect
                  </h1>
                )}
                {requried && (
                  <h1 className="text-sm text-red-500 text-center">
                    Password is required
                  </h1>
                )}
                <form
                  onSubmit={OnSubmit}
                  className="text-center flex jutify-center flex-col"
                >
                  <div className="border-2 py-1 flex items-center rounded-sm border-slate-500">
                    <input
                      type={`${eye ? "text" : "password"}`}
                      name="password"
                      id="password"
                      autoComplete="off"
                      className="text-sm py-1 outline-0 px-2 w-65"
                      placeholder="Enter your password"
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {eye ? (
                      <div className="px-2" onClick={() => setEye(false)}>
                        <FaEyeSlash className=" top-9.5 text-xl" />
                      </div>
                    ) : (
                      <div className="px-2" onClick={() => setEye(true)}>
                        <FaEye className=" top-9.5 text-xl " />
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className=" border-2 border-blue-800 py-2 shadow-md  hover:shadow-none cursor-pointer mt-2 bg-blue-500 hover:bg-blue-600 transition-all rounded px-10 text-white font-bold active:ring-8 ring-blue-200"
                  >
                    Login
                  </button>
                </form>
              </div>
            </>
          )}
          {breakValue === BreakEnum.WELCOME && (
            <div className="flex absolute z-101 flex-col gap-2 items-center">
              <div className="text-center text-shadow-2xs text-shadow-black">
                <h1 className="text-5xl font-black text-blue-700">
                  Shine bright today,
                </h1>

                <h1 className="capitalize text-5xl font-bold text-blue-700">
                  {userLogged?.name}!
                </h1>
                <h1 className="text-2xl font-black text-blue-500">
                  Let's hit those goals!
                </h1>
              </div>
              <form className=" flex flex-col items-center">
                {typeof currentMedia === "string" && (
                  <img
                    src={currentMedia}
                    alt="Welcome Icon"
                    className="w-80 animate-[bounce_20s_ease-in-out_infinite]"
                  />
                )}

                <button
                  className="shadow-md px-10 py-2 rounded-md uppercase bg-blue-500 border-2 border-blue-800 text-white font-black animate-bounce hover:bg-blue-600 duration-300 ease-in-out cursor-pointer"
                  onClick={onClickStart}
                >
                  Start
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  ) : (
    <Navigate to="/" />
  );
};

export default BreakView;
