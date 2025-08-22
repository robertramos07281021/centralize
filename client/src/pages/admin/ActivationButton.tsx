import { useMutation } from "@apollo/client"
import gql from "graphql-tag"
import { useAppDispatch } from "../../redux/store"
import { setServerError, setSuccess } from "../../redux/slices/authSlice"
import { useCallback } from "react"

type ButtonProps = {
  id: string,
  active: boolean
  refetch: ()=> void
}

const ACTIVATE_DEACTIVATE_DISPOTYPE = gql`
  mutation activateDeactivateDispotype($id: ID!) {
    activateDeactivateDispotype(id: $id) {
      success
      message
    }
  }
`

const ActivationButton:React.FC<ButtonProps> = ({id, active, refetch}) => {
  const dispatch = useAppDispatch()
  const [activateDeactivateDispotype] = useMutation<{activateDeactivateDispotype:{success:boolean, message: string}}>(ACTIVATE_DEACTIVATE_DISPOTYPE, {
    onCompleted: (res)=> {
      refetch()
      dispatch(setSuccess({
        success:res.activateDeactivateDispotype.success,
        message:res.activateDeactivateDispotype.message,
        isMessage: false
      }))
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  const handleActivate = useCallback(async()=> {
    await activateDeactivateDispotype({variables: {id}})
  },[activateDeactivateDispotype,id])

  return (
    <label className="flex h-full relative p-0.5">
      <div className={`h-4 w-8 rounded-full border bg-blue-300 border-slate-400`}>
      </div>
      <div className={`h-5 w-5 border rounded-full border-slate-300 absolute ${active ? "left-0 bg-blue-700" : "right-0 bg-slate-700" } top-0 z-50 bg-blue-700 duration-200 ease-in-out`}></div>
      <input 
        type="checkbox" 
        name="acitvation" 
        id="activation" 
        checked={active}
        hidden
        onChange={handleActivate}
        />

    </label>
  )
}

export default ActivationButton