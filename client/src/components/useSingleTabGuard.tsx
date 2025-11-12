// hooks/useSingleTabGuard.ts
import { useEffect, useState } from "react";

export function useSingleTabGuard(channelName = "tab-detection") {
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(channelName);
    let replied = false;

 
    channel.onmessage = (event) => {
      if (event.data === "check") {
        channel.postMessage("active");
      } else if (event.data === "active") {
        replied = true;
        setIsDuplicate(true);
      }
    };


    channel.postMessage("check");

    setTimeout(() => {
      if (!replied) setIsDuplicate(false);
    }, 500);

    return () => channel.close();
  }, [channelName]);

  return isDuplicate;
}