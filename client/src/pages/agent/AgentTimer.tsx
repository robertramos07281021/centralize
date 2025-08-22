import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";

type Bucket = {
  _id:string
  name:string
}

const GET_AGENT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      _id
      name
    }
  }
`
const AgentTimer = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if(userLogged?.type === "AGENT") {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userLogged]);

  const {data:agentBucketData, refetch} = useQuery<{getDeptBucket:Bucket[]}>(GET_AGENT_BUCKET)
  
  useEffect(()=> {
    refetch()
  },[refetch])
  

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const db = agentBucketData?.getDeptBucket || []
    return Object.fromEntries(db.map(e=> [e._id, e.name]))
  },[agentBucketData])



  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }); 

  return (
    <div className="w-full flex justify-between  text-slate-600 text-xs font-medium ">
      <div>
        Bucket: {userLogged?.buckets.map((e)=> bucketObject[e]).join(", ")}
      </div>
      <div className="text-xs">
        Date & Time: <span >{time.toLocaleDateString()} - {formattedTime}</span>
      </div>
    </div>
  )
}

export default AgentTimer