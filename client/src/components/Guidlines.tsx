import React from 'react'

const Guidlines = () => {
  return (
    <div className="p-10 h-screen w-full" >
      <div className="bg-gray-200 overflow-hidden flex flex-col w-full border rounded-md h-full" >
        <div className="bg-gray-400 font-black uppercase text-2xl py-3 text-center border-b" >Missed Guidlines</div>
        <div className="grid p-3 grid-cols-3 h-full gap-2 " >
          <div className="border h-full bg-white rounded-sm shadow-md " ></div>
          <div className="border h-full bg-white rounded-sm shadow-md col-span-2 " ></div>


        </div>
      </div>
    </div>
  )
}

export default Guidlines
