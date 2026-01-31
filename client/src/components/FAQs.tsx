import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store.ts";

const Item = [
  {
    title: "Dashboard",
    children: [
      {
        name: "What is the RPC (Daily) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the TOTAL PTP (Daily) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the KEPT (Daily) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the RPC (Monthly) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the TOTAL PTP (Monthly) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the KEPT (Weekly) on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the Month Graph on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the Year Graph on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the overall performance month on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the Bucket on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
      {
        name: "What is the Date & Time on dashboard?",
        description:
          "The RPC is the fucking right person to call, pa ulit ulit nalang kayong mga agent.",
        imagename: "rpc.png",
      },
    ],
  },
  {
    title: "Customer Interaction Panel",
    children: [
      { name: "CIP 1", description: "lorem ipsum dolor sit amet" },
      { name: "CIP 2", description: "lorem" },
    ],
  },

  {
    title: "Reports",
    children: [
      { name: "CIP 1", description: "lorem ipsum dolor sit amet" },
      { name: "CIP 2", description: "lorem" },
    ],
  },
];

const FAQs = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(
    null as null | (typeof Item)[0],
  );
  const [userRole, setUserRole] = useState(false);
  const { userLogged } = useSelector((state: RootState) => state.auth);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const role = userLogged?.role || "AGENT";
  return (
    <div className="p-4 w-full relative h-full flex">
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <div className="absolute p-4 top-0 left-0  w-full h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute top-0 left-0 z-10 cursor-pointer w-full h-full bg-black/40 backdrop-blur-sm"
            ></motion.div>
            <div className="relative w-full h-full z-30">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-blue-200 flex flex-col w-full overflow-hidden h-full border-2 z-20 border-blue-800 rounded-md shadow-md "
              >
                <div
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 p-1 cursor-pointer bg-red-600 rounded-full border-2 text-white border-red-800 right-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="bg-blue-500 uppercase p-4 border-b-2 border-blue-800 text-2xl text-white font-black text-center">
                  {selectedItem.title}
                </div>
                <div className="p-4 grid grid-cols-2 overflow-auto gap-2  h-full">
                  {selectedItem.children.map((child, idx) => (
                    <motion.div
                      layout
                      key={idx}
                      onClick={() =>
                        setOpenFaqIdx(openFaqIdx === idx ? null : idx)
                      }
                      className=" text-white cursor-pointer  relative"
                      transition={{ type: "spring" }}
                    >
                      <div
                        className={` ${openFaqIdx ? "h-auto" : "h-full"} bg-blue-500  transition-all hover:bg-blue-600 p-3 border-2 border-blue-800 rounded `}
                      >
                        <div className="font-bold text-lg">{child.name}</div>
                        <div className=" text-base">{child.description}</div>
                        {openFaqIdx === idx && (
                          <div>
                            {child.imagename && (
                              <img
                                src={
                                  child.imagename.startsWith("http")
                                    ? child.imagename
                                    : `/fieldimages/${child.imagename}`
                                }
                                alt={child.name}
                                className="max-h-80 w-full mt-2 rounded shadow-md"
                              />
                            )}
                          </div>
                        )}

                        {openFaqIdx !== idx && (
                          <div className=" absolute text-xs right-10 bottom-0 ">
                            Click to view image
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-2 flex flex-col border-blue-800 w-full bg-blue-200 rounded-md overflow-hidden"
      >
        <div className="bg-blue-500 w-full text-center py-2 text-white font-black uppercase border-b-2 border-blue-800 text-2xl">
          knowledge base
        </div>
        <div className="flex flex-col gap-2 h-full  p-4">
          {role === "TL" && (
            <div className="flex gap-2 justify-end ">
              <div className="bg-blue-100 border-2 overflow-hidden flex relative  border-blue-800 rounded-md shadow-md">
                <div className={`  z-20 flex font-black uppercase  `}>
                  <div
                    className={`${userRole ? "text-blue-800 cursor-pointer" : "text-white"} px-3 py-1`}
                    onClick={() => setUserRole(false)}
                  >
                    AGENT
                  </div>
                  <div
                    className={`${userRole ? "text-white" : "cursor-pointer text-blue-800"} duration-500 px-3 py-1`}
                    onClick={() => setUserRole(true)}
                  >
                    TL
                  </div>
                </div>
                <div
                  className={` ${userRole ? "-right-11" : " right-10"} duration-500 w-[85px] transition-all bg-blue-600 h-full z-10 absolute top-0  `}
                ></div>
              </div>
            </div>
          )}

          <div className="h-full grid grid-cols-4 gap-2 grid-rows-2">
            {Item.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedItem(item);
                  setIsModalOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 transition-all cursor-pointer border-2 border-blue-800 text-2xl justify-center items-center flex text-shadow-2xs p-4 rounded-md shadow-md font-black uppercase text-white "
              >
                <div className="text-xl">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FAQs;
