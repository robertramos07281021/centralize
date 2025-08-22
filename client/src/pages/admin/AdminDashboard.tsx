import { useMutation } from "@apollo/client"
import gql from "graphql-tag"
import Loading from "../Loading"
import { useAppDispatch } from "../../redux/store"
import { setSuccess } from "../../redux/slices/authSlice"

const UPDATE_DATABASE = gql`
  mutation updateDatabase {
    updateDatabase {
      message
      success
    }
  }
`
type Success = {
  success: boolean
  message: string
}

const AdminDashboard = () => {
  const dispatch = useAppDispatch()

  const [ updateDatabase, {loading} ] = useMutation<{updateDatabase:Success}>(UPDATE_DATABASE,{
    onCompleted: (res)=> {
      const result = res.updateDatabase
      dispatch(setSuccess({
        success: result.success,
        message: result.message,
        isMessage: false
      }))
    },
    onError: (error)=> {
      console.log(error.message)
    }
  })



  if(loading) return <Loading/>

  return (
    <div className="relative">
      
      <button onClick={async()=>await updateDatabase()}>Update</button>
    </div>
  )
}

export default AdminDashboard
