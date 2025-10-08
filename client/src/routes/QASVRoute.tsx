import { Navigate, Outlet } from "react-router-dom"
import Navbar from "../components/Navbar.tsx"
import Wrapper from "../components/Wrapper.tsx"
import { useSelector } from "react-redux"
import { RootState } from "../redux/store.ts"


const QASVRoute = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  console.log(userLogged?.type === "QASUPERVISOR")
  return userLogged?.type === "QASUPERVISOR" ? (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : ( <Navigate to="/" /> )
}

export default QASVRoute