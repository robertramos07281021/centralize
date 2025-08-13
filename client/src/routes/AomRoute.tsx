import { Navigate,Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import Wrapper from "../components/Wrapper"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store"

const AomRoute = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  return userLogged && userLogged.type === "AOM" ? (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}

export default AomRoute
