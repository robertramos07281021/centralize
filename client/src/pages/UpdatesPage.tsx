import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { CSSProperties, useEffect, useMemo } from "react";

const UPDATES_PATCH = gql`
  query getPatchUpdatesConsolidated {
    getPatchUpdatesConsolidated {
      info {
        title
        descriptions
      }
      type
    }
  }
`;

type info = {
  title: string;
  descriptions: string;
};

type UpdatePatch = {
  type: string;
  info: info[];
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
    getPatchUpdatesConsolidated: UpdatePatch[];
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

      <div className="h-full w-full bg-white/60 z-50 p-5 overflow-hidden flex flex-col">
        <h1 className="text-5xl mb-2">Patch Update</h1>

        <div className="h-full pt-3 flex flex-col gap-5 overflow-auto">
          {data?.getPatchUpdatesConsolidated.map((update, index) => {
            return (
              <div key={index} className="px-2">
                <h1 className="text-3xl">{update.type}</h1>
                <ul className="px-5">
                  {update.info.map((x, index) => {
                    return (
                      <li key={index}>
                        <p>&#9679; Title: {x.title}</p>
                        <p className="ps-5"> - {x.descriptions}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpdatesPage;
