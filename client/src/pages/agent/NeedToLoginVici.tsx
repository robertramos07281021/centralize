import gql from "graphql-tag";
import background from "../../../public/BGBernLogo.jpg";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "../../redux/store.ts";
import { useQuery } from "@apollo/client";

const AllBucket = gql`
  query getAllBucket {
    getAllBucket {
      viciIp
      _id
    }
  }
`;

const NeedToLoginVici = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);

  const {data, refetch} = useQuery<{ getAllBucket:{viciIp: string, _id:string}[]}>(AllBucket, {
    notifyOnNetworkStatusChange: true
  })

  useEffect(()=> {
    const refetching = async() => {
      await refetch()
    }
    refetching()
  },[])


  const userBucket =
    userLogged && userLogged?.buckets?.length > 0
      ? new Array(...new Set(userLogged?.buckets.map((x) => data?.getAllBucket.find(d=> d._id === x)?.viciIp )))
      : [];

  return (
    <div className="h-full  w-full relative flex items-center oveflow-hidden justify-center">
      <div className=" w-full overflow-hidden h-full">
        <img className=" object-cover h-full w-full " src={background} />
      </div>
      <div className="top-0 left-0 absolute z-20 flex flex-col w-full h-full bg-blue-600/40 justify-center items-center text-white backdrop-blur-sm ">
        <div className="text-7xl text-shadow-md uppercase animate-bounce font-black text-center flex">
          You need to login on VICI Dial!
        </div>
        <div className="text-2xl text-shadow-md uppercase animate-bounce font-black text-center flex">
          doesn't know where to login?
        </div>
        <div className="flex flex-col">
          {userBucket.map((x,index) => {
            return (
              <a href={`http://${x}`} target="_blank" key={index} className="text-2xl hover:text-line">
                {`http://${x}`}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NeedToLoginVici;
