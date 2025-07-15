import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "../redux/store";
import { setServerError } from "../redux/slices/authSlice";

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
  const [logout] = useMutation(LOGOUT)
  const [lockAgent] = useMutation(LOCK)

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await lockAgent();
        await logout();
      } catch (error) {
        dispatch(setServerError(true))
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