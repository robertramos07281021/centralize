import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { RootState } from '../redux/store.ts'
import Navbar from '../components/Navbar.tsx'
import Wrapper from '../components/Wrapper.tsx'

const QARoute = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  return userLogged?.type === "QA" ? (
    <Wrapper>
      <Navbar/>
      <Outlet/>
    </Wrapper>
  ) : (
    <Navigate to="/"/>
  )
}

export default QARoute