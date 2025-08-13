import { useApolloClient, useMutation, useQuery, useSubscription, useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import { FaTrash } from "react-icons/fa";
import { FaSquareCheck, FaDownload} from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import React, { useEffect, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import Loading from "../Loading";
import { useLocation } from "react-router-dom";

type Finished = {
  name: string
}

type Callfile = {
  _id: string
  bucket: string
  name: string
  createdAt: string
  active: boolean
  endo: string
  finished_by: Finished
}

type Result = {
  callfile: Callfile
  accounts: number
  connected: number
  target: number
  collected: number
  uncontactable: number
  principal: number
  OB: number
}

type CallFilesResult = {
  result: [Result]
  count: number
}

type Success = {
  success: boolean
  message: string
}

const FINISHED_CALLFILE = gql`
  mutation FinishedCallfile($callfile: ID!) {
    finishedCallfile(callfile: $callfile) {
      success
      message
    }
  }
`

const DELETE_CALLFILE = gql `
  mutation DeleteCallfile($callfile: ID!) {
    deleteCallfile(callfile: $callfile) {
      success
      message
    }
  }
`

const GET_CALLFILES = gql`
  query getCallfiles($limit: Int!, $page: Int!, $status: String!, $bucket: ID) {
    getCallfiles(limit: $limit, page: $page, status: $status, bucket: $bucket) {
      result {
        callfile {
          _id
          name
          bucket
          createdAt
          active
          endo
          finished_by {
            name
          }
        }
        accounts
        connected
        target
        collected
        uncontactable
        principal
        OB
      }
      count
    }
  }
`

const GET_CSV_FILES = gql`
  query downloadCallfiles($callfile: ID!) {
    downloadCallfiles(callfile: $callfile)
  }
`

type Props = {
  bucket: string
  status: string
  successUpload: boolean
  setTotalPage: (e:number) => void
  setCanUpload: (e:boolean) => void
  setUploading: () => void
}

const UPDATE_ON_CALLFILES = gql`
  subscription UpdateOnCallfiles {
    updateOnCallfiles {
      message
      bucket
    }
  }
`

const NEW_UPLOADED_CALLFILE = gql`
  subscription newCallfile {
    newCallfile {
      message
      bucket
    }
  }
`

type SubSuccess = {
  message: string
  bucket: string
}



type Bucket = {
  id:string
  name: string
}

const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      id
      name
    }
  }
`
const CallfilesViews:React.FC<Props> = ({bucket, status, setTotalPage, setCanUpload, successUpload, setUploading}) => {
  const {limit, productionManagerPage,userLogged } = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const client = useApolloClient()
  const location = useLocation()

  const isProductionManager = location.pathname !== '/tl-production-manager'

  const {data, refetch,loading} = useQuery<{getCallfiles:CallFilesResult}>(GET_CALLFILES,{
    variables: {
      bucket,
      status,
      limit,
      page: productionManagerPage
    },
    skip: isProductionManager,
  })

  const {data:deptBucket} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET)

  useEffect(()=> {
    if(bucket) {
      const timer = setTimeout(async()=> {
        try {
          await refetch()
        } catch (error) {
          dispatch(setServerError(true)) 
        }
      })
      return () => clearTimeout(timer)
    }
  },[bucket,refetch])

  useEffect(()=> {
    if(successUpload) {
      const timer = setTimeout(async()=> {
        try {
          const res = await refetch()
          if(res.data) {
            dispatch(setSuccess({
              success: true,
              message: "File successfully uploaded"
            }))
            setUploading()
          }
        } catch (error) {
          dispatch(setServerError(true)) 
        }
      })
      return () => clearTimeout(timer)
    }
  },[successUpload])

  useEffect(()=> {
    if(status) {
      const timer = setTimeout(async()=> {
        await refetch()
      })
      return () => clearTimeout(timer)
    }
  },[status])

  const [downloadCallfiles, {loading:downloadCallfilesLoading}] = useLazyQuery(GET_CSV_FILES)

  useSubscription<{newCallfile:SubSuccess}>(NEW_UPLOADED_CALLFILE,{
    onData: ({data})=> {
      if(data){
        if(data.data?.newCallfile?.message === "SOMETHING_NEW_ON_CALLFILE" && userLogged?.buckets.toString().includes(data.data?.newCallfile?.bucket)) {
          client.refetchQueries({
            include: ['getCallfiles']
          })
        }
      }
    }
  })

  useSubscription<{updateOnCallfiles:SubSuccess}>(UPDATE_ON_CALLFILES,{
    onData: ({data})=> {
      if(data){
        if(data.data?.updateOnCallfiles?.message === "FINISHED_CALLFILE" && userLogged?.buckets.toString().includes(data.data?.updateOnCallfiles?.bucket)) {
          client.refetchQueries({
            include: ['getCallfiles']
          })
        }
      }
    }
  })

  const [confirm, setConfirm] = useState(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "FINISHED" as "FINISHED" | "DELETE" | "DOWNLOAD",
    yes: () => {},
    no: () => {}
  })

  const [finishedCallfile, {loading:finishingLoading}] = useMutation<{finishedCallfile:Success}>(FINISHED_CALLFILE,{
    onCompleted: async(data)=> {
      setConfirm(false)
      try {
        const res = await refetch()
        if(res.data) {
          dispatch(setSuccess({
            success: data.finishedCallfile.success,
            message: data.finishedCallfile.message
          }))
        }
      } catch (error) {
        if(error) {
          dispatch(setServerError(true))
        }
      }
    },
    onError: () => {
      setConfirm(false)
      dispatch(setServerError(true))
    }
  })

  const [deleteCallfile, {loading:deleteLoading}] = useMutation<{deleteCallfile:Success}>(DELETE_CALLFILE, {
     onCompleted: async(data)=> {
      setConfirm(false)
      try {
        const res = await refetch()
        if(res.data) {
          dispatch(setSuccess({
            success: data.deleteCallfile.success,
            message: data.deleteCallfile.message
          }))
        }
      } catch (error) {
        dispatch(setServerError(true))
      }
    },
    onError: ()=> {
      setConfirm(false)
      dispatch(setServerError(true))
    }
  })
 
  const onClickIcon = (id:string, action: "FINISHED" | "DELETE" | "DOWNLOAD",name: string) => {
    setConfirm(true)
    const modalTxt = {
      FINISHED: `Are you sure this ${name.toUpperCase()} callfile are finished?`,
      DELETE: `Are you sure you want to delete ${name.toUpperCase()} callfile?`,
      DOWNLOAD: `Are you sure you want to download ${name.toUpperCase()} callfile`
    }

    const fn = {
      FINISHED: async ()=> {
        await finishedCallfile({variables: {callfile: id}})
      } ,
      DELETE: async()=> {
        await deleteCallfile({variables: {callfile: id}})
      },
      DOWNLOAD: async()=> {
        try {
          const {data} = await downloadCallfiles({variables: {callfile: id}})
          if(!data.downloadCallfiles) {
            setConfirm(false)
            dispatch(setServerError(true))
            return
          }
          const blob = new Blob([data.downloadCallfiles],{type: 'text/csv'})
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url;
          link.setAttribute('download',`${name}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setConfirm(false)
          dispatch(setSuccess({
            success: true,
            message: `${name}.csv successfully downloaded`
          }))
        } catch (err) {
          dispatch(setServerError(true))
        }
      }
    }

    setModalProps({
      message: modalTxt[action],
      toggle: action,
      yes:fn[action],
      no: () => {
        setConfirm(false)
      }
    })
  }

  useEffect(()=> {
    if(data) {
      setTotalPage(Math.ceil(data.getCallfiles.count/20) ) 
      const newData = data?.getCallfiles.result.map(e=> e.callfile.active).toString().includes("true")
      setCanUpload(!newData)
    } else {
      setCanUpload(true)
    }
  },[data,setTotalPage,setCanUpload])

  if(downloadCallfilesLoading || deleteLoading || finishingLoading || loading) return <Loading/>

  const labels = ['Name','Bucket','Date','Endo','Work Days','Accounts','Unworkable','Connected','OB','Principal','Target','Collected','Status','Finished By','Action']

  return (
    <>
      <div className=" h-full w-full overflow-y-auto overflow-hidden flex-nowrap overflow-x-auto inline flex-col relative">
        
          
        <table className="w-full table-fixed text-left">
          <thead >
            <tr  className="bg-slate-100 text-gray-500">
              {
                labels.map((x,index )=>
                  <th className="py-1" key={index}>{x}</th>
                )
              }
            </tr>
          </thead>
          <tbody>
            {
              data?.getCallfiles?.result?.map((res,index) => {
                const date = new Date(res.callfile.createdAt);
                const today = new Date();
                const findBucket = deptBucket?.getDeptBucket.find(e=> e.id === res.callfile.bucket)

                const diffTime = today.getTime() - date.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                const checkStatus = res.callfile.active && !res.callfile.endo
                const status = checkStatus ? "Active" : "Finished"
                const finishedBy = res.callfile.finished_by ? res.callfile.finished_by.name : "-"
                return (
                  <tr key={index} className="text-xs text-gray-600">
                    <td className="truncate pr-2 col-span-2" title={res.callfile.name}>{res.callfile.name}</td>
                    <td>{findBucket?.name}</td>
                    <td>{new Date(res.callfile.createdAt).toLocaleDateString()}</td>
                    <td>{res.callfile.endo ? new Date(res.callfile.endo).toLocaleDateString() : "-" }</td>
                    <td>{diffDays}</td>
                    <td>{res.accounts}</td>
                    <td>{res.uncontactable || 0}</td>
                    <td>{res.connected}</td>
                    <td>{res.OB.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</td>
                    <td>{res.principal.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</td>
                    <td>{res.target.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</td>
                    <td>{res.collected.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}</td>
                    <td>{status}</td>
                    <td className="truncate">{finishedBy}</td>
                    <td className="flex py-2 lg:gap-3 2xl:gap-5">
                      {
                        checkStatus &&
                        <FaSquareCheck className="hover:scale-110 text-green-500 lg:text-xs 2xl:text-lg cursor-pointer" onClick={()=> onClickIcon(res.callfile._id, "FINISHED", res.callfile.name)}/>
                      }
                      <FaTrash className=" text-red-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" onClick={()=> onClickIcon(res.callfile._id, "DELETE", res.callfile.name)}/>
                      <FaDownload className="text-blue-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" onClick={()=> onClickIcon(res.callfile._id, "DOWNLOAD", res.callfile.name)}/>
                    </td>
                  </tr>
                )
              })
            }

          </tbody>
        </table>
      </div> 
      { confirm &&
        <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default CallfilesViews