import Paid from "./Paid"
import PTP from "./PTP"
import PTPKeptTl from "./PTPKeptTl"

import TLAgentProduction from "./TLAgentProduction"
import Targets from "./Targets"
import TLDailyCollected from "./TLDailyCollected"


const TLRightDashboard = () => {
  return (
    <div className={`col-start-4  col-span-full row-span-full grid gap-2 grid-rows-4`}>
      
      <div className='grid grid-cols-4 gap-2'>

        <PTP/>

        <PTPKeptTl/>

        <Paid/>
  
        <TLDailyCollected/>
      </div>

      <div className='row-start-2 row-span-full grid grid-cols-5 gap-2'>
        <TLAgentProduction/>
        <Targets/>


 
      </div>

    </div>
  )
}

export default TLRightDashboard