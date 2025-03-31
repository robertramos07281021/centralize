import { Navigate, Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import Wrapper from "../components/Wrapper"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

export const OpsRoute = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  
  return  userLogged._id && userLogged?.type === "OPERATION" ? (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}
