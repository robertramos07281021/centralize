import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useRef } from "react";
import { persistor, RootState, useAppDispatch } from "../redux/store";
import { setLogout, setServerError } from "../redux/slices/authSlice";
import { useSelector } from "react-redux";

const LOGOUT = gql `
  mutation logout { 
    logout { 
      message 
      success 
    } 
  }
`;

const LOCK = gql`
  mutation Mutation {
    lockAgent {
      success
      message
    }
  }
`

const IdleAutoLogout = () => {
  const timeout = 10 * 60 * 1000;
  const dispatch = useAppDispatch()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [logout] = useMutation(LOGOUT,{
    onCompleted: async()=> {
      dispatch(setLogout())
      await persistor.purge()
    }
  })
  
  const [lockAgent] = useMutation(LOCK)

  const startTimer = () => {
    const {selectedCustomer} = useSelector((state:RootState)=> state.auth)
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if(!selectedCustomer) {
        try {
          await lockAgent();
          await logout();
        } catch (error) {
          dispatch(setServerError(true))
        }
      }
    }, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    const resetTimer = () => startTimer();
    events.forEach(event => window.addEventListener(event, resetTimer));
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => 
        window.removeEventListener(event, resetTimer)
      );
    };
  },[]);

  return null
  
}

export default IdleAutoLogout