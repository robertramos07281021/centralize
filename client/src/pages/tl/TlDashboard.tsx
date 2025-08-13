

import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { Navigate } from 'react-router-dom';
import PTP from './PTP';
import PTPKeptTl from './PTPKeptTl';
import Paid from './Paid';
import TLDailyCollected from './TLDailyCollected';
import TLAgentProduction from './TLAgentProduction';
import Targets from './Targets';
import DailyFTE from './DailyFTE';

const TlDashboard  = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  if(userLogged?.type === "MIS") return <Navigate to="/mis-dashboard"/>
  
  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-8 grid-cols-8 bg-slate-600/10 gap-2">

      <div className='grid grid-cols-6 gap-2 col-span-8 row-span-2'>
        <DailyFTE/>

        <PTP/>

        <PTPKeptTl/>

        <Paid/>
  
        <TLDailyCollected/>
      </div>

      <div className='col-span-full grid grid-cols-8 row-span-6 gap-2'>
        <TLAgentProduction/>
        {/* <Targets/> */}
      </div>
    </div>
  )
}

export default TlDashboard
