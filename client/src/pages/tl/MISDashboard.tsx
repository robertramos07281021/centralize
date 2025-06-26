import { useSelector } from "react-redux"
import { RootState } from "../../redux/store"
import { Navigate } from "react-router-dom"


const MISDashboard = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  if(userLogged.type === "TL") return <Navigate to="/tl-dashboard"/>

  return (
    <div>MISDashboard</div>
  )
}

export default MISDashboard