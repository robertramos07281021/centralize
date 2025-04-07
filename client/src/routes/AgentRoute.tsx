import { Navigate, Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"

import Wrapper from "../components/Wrapper"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"


export const AgentRoute = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  console.log(userLogged)
  return (userLogged?._id && userLogged.type === "AGENT") ?  (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}
