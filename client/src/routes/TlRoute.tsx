import { Navigate, Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import Wrapper from "../components/Wrapper"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"


export const TlRoute = () => {
  const {userLogged} = useSelector((state: RootState)=> state.auth)
  return userLogged?._id && (userLogged?.type === "TL" || userLogged?.type === "MIS") ? (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}
