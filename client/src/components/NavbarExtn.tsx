import { Link, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { RootState, useAppDispatch } from "../redux/store"
import { accountsNavbar } from "../middleware/exports.ts"
import gql from "graphql-tag"
import {  useMutation, useQuery, useSubscription } from "@apollo/client"
import { setDeselectCustomer, setServerError, setSuccess } from "../redux/slices/authSlice.ts"
import { useEffect } from "react"
import client from "../apollo/client.ts"

type MyTask = {
  case_id: string
}

const MY_TASK = gql`
  query myTasks {
    myTasks {
      case_id
    }
  }
`


type SubSuccess = {
  message:string
  members:string[]
}
  
type SubSuccessMessage = {
  bucket: string
  message: string
}

const SOMETHING_ESCALATING = gql`
  subscription somethingEscalating {
    somethingChanged {
      members
      message
    }
  }
`
const TASK_CHANGING = gql`
  subscription taskChanging {
    taskChanging {
      members
      message
    }
  }
`

const DESELECT_TASK = gql`
  mutation deselectTask($id: ID!) {
    deselectTask(id: $id) {
      message
      success
    }
  }
`

const SELECTED_BUCKET_MESSAGE = gql`
  query SelectedBucket($id: ID) {
    selectedBucket(id: $id) {
      message
    }
  }
`

const NEW_BUCKET_MESSAGE = gql`
  subscription Subscription {
    newBucketMessage {
      bucket
      message
    }
  }
`

const NavbarExtn = () => {
  const {userLogged,selectedCustomer,success} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()
  const {data:myTask, refetch} = useQuery<{myTasks:MyTask[]}>(MY_TASK,{notifyOnNetworkStatusChange: true})
  const dispatch = useAppDispatch()

  useEffect(()=> {
    const refetching = async()=> {
      await refetch()
    }
    refetching()
  },[])

  const { refetch:messageRefetch } = useQuery<{selectedBucket:{message: string}}>(SELECTED_BUCKET_MESSAGE,{skip: !success.success, notifyOnNetworkStatusChange: true})


  // client.subscribe<{somethingEscalating:{members:[string],message:string}}>({query: SOMETHING_ESCALATING}).subscribe({
  //   next(data) {
  //     console.log(data)
  //   }
  // })

  useSubscription<{somethingChanged:SubSuccess}>(SOMETHING_ESCALATING, {
    onData: async({data})=> {
      if(!userLogged) return
      if(data) {
        if(data.data?.somethingChanged?.message === "TASK_SELECTION" && data.data?.somethingChanged?.members.toString().includes(userLogged._id)) {
         await refetch()
        }
      }
    },
  })
  
  useSubscription<{taskChanging:SubSuccess}>(TASK_CHANGING, {
    onData: async({data})=> {
      if(!userLogged) return
      if(data) {
        if(data.data?.taskChanging?.message === "TASK_CHANGING" && data.data?.taskChanging?.members?.toString().includes(userLogged._id)) {
          await refetch()
        }
      }
    }
  })

  useSubscription<{newBucketMessage:SubSuccessMessage}>(NEW_BUCKET_MESSAGE,{
    onData: async({data}) => {
      if(!userLogged) return
      if(data) {
        if(data.data?.newBucketMessage?.message === 'NEW_BUCKET_MESSAGE' && userLogged.buckets.includes(data.data?.newBucketMessage?.bucket)) {
          const res = await messageRefetch({id: data.data.newBucketMessage.bucket})
          if(res.data) {
            dispatch(setSuccess({
              message: res.data.selectedBucket.message,
              success: true,
              isMessage: true
            }))
          }
        }
      }
    }

  })

  


  const [deselectTask] = useMutation<{deselectTask:{message: string, success: boolean}}>(DESELECT_TASK,{
    onCompleted: ()=> {
      dispatch(setDeselectCustomer()) 
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })

  useEffect(()=> {
    if(location.pathname && selectedCustomer) {
      const id = selectedCustomer?._id;
      const timer = setTimeout(async()=> {
        await deselectTask({ variables: { id: id } })
      })
      return ()=> clearTimeout(timer)
    }
  },[location.pathname])


  const userType = userLogged?.type as keyof typeof accountsNavbar;
  if (!userType || !accountsNavbar[userType]) return null; 
  const length = myTask?.myTasks.length || 0

  return userLogged && (
    <>
      <div className="border-y border-slate-300 flex items-center justify-center text-base font-medium text-slate-500 bg-white print:hidden">
        {
          accountsNavbar[userType].map((an,index) => 
          <Link key={index} to={an.link} className="relative">
            <div className={`${index > 0 && "border-l"} ${location.pathname.includes(an.link) && "bg-slate-200"} text-xs border-slate-300 py-2  w-35 lg:w-44 text-center hover:bg-slate-200 hover:text-black/60`}>
              {an.name}
            </div>
            { 
              (an.name.includes('Panel') && length > 0) &&
              <>
                <div className="absolute text-[0.6em] w-5 h-5 flex items-center justify-center text-white rounded-full bg-red-500 -top-3 border-white border-2 -right-1 z-50">
                  {length}
                </div>
                <div className="absolute text-[0.6em] w-5 h-5 flex items-center justify-center rounded-full bg-red-500 -top-3 -right-1 z-40 animate-ping">
                </div>
              </>
            }
          </Link>
          )
        }
      </div>
    </>
  )
}

export default NavbarExtn
