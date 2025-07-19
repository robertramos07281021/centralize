import { useMutation, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch } from '../../redux/store'
import { setServerError } from '../../redux/slices/authSlice'

type Props = {
  agentToUpdate: string | null
  cancel: () => void
  success: (message: string, success: boolean) => void
}

const AGENT = gql`
  query getUser($id: ID) {
    getUser(id: $id) {
      targets {
        daily
        weekly
        monthly
      }
    }
  }
`
type Target = {
  daily: number
  weekly: number
  monthly: number
}

const SET_TARGETS = gql`
  mutation setTargets($userId: ID, $targets: Targets) {
    setTargets(userId: $userId, targets: $targets) {
      message
      success
    }
  }
`



const SetTargetsModal:React.FC<Props> = ({agentToUpdate, cancel, success}) => {
  const dispatch = useAppDispatch()
  const {data:agentData, refetch} = useQuery<{getUser: {targets: Target}}>(AGENT, {variables:{id: agentToUpdate}})

  const [targets, setTarget] = useState({
    daily: "0",
    weekly: "0",
    monthly: "0"
  })

  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await refetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })

    return () => clearTimeout(timer)
  },[refetch])

  useEffect(()=> {
    if(agentData?.getUser?.targets) {
      setTarget({
        daily:  agentData?.getUser.targets.daily?.toString() || "0",
        weekly: agentData?.getUser.targets.weekly.toString() || "0",
        monthly: agentData?.getUser.targets.monthly.toString() || "0"
      })
    }

  },[agentData])

  const [setTargets] = useMutation<{setTargets: {message: string, success: boolean}}>(SET_TARGETS,{
    onCompleted: (res) => {
      success(res.setTargets.message, res.setTargets.success)
    }
  })

  const handleSubmitTargets = useCallback(async()=> {
    await setTargets({variables: {userId: agentToUpdate, targets}})
  },[targets, setTargets])


  return (
    <div className="absolute top-0 left-0 z-50 bg-white/20 backdrop-blur-[1px] h-full w-full flex items-center justify-center">
      <div className="w-2/8 h-1/2 border border-slate-300 rounded-xl overflow-hidden bg-white flex flex-col  shadow-md shadow-black/20">
        <h1 className="py-1 text-2xl px-3 bg-orange-500 text-white font-bold ">Set Targets</h1>
        <div className="h-full w-full flex flex-col items-center justify-center gap-5">
          <label className="flex flex-col w-2/3">
            <p className="text-sm font-bold text-gray-500">Daily:</p>
            <input type="text" 
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500"
              value={targets.daily}
              autoComplete='off'
              id='daily'
              name='daily'
              onChange={(e) => {
                const regex = /^[1-9]\d*$/;
                const val = e.target.value;
                if (val === "" || regex.test(val)) {
                  setTarget({...targets, daily: val });
                }
              }}
            />
          </label>
          <label className="flex flex-col w-2/3">
            <p className="text-sm font-bold text-gray-500">Weekly:</p>
            <input type="text" 
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500"
              value={targets.weekly}
              autoComplete='off'
              id='weekly'
              name='weekly'
              onChange={(e) => {
                const regex = /^[1-9]\d*$/;
                const val = e.target.value;
                if (val === "" || regex.test(val)) {
                  setTarget({...targets, weekly: val });
                }
              }}
            />
          </label>
          <label className="flex flex-col w-2/3">
            <p className="text-sm font-bold text-gray-500">Monthly:</p>
            <input type="text" 
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500"
              value={targets.monthly}
              autoComplete='off'
              id='monthly'
              name='monthly'
              onChange={(e) => {
                const regex = /^[1-9]\d*$/;
                const val = e.target.value;
                if (val === "" || regex.test(val)) {
                  setTarget({...targets, monthly: val });
                }
              }}
            />
          </label>
          <div className='flex gap-5'>
            <button type="button" className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-500 font-medium rounded-lg text-sm w-24 py-2.5 me-2  cursor-pointer" onClick={handleSubmitTargets}>Submit</button>
            <button type="button" className="bg-gray-500 hover:bg-gray-600 focus:outline-none text-white focus:ring-4 focus:ring-gray-500 font-medium rounded-lg text-sm w-24 py-2.5 me-2  cursor-pointer" onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetTargetsModal