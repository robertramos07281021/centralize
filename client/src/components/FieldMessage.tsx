import React, { useState } from "react";

const FieldMessage = () => {
  const [isMessage, setIsMessage] = useState(false);
  return (
    <div className="p-4 max-h-[90dvh] relative flex gap-2 flex-col h-full">
      <div className="flex gap-2">
        <div className="pr-4 flex py-2 bg-gray-200 rounded-full w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6 text-gray-500 mx-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>

          <input className="w-full outline-none" placeholder="Search..." />
        </div>

        <div className="bg-gray-200 items-center flex px-5 py-2 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-5 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        </div>
      </div>
      <div className="gap-2 flex flex-col">
        <div className="flex gap-4 p-2 overflow-x-auto h-full">
          <div className="h-24 w-20">
            <div className="w-full h-[80%] rounded-full  bg-gray-400 relative">
              <div className="bg-green-600 w-5 h-5 absolute bottom-0.5 border-white right-0.5 border-2 rounded-full"></div>
            </div>
            <div className="truncate  h-[20%] ">Edrian Loboeriano </div>
          </div>

          <div className="h-24 w-20">
            <div className="w-full h-[80%] rounded-full  bg-gray-400 relative">
              <div className="bg-green-600 w-5 h-5 absolute bottom-0.5 border-white right-0.5 border-2 rounded-full"></div>
            </div>
            <div className="truncate  h-[20%]">Edrian Loboeriano </div>
          </div>

          <div className="h-24 w-20">
            <div className="w-full h-[80%] rounded-full  bg-gray-400 relative">
              <div className="bg-green-600 w-5 h-5 absolute bottom-0.5 border-white right-0.5 border-2 rounded-full"></div>
            </div>
            <div className="truncate  h-[20%]">Edrian Loboeriano </div>
          </div>

          <div className="h-24 w-20">
            <div className="w-full h-[80%] rounded-full  bg-gray-400 relative">
              <div className="bg-green-600 w-5 h-5 absolute bottom-0.5 border-white right-0.5 border-2 rounded-full"></div>
            </div>
            <div className="truncate  h-[20%]">Edrian Loboeriano </div>
          </div>

          <div className="h-24 w-20">
            <div className="w-full h-[80%] rounded-full  bg-gray-400 relative">
              <div className="bg-green-600 w-5 h-5 absolute bottom-0.5 border-white right-0.5 border-2 rounded-full"></div>
            </div>
            <div className="truncate  h-[20%]">Edrian Loboeriano </div>
          </div>
        </div>
      </div>
      <div className="h-full w-full flex flex-col">
        <div
          onClick={() => setIsMessage(true)}
          className="grid grid-cols-5 gap-2 rounded-md p-2 w-full"
        >
          <div className="bg-gray-400 h-[70px] rounded-full "></div>
          <div className="flex w-full col-span-4 justify-center flex-col">
            <div className="font-semibold first-letter:uppercase">ed</div>
            <div className="flex gap-2 w-full">
              <div className="w-full truncate">
                ddsdsadsadsaadsadsadsadsadsadsadsadsasdsadsasa
              </div>
              <div className="whitespace-nowrap">11:00 pm</div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={` absolute ${isMessage ? "left-0" : "left-110"} p-4 transition-all bg-white text-black z-20 top-0  w-full h-full `}
      >
        <div onClick={() => setIsMessage(false)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FieldMessage;
