import ProductionToday from './ProductionToday';
import TLRightDashboard from './TLRightDashboard';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { Navigate } from 'react-router-dom';

const TlDashboard  = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  if(userLogged.type === "MIS") return <Navigate to="/mis-dashboard"/>
  
  return (
    <div className="h-full overflow-hidden p-2 grid grid-rows-6 grid-cols-8 bg-slate-600/10 gap-2">
      <ProductionToday/>
      <TLRightDashboard/>
    </div>
  )
}

export default TlDashboard
