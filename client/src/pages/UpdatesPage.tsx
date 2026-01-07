import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect } from "react";
import { motion } from "framer-motion";

const UPDATES_PATCH = gql`
  query getAllPatchUpdates {
    getAllPatchUpdates {
      type
      title
      descriptions
      pushPatch
      createdAt
      updatedAt
    }
  }
`;

type Info = {
  title: string;
  descriptions: string;
  createdAt?: string;
  updatedAt?: string;
};

type PatchItem = {
  type: string;
  title: string;
  descriptions: string;
  pushPatch?: boolean;
  createdAt: string;
  updatedAt: string;
};

type UpdatePatch = {
  type: string;
  info: Info[];
};

const UpdatesPage = () => {
  const { data, refetch } = useQuery<{
    getAllPatchUpdates: PatchItem[];
  }>(UPDATES_PATCH, { notifyOnNetworkStatusChange: true });

  console.log(data);
  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };

    refetching();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative">
      <div className="w-full h-full absolute bg-blue-500/70 backdrop-blur-[4px]"></div>

      <motion.div
        className="h-[100%] w-full bg-white/60 border backdrop-blur-sm z-50  overflow-hidden flex flex-col rounded-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h1 className="text-5xl h-[10%] border-b border-black bg-blue-600 font-black uppercase text-white p-5 text-center">
          Patch NOTE Updates
        </h1>

        {(() => {
          const pushed = (data?.getAllPatchUpdates || []).filter(
            (u) => u.pushPatch
          );

          const grouped = pushed.reduce<Record<string, Info[]>>((acc, cur) => {
            if (!acc[cur.type]) acc[cur.type] = [];
            acc[cur.type].push({
              title: cur.title,
              descriptions: cur.descriptions,
              createdAt: cur.createdAt,
              updatedAt: cur.updatedAt,
            });
            return acc;
          }, {});

          const updates: UpdatePatch[] = Object.entries(grouped).map(
            ([type, info]) => ({ type, info })
          );

          const isSingle = updates.length === 1;

          return (
            <div
              className={`h-[90%]  p-2 grid gap-2  ${
                isSingle
                  ? "grid-cols-1 place-items-center"
                  : "grid-flow-col auto-cols-fr"
              }`}
            >
              {updates.length === 0 && (
                <p className="text-center font-normal items-center flex justify-center h-full w-full text-gray-600 italic">
                  No updates as of now
                </p>
              )}
              {updates.map((update, index) => (
                <div
                  key={index}
                  className={`bg-gray-200 flex flex-col transition-all border h-full rounded-md shadow-md ${
                    isSingle ? "w-full max-w-xl h-full" : ""
                  }`}
                >
                  <h1 className="text-3xl h-[13%] font-black uppercase text-white text-center border-b border-black px-2 py-2 bg-blue-600">
                    {update.type}
                  </h1>
                  <ul className="p-5 flex flex-col gap-2 overflow-auto h-[87%]">
                    {update.info.map((x, index) => (
                      <li
                        className="border rounded-md  shadow-md list-none"
                        key={index}
                      >
                        <div className="bg-blue-600 text-white border-b border-black uppercase text-center font-black py-2 ">
                          <div>{x.title}</div>
                          <div className="text-[0.7rem] font-normal uppercase">
                            Last Update:{" "}
                            {x.updatedAt
                              ? new Date(x.updatedAt).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                        <p className="px-5 bg-gray-100 rounded-b-md py-2 first-letter:uppercase font-semibold">
                          {x.descriptions}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        })()}
      </motion.div>
    </div>
  );
};

export default UpdatesPage;
