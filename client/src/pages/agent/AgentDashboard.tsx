import { useSelector } from "react-redux"
import { RootState } from "../../redux/store"
import { useEffect, useState } from "react";
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


const AgentDashboard = () => {

  const {userLogged} = useSelector((state:RootState)=> state.auth)

  const [time, setTime] = useState(new Date());

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
 
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full flex justify-between p-5 text-slate-600 text-xs font-medium ">
        <div>
          Bucket: {userLogged?.buckets.map((e)=> bucketObject[e] + ", ")}
        </div>
        <div className="text-xs">
          Date & Time: <span className=""> {time.toLocaleDateString()} - {formattedTime}</span>
        </div>
      </div>
      <div className="h-full ">
      </div>
  </div>
  )
}

export default AgentDashboard

