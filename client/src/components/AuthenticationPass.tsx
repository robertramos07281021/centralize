import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { CgDanger } from "react-icons/cg";
import gql from "graphql-tag";
import { useMutation } from "@apollo/client";
import { useAppDispatch } from "../redux/store";
import { setServerError, setSuccess } from "../redux/slices/authSlice";
import { motion, AnimatePresence } from "framer-motion";

type modalComponents = {
  yesMessage: string;
  no: () => void;
  event: () => void;
};

const AUTHORIZATION = gql`
  mutation authorization($password: String!) {
    authorization(password: $password) {
      success
      message
    }
  }
`;

const AuthenticationPass: React.FC<modalComponents> = ({
  yesMessage,
  event,
  no,
}) => {
  const [eye, setEye] = useState<boolean>(false);
  const handleEyeClick = () => {
    setEye(!eye);
  };
  const dispatch = useAppDispatch();
  const [password, setPassword] = useState<string>("");

  const [authorization] = useMutation(AUTHORIZATION, {
    onCompleted: () => {
      event();
    },
    onError: (data) => {
      if (data.message === "Invalid") {
        dispatch(
          setSuccess({
            success: true,
            message: "Password is incorrect",
            isMessage: false,
          })
        );
        no();
      } else {
        dispatch(setServerError(true));
      }
    },
  });

  const handleAuthSubmit = async () => {
    await authorization({ variables: { password } });
  };

  return (
    <motion.div className="absolute z-50 h-full w-full top-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
      <AnimatePresence>


      <motion.div
        className="p-5 border rounded border-slate-600 bg-white flex items-center justify-center flex-col gap-2 shadow-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{scale: 0.8, opacity: 0}}
      >
        <CgDanger className="text-red-500 text-5xl mb-4" />
        <h1 className="lg:text-sm 2xl:text-lg font-black text-black">
          {" "}
          Enter your password for confirmation!
        </h1>
        <label className="flex items-center gap-2 border border-slate-500 rounded-md px-2 py-1 w-full">
          <input
            type={eye ? "text" : "password"}
            name="password"
            id="password"
            autoComplete="off"
            value={password}
            className="outline-none text-sm w-full"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                await authorization({ variables: { password } });
              }
            }}
          />
          {eye ? (
            <FaEyeSlash
              className=" text-2xl right-4"
              onClick={handleEyeClick}
            />
          ) : (
            <FaEye className=" text-2xl right-4" onClick={handleEyeClick} />
          )}
        </label>

        <div className="flex gap-2 mt-5 lg:text-xs 2xl:text-sm">

          <button
            className="border-2 font-black uppercase border-gray-800 shadow-md cursor-pointer py-1 px-5 bg-gray-500 rounded text-white hover:bg-gray-600 transition-all"
            onClick={no}
          >
            cancel
          </button>
          <button
            className="py-2 cursor-pointer transition-all font-black uppercase px-5 bg-green-500 rounded text-white hover:bg-green-600 border-2 border-green-800"
            onClick={handleAuthSubmit}
          >
            Yes, I want to {yesMessage}
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AuthenticationPass;
