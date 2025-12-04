import { gql, useMutation } from "@apollo/client";
import { UserInfo } from "../middleware/types";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { persistor, useAppDispatch } from "../redux/store";
import { useRef, useState } from "react";
import Loading from "./Loading";
import { setLogout, setServerError } from "../redux/slices/authSlice";
import { motion } from "framer-motion";

const UPDATEPASSWORD = gql`
  mutation updatePassword(
    $_id: ID!
    $password: String!
    $confirmPassword: String!
  ) {
    updatePassword(
      _id: $_id
      password: $password
      confirmPass: $confirmPassword
    ) {
      branch
      username
      type
      name
      departments
      _id
      change_password
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

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const changePassForm = useRef<HTMLFormElement | null>(null);
  const [eye, setEye] = useState<boolean>(false);
  const [eyeConfirm, setEyeConfirm] = useState<boolean>(false);
  const [required, setRequired] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [notMatch, setNotMatch] = useState<boolean>(false);

  const [logout] = useMutation(LOGOUT, {
    onCompleted: async () => {
      dispatch(setLogout());
      await persistor.purge();
    },
    onError: () => {
      dispatch(setServerError(true));
    },
  });

  const [updatePassword, { loading: changePassLoading }] = useMutation<{
    updatePassword: UserInfo;
  }>(UPDATEPASSWORD, {
    onCompleted: async () => {
      navigate("/", { state: null });
      await logout();
    },
    onError: (error) => {
      const errormessage = error.message;
      if (errormessage === "Invalid") {
        setRequired(true);
        setPassword("");
        setConfirmPassword("");
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!changePassForm?.current?.checkValidity()) {
      setRequired(true);
      setNotMatch(false);
    } else if (
      confirmPassword !== password &&
      changePassForm?.current?.checkValidity()
    ) {
      setNotMatch(true);
      setRequired(false);
    } else {
      await updatePassword({
        variables: { _id: location?.state?._id, password, confirmPassword },
      });
    }
  };

  const userRoutes = {
    AGENT: "/agent-dashboard",
    ADMIN: "/admin-dashboard",
    AOM: "/aom-dashboard",
    TL: "/tl-dashboard",
    CEO: "/ceo-dashboard",
    OPERATION: "/operation-dashboard",
    MIS: "/mis-dashboard",
  };
  const userType =
    (location?.state?.type as keyof typeof userRoutes) ?? "ADMIN";
  const navigator = location?.state !== null ? userRoutes[userType] : "/";

  // if(!location?.state) return <Navigate to={'/'}/>

  if (changePassLoading) return <Loading />;

  if (!location.state) return <Navigate to="/" />;

  return location?.state && !location?.state?.change_password ? (
    <div className="h-screen w-screen flex flex-col">
      {/* <div>
        <img src="/bernalesLogo.png" alt="Bernales Logo" className="w-40" />
      </div> */}
      <div className="flex items-center w- justify-center h-full bg-[url(/BGBernLogo.jpg)] bg-fixed bg-no-repeat bg-cover">
      <div className="bg-white/10 backdrop-blur-sm w-full h-full absolute top-0 left-0" ></div>
        <motion.div
          className=" py-10 border bg-white/80 backdrop-blur-sm border-black rounded shadow-xl flex items-center justify-center flex-col gap-10 px-10 w-full max-w-[40vh]"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
        >
          <h1 className="text-2xl font-black uppercase text-slate-900">Change Password</h1>
          {required && (
            <h1 className="text-xs text-red-500 font-medium">
              All fields are required.
            </h1>
          )}
          {notMatch && (
            <h1 className="text-xs text-red-500 font-medium">
              Confirm password not match.
            </h1>
          )}
          <form
            ref={changePassForm}
            className="flex flex-col w-full gap-2"
            onSubmit={submitForm}
            noValidate
          >
            <label className="relative w-full">
              <span className="block text-sm font-black uppercase text-gray-900 dark:text-white">
                New Password
              </span>
              <input
                type={`${eye ? "text" : "password"}`}
                name="password"
                id="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50 outline-none border border-black text-gray-900 text-sm rounded-sm block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              {eye ? (
                <FaEyeSlash
                  className="absolute top-7 text-2xl right-4"
                  onClick={() => setEye(!eye)}
                />
              ) : (
                <FaEye
                  className="absolute top-7 text-2xl right-4"
                  onClick={() => setEye(!eye)}
                />
              )}
            </label>
            <label className="relative w-full">
              <span className="block text-sm font-black uppercase text-gray-900 dark:text-white">
                Confirm Password
              </span>
              <input
                type={`${eyeConfirm ? "text" : "password"}`}
                name="confirm_password"
                id="confirm_password"
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-50 border outline-none  border-black text-gray-900 text-sm rounded-sm block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              {eyeConfirm ? (
                <FaEyeSlash
                  className="absolute top-7 text-2xl right-4"
                  onClick={() => setEyeConfirm(!eyeConfirm)}
                />
              ) : (
                <FaEye
                  className="absolute top-7 text-2xl right-4"
                  onClick={() => setEyeConfirm(!eyeConfirm)}
                />
              )}
            </label>
            <button
              type="submit"
              className="text-white bg-blue-600 hover:bg-blue-700 transition-all font-black uppercase rounded-sm hover:rounded-2xl text-md text-shadow-md border-2 border-blue-800 cursor-pointer px-3 py-1 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Confirm
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  ) : (
    <Navigate to={navigator} />
  );
};

export default ChangePassword;
