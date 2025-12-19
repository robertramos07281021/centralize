import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { CSSProperties, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

const UPDATES_PATCH = gql`
  query getAllPatchUpdates {
    getAllPatchUpdates {
      type
      title
      descriptions
      pushPatch
    }
  }
`;

type Info = {
  title: string;
  descriptions: string;
};

type PatchItem = {
  type: string;
  title: string;
  descriptions: string;
  pushPatch?: boolean;
};

type UpdatePatch = {
  type: string;
  info: Info[];
};

const UpdatesPage = () => {
  type Snowflake = {
    id: string;
    style: CSSProperties &
      Record<
        | "--flake-size"
        | "--flake-scale"
        | "--flake-opacity"
        | "--drift-start"
        | "--drift-end",
        string
      >;
  };

  const snowStyles = `
    .snow-layer {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 5;
    }
    .snowflake {
      position: absolute;
      top: -12vh;
      width: var(--flake-size);
      height: var(--flake-size);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,var(--flake-opacity)) 0%, rgba(255,255,255,0) 100%);
      transform: translate3d(var(--drift-start), -12vh, 0) scale(var(--flake-scale));
      animation-name: snow-fall;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    @keyframes snow-fall {
      to {
        transform: translate3d(var(--drift-end), 110vh, 0) scale(var(--flake-scale));
      }
    }
  `;

  const snowflakes = useMemo<Snowflake[]>(
    () =>
      Array.from({ length: 120 }, (_, index) => {
        const size = (4 + Math.random() * 8).toFixed(1);
        const scale = (0.6 + Math.random() * 0.9).toFixed(2);
        const opacity = (0.25 + Math.random() * 0.75).toFixed(2);
        const driftStart = (Math.random() * 2 - 1) * 6;
        const driftEnd = driftStart + (Math.random() * 2 - 1) * 14;
        const style = {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * -20}s`,
          animationDuration: `${14 + Math.random() * 12}s`,
          opacity,
          ["--flake-size"]: `${size}px`,
          ["--flake-scale"]: scale,
          ["--flake-opacity"]: opacity,
          ["--drift-start"]: `${driftStart.toFixed(2)}vw`,
          ["--drift-end"]: `${driftEnd.toFixed(2)}vw`,
        } as Snowflake["style"];
        return { id: `flake-${index}`, style };
      }),
    []
  );

  const { data, refetch } = useQuery<{
    getAllPatchUpdates: PatchItem[];
  }>(UPDATES_PATCH, { notifyOnNetworkStatusChange: true });
  useEffect(() => {
    const refetching = async () => {
      await refetch();
    };

    refetching();
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-[url(/login_bg.jpg)] bg-fixed bg-no-repeat bg-cover relative p-5">
      <style>{snowStyles}</style>
      <div className="w-full h-full absolute bg-blue-500/70 backdrop-blur-[4px]"></div>
      <div className="snow-layer z " aria-hidden="true">
        {snowflakes.map((flake) => (
          <span key={flake.id} className="snowflake" style={flake.style} />
        ))}
      </div>

      <motion.div
        className="h-full w-full bg-white/60 border backdrop-blur-sm z-50  overflow-hidden flex flex-col rounded-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h1 className="text-5xl border-b border-black bg-blue-600 font-black uppercase text-white p-5 text-center">
          Patch NOTE Updates
        </h1>

       {(() => {
          const pushed = (data?.getAllPatchUpdates || []).filter(
            (u) => u.pushPatch
          );

          const grouped = pushed.reduce<Record<string, Info[]>>((acc, cur) => {
            if (!acc[cur.type]) acc[cur.type] = [];
            acc[cur.type].push({ title: cur.title, descriptions: cur.descriptions });
            return acc;
          }, {});

          const updates: UpdatePatch[] = Object.entries(grouped).map(
            ([type, info]) => ({ type, info })
          );

          const isSingle = updates.length === 1;

          return (
            <div
              className={`h-full p-2 grid gap-2 overflow-auto ${
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
                  className={`bg-gray-200 transition-all border rounded-md shadow-md overflow-hidden ${
                    isSingle ? "w-full max-w-xl h-full" : ""
                  }`}
                >
                  <h1 className="text-3xl font-black uppercase text-white text-center border-b border-black px-2 py-2 bg-blue-600">
                    {update.type}
                  </h1>
                  <ul className="p-5 flex flex-col gap-2">
                    {update.info.map((x, index) => (
                      <div className="border rounded-md overflow-hidden shadow-md" key={index}>
                        <p className="bg-blue-600 text-white border-b border-black uppercase text-center font-black py-2">
                          {x.title}
                        </p>
                        <p className="ps-5 bg-gray-100 py-2 first-letter:uppercase font-semibold">
                          {x.descriptions}
                        </p>
                      </div>
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
