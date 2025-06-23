import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import gql from "graphql-tag";
import { useQuery } from "@apollo/client";

interface Bucket {
  id:string
  name:string
}

const GET_AGENT_BUCKET = gql`
  query getDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`
const AgentTimer = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if(userLogged.type === "AGENT") {
      const timer = setInterval(() => {
        setTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [userLogged]);

  const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
  const {data:agentBucketData} = useQuery<{getDeptBucket:Bucket[]}>(GET_AGENT_BUCKET)

  useEffect(()=> {
    if(agentBucketData){
      const newObject:{[key:string]:string} = {}
      agentBucketData.getDeptBucket.map(e => 
      {
        newObject[e.id] = e.name
      }
      )
      setBucketObject(newObject)
    }
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