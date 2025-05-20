import PaidBar from "../../components/PaidBar"
import PTPBar from "../../components/PTPBar"
import PTPKept from "../../components/PTPKept"

import { IoMdArrowDown, IoMdArrowUp  } from "react-icons/io";



const AomDashboard = () => {
 
  function widthOfMonthlyTarget(total:number, collected:number) {
    const width = (collected/total * 100)
    return `w-[${width}%]`
  }

  return (
    <div className="h-full p-2 grid grid-rows-4 grid-cols-5 bg-slate-200 gap-2">
      
      <div className="bg-white rounded-xl border border-slate-300 row-span-2 p-2 flex flex-col">
        <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm">
          Daily Collection
        </div>
        <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm grid grid-cols-4">
          <div>Campaign</div>
          <div>PTP</div>
          <div>PTP Kept</div>
          <div>Paid</div>
        </div>
        <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-400">

          <div className="grid grid-cols-4 text-center hover:bg-blue-50 cursor-default py-0.5">
            <div>Shopee M2</div>
            <div className="flex justify-center items-center"><span>4654</span> <IoMdArrowDown className="text-red-500" /> </div>
            <div className="flex justify-center items-center"><span>4654</span> <IoMdArrowUp className="text-green-500" /> </div>
            <div className="flex justify-center items-center"><span>123124</span> <IoMdArrowUp className="text-green-500"/> </div>
          </div>
        </div>

      </div>
      <div className="row-start-3 row-span-2 bg-white rounded-xl border border-slate-300 p-2">
        <h1 className="font-medium text-slate-500 text-center lg:text-xs 2xl:text-sm">Daily FTE</h1>
        <div className="text-center font-medium text-slate-500 lg:text-xs 2xl:text-sm grid grid-cols-3">
          <div>Campaign</div>
          <div>Assigned</div>
          <div>Online</div>
        </div>
        <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-400">
          <div className="grid grid-cols-3 text-center hover:bg-blue-50 cursor-default py-0.5">
            <div>Shopee M2</div>
            <div className="flex justify-center items-center"><span>2</span> </div>
            <div className="flex justify-center items-center"><span>1</span> </div>
          </div>
        </div>
      </div>
      <div className=" col-start-2 row-span-4 col-span-3 grid grid-rows-3 gap-2">
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PTPBar/>
        </div>
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PTPKept/>
        </div>
        <div className="border bg-white rounded-xl border-slate-300 p-2">
          <PaidBar/>
        </div>
      </div>

      <div className="col-start-5 border row-span-2 border-slate-300 bg-white rounded-xl">
        
      </div>

      <div className="bg-white row-span-2 rounded-xl border border-slate-300 p-2">
        <h1 className="font-medium text-slate-500 lg:text-xs 2xl:text-sm">Monthly Target</h1>
        
        <div className="lg:h-70 2xl:h-80 overflow-x-auto lg:text-[0.6em] 2xl:text-xs text-slate-500">

          <div className="flex flex-col gap-2 hover:bg-blue-50 cursor-default py-2 odd:bg-slate-100">
            <div className="text-center font-medium">Shopee M2</div>
            <div className="flex justify-center items-center flex-col">
              <div className="border w-8/9 h-4 rounded-full ">
                <div className={`rounded-full bg-red-500 h-full  ${widthOfMonthlyTarget(60000,18000)} text-center text-slate-900 font-bold `} >
                {18000/60000 * 100}%
                </div>
              </div>
              <h1 className="text-center">18000/60000</h1>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AomDashboard
