import gql from "graphql-tag";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { RootState } from "../../redux/store.ts";
import { useQuery } from "@apollo/client";

const AllBucket = gql`
  query getAllBucket {
    getAllBucket {
      viciIp
      viciIp_auto
      name
      _id
    }
  }
`;

const NeedToLoginVici = () => {
  const { userLogged } = useSelector((state: RootState) => state.auth);

  const { data, refetch } = useQuery<{
    getAllBucket: {
      viciIp: string;
      _id: string;
      viciIp_auto: string;
      name: string;
    }[];
  }>(AllBucket, {
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };
    refetching();
  }, []);

  const userBucket =
    userLogged && userLogged?.buckets?.length > 0
      ? new Array(
          ...new Set(
            userLogged?.buckets.map((x) => {
              return {
                name: data?.getAllBucket.find((d) => d._id === x)?.name,
                manual: data?.getAllBucket.find((d) => d._id === x)?.viciIp,
                auto: data?.getAllBucket.find((d) => d._id === x)?.viciIp_auto,
              };
            })
          )
        )
      : [];

  return (
    <div className="h-full  w-full relative flex items-center oveflow-hidden justify-center">
      <div className=" w-full overflow-hidden h-full">
        <img className=" object-cover h-full w-full " src="/BGBernLogo.jpg" />
      </div>
      <div className="top-0 left-0 absolute z-20 flex flex-col w-full h-full bg-blue-600/40 justify-center items-center text-white backdrop-blur-sm ">
        <div className=" text-2xl xl:text-7xl text-shadow-md uppercase animate-bounce font-black text-center flex">
          You need to login on VICI Dial!
        </div>
        <div className=" text-base xl:text-2xl text-shadow-md uppercase animate-bounce font-black text-center flex">
          doesn't know where to login?
        </div>
        <div className="flex flex-col gap-2">
          {userBucket.map((x, index) => {
            return (
              <div key={index} className="flex gap-2">
                {
                  userBucket.length > 1 &&
                <p className="border flex items-center justify-center px-5 rounded bg-gray-100/60 text-black">
                  {x.name}
                </p>
                }
                <a
                  href={`http://${x.manual}`}
                  target="_blank"
                  key={index}
                  className=" hover:bg-gray-100/80 border-gray-800 hover:rounded-4xl shadow-sm transition-all bg-gray-100/60 px-5 py-2 text-black border rounded-md text-sm xl:text-2xl"
                >
                 Manual Only : {`http://${x.manual}`}
                </a>
               
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NeedToLoginVici;
