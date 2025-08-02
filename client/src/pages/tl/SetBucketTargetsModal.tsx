import { useMutation, useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useCallback, useEffect, useState } from "react"
import { useAppDispatch } from "../../redux/store"
import { setServerError, setSuccess } from "../../redux/slices/authSlice"

const BUCKETS = gql`
  query GetTLBucket {
    getTLBucket {
      id
      name
    }
  }
`

type Bucket = {
  id: string
  name: string
}

const SET_BUCKET_TARGETS = gql`
  mutation setBucketTargets($bucketId: ID, $targets: Targets) {
    setBucketTargets(bucketId: $bucketId, targets: $targets) {
      message
      success
    }
  }
`


type Modal = {
  cancel: () => void
  refetch: ()=> void
}

type Success = {
  success: boolean
  message: string
}

const SetBucketTargetsModal:React.FC<Modal> = ({cancel, refetch}) => {
  const dispatch = useAppDispatch()
  const {data,refetch:tlBucketRefetch} = useQuery<{getTLBucket:Bucket[]}>(BUCKETS)
  const [bucket, setBucket] = useState<string>("")
  const length = data?.getTLBucket.length && data?.getTLBucket.length > 1
  const [setBucketTargets] = useMutation<{setBucketTargets:Success}>(SET_BUCKET_TARGETS,{
    onCompleted:async(res) => {
      dispatch(setSuccess({
        success: res.setBucketTargets.success,
        message: res.setBucketTargets.message
      }))
      refetch()
    },
    onError: ()=> {
      dispatch(setServerError(true))
    }
  })


  useEffect(()=> {
    if(!length && data) {
      setBucket(data?.getTLBucket[0].id)
    }
  },[length,data])
  useEffect(()=> {
    const timer = setTimeout(async()=> {
      try {
        await tlBucketRefetch()
      } catch (error) {
        dispatch(setServerError(true))
      }
    })
    return ()=> clearTimeout(timer)
  },[tlBucketRefetch])


  const [required, setRequired] = useState<boolean>(false)

  const [targets, setTarget] = useState({
    daily: "0",
    weekly: "0",
    monthly: "0"
  })

  const handleSuccess = useCallback(async()=> {
    if(bucket) {
      await setBucketTargets({variables: {bucketId: length ? bucket : data?.getTLBucket[0].id , targets}})
      setRequired(false)
    } else {
      setRequired(true)
    }
  },[setBucketTargets, bucket, targets,setRequired])

  return (
    <div className="absolute top-0 left-0 z-50 bg-white/20 backdrop-blur-[1px] h-full w-full flex items-center justify-center">
      <div className="w-2/8 h-1/2 border border-slate-300 rounded-xl overflow-hidden bg-white flex flex-col  shadow-md shadow-black/20">
        <h1 className="py-1 text-2xl px-3 bg-orange-500 text-white font-bold ">Set Targets</h1>
        <div className="h-full w-full flex flex-col items-center justify-center gap-5">
          {
            length &&
            <label className="flex flex-col w-2/3">
              <p className="text-sm font-bold text-gray-500">Buckets:</p>
              <select 
                name="bucket" 
                id="bucket" 
                onChange={(e)=> {
                  const selected = data?.getTLBucket.find((y)=> y.name === e.target.value)
                  setBucket(selected?.id || "")
                }}
                className={`border ${required && !bucket ? "border-red-500 bg-red-50 text-red-500" : " border-slate-500"} w-full rounded-md  px-2 py-1 text-gray-500 outline-none`}>
                {
                  data && data?.getTLBucket.length > 1 &&
                  <option value="" >Select Bucket</option>
                }
                {
                  data?.getTLBucket.map((e)=> 
                    <option key={e.id} id={e.name} value={e.name}>{e.name}</option>
                  )
                }
              </select>
            </label>
          }
          <label className="flex flex-col w-2/3">
            <p className="text-sm font-bold text-gray-500">Daily:</p>
            <input type="text" 
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500 outline-none"              
              autoComplete='off'
              id='daily'
              name='daily'
              value={targets.daily}
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
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500 outline-none"
              autoComplete='off'
              id='weekly'
              name='weekly'
              value={targets.weekly}
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
              className="border w-full rounded-md border-slate-500 px-2 py-1 text-gray-500 outline-none"
              autoComplete='off'
              id='monthly'
              name='monthly'
              value={targets.monthly}
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
            <button type="button" className="bg-orange-500 hover:bg-orange-600 focus:outline-none text-white focus:ring-4 focus:ring-orange-500 font-medium rounded-lg text-sm w-24 py-2.5 me-2  cursor-pointer"  onClick={handleSuccess}>Submit</button>
            <button type="button" className="bg-gray-500 hover:bg-gray-600 focus:outline-none text-white focus:ring-4 focus:ring-gray-500 font-medium rounded-lg text-sm w-24 py-2.5 me-2  cursor-pointer"  onClick={cancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetBucketTargetsModal