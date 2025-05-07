import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useRef } from "react";

const LOGOUT = gql `
  mutation logout { 
    logout { 
      message 
      success 
    } 
  }
`;

const IdleAutoLogout = () => {
  const timeout = 10 * 60 * 1000;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [logout] = useMutation(LOGOUT)

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(logout, timeout);
    }
    const events = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => resetTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [logout, timerRef, timeout]);

  return null
  
}

export default IdleAutoLogout