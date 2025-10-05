import {  useMutation, useQuery, useSubscription, useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
// import { FaTrash } from "react-icons/fa";
import { FaSquareCheck, FaDownload} from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../redux/store";
import React, { useCallback, useEffect, useState } from "react";
import Confirmation from "../../components/Confirmation";
import { setServerError, setSuccess } from "../../redux/slices/authSlice";
import { useLocation } from "react-router-dom";
import { IoSettingsSharp } from "react-icons/io5";
import Loading from "../Loading";
import { FaSquarePlus } from "react-icons/fa6";
import { useDropzone } from "react-dropzone";

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
  totalPrincipal: number
  target: number
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
          totalPrincipal
          target
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
  _id:string
  name: string
}

const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      _id
      name
    }
  }
`

type Data = {
  account_no: string
  amount: number
  date: string
}

const ADD_SELECTIVE = gql`
  mutation addSelective($_id: ID, $selectiveName: String, $selectives: [Selective]) {
    addSelective(_id: $_id, selectiveName: $selectiveName, selectives: $selectives) {
      message
      success
    }
  }
`
const SET_CALLFILE_TARGET = gql`
  mutation setCallfileTarget($callfile: ID!, $target: Float!) {
    setCallfileTarget(callfile: $callfile, target: $target) {
      success
      message
    }
  }
`
const CallfilesViews:React.FC<Props> = ({bucket, status, setTotalPage, setCanUpload, successUpload, setUploading}) => {
  const {limit, productionManagerPage,userLogged } = useSelector((state:RootState)=> state.auth)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const [modalTarget, setModalTarget] = useState<boolean>(false)
  const [callfileTarget,setTarget] = useState<number>(0)
  const isProductionManager = location.pathname !== '/tl-production-manager'
  const [callfileId, setCallfileId] = useState<Callfile | null>(null)
  const [addSelectiveModal, setAddSelectiveModal] = useState<boolean>(false)
  const [file, setFile] = useState<File[]>([])

  const {data, refetch,loading} = useQuery<{getCallfiles:CallFilesResult}>(GET_CALLFILES,{
    variables: {
      bucket,
      status,
      limit,
      page: productionManagerPage
    },
    skip: isProductionManager,
    notifyOnNetworkStatusChange: true,
  })

  const {data:deptBucket, refetch:bucketRefetch} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET,{skip: !Boolean(bucket)})

  useEffect(()=> {
    if(bucket) {
      const timer = async()=> {
        await refetch()
        await bucketRefetch()
      }
      timer()
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
              message: "File successfully uploaded",
              isMessage: false
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
    onData: async({data})=> {
      if(data){
        if(data.data?.newCallfile?.message === "SOMETHING_NEW_ON_CALLFILE" && userLogged?.buckets.toString().includes(data.data?.newCallfile?.bucket)) {
          await refetch()
        }
      }
    }
  })

  useSubscription<{updateOnCallfiles:SubSuccess}>(UPDATE_ON_CALLFILES,{
    onData: async({data})=> {
      if(data){
        if(data.data?.updateOnCallfiles?.message === "FINISHED_CALLFILE" && userLogged?.buckets.toString().includes(data.data?.updateOnCallfiles?.bucket)) {
          await refetch()
        }
      }
    }
  })

  const [confirm, setConfirm] = useState(false)

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "FINISHED" as "FINISHED" | "DELETE" | "DOWNLOAD" | "SET",
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
            message: data.finishedCallfile.message,
            isMessage: false
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
            message: data.deleteCallfile.message,
            isMessage: false
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

  const [setCallfileTarget, {loading:setCallfileTargetLoading}] = useMutation<{setCallfileTarget:Success}>(SET_CALLFILE_TARGET,{
    onCompleted: async(data) => {
      try {
        setConfirm(false)
        setModalTarget(false)
        const res = await refetch()
        if(res.data) {
          dispatch(setSuccess({
            success: data.setCallfileTarget.success,
            message: data.setCallfileTarget.message,
            isMessage: false
          }))
          setTarget(0)
        }
      } catch (error) {
        dispatch(setServerError(true))
        setTarget(0)
      }
    },
    onError: ()=> {
      setConfirm(false)
      setModalTarget(false)
      setTarget(0)
      dispatch(setServerError(true))
    } 
  })

  const onClickIcon = (id:string, action: "FINISHED" | "DELETE" | "DOWNLOAD" | "SET",name: string) => {
    setConfirm(true)
    const modalTxt = {
      FINISHED: `Are you sure this ${name.toUpperCase()} callfile are finished?`,
      DELETE: `Are you sure you want to delete ${name.toUpperCase()} callfile?`,
      DOWNLOAD: `Are you sure you want to download ${name.toUpperCase()} callfile?`,
      SET: `Are you sure you want to set the target ${name.toLocaleLowerCase()} callfile?`
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
            message: `${name}.csv successfully downloaded`,
            isMessage: false
          }))
        } catch (err) {
          dispatch(setServerError(true))
        }
      },
      SET: async()=> {
        await setCallfileTarget({variables: {callfile: id, target: callfileTarget}})
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


  const handleOnChangeAmount = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^0-9.]/g, '');
    const parts = inputValue.split('.');
    
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts[1]; 
    } else if (parts.length === 2) {
      inputValue = parts[0] + '.' + parts[1].slice(0, 2);
    }

    if (inputValue.startsWith('00')) {
      inputValue = '0';
    }

    if(Number(inputValue) > Number(callfileId?.totalPrincipal) ) {
      setTarget(Number(callfileId?.totalPrincipal))
    } else {
      setTarget(Number(inputValue))
    }
  },[setTarget, callfileId])

  useEffect(()=> {
    if(data) {
      setTotalPage(Math.ceil(data.getCallfiles.count/20) ) 
      const newData = data?.getCallfiles.result.map(e=> e.callfile.active).toString().includes("true")
      setCanUpload(!newData)
    } else {
      setCanUpload(true)
    }
  },[data,setTotalPage,setCanUpload])

  const [required, setRequired] = useState(false)
  const [excelData, setExcelData] = useState<Data[]>([])
  const [callfile, setCallfile] = useState<string | null>(null)

  const handleFileUpload = useCallback(async(file: File) => {
    try {
      const { read, utils } = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        const binaryString = e.target?.result;
        const workbook = read(binaryString, { type: "binary" });
        const sheetName = workbook.SheetNames[0]; 
        const sheet = workbook.Sheets[sheetName];
        const jsonData:Data[] = utils.sheet_to_json(sheet); 
        const dateConverting = jsonData.map((row) => {

          return {
            account_no: String(row.account_no),
            amount: Number(row.amount),
            date: String(row.date)
          }
        })
        setExcelData(dateConverting.slice(0,dateConverting.length)); 
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      dispatch(setServerError(true))
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [], 
      "application/vnd.ms-excel": [],
      "text/csv": [],
      "application/csv": []
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles)
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const [addSelective] = useMutation<{addSelective:Success}>(ADD_SELECTIVE,{
    onCompleted: (data) => {
      setFile([])
      dispatch(setSuccess({
        success: data.addSelective.success,
        message: data.addSelective.message,
        isMessage: false
      }))
      setCallfile(null)
      setExcelData([])
    },
    onError: (error) => {
      console.log(error)
    }
  })
  const submitSetSelective = useCallback(()=> {
    if(file.length > 0) {
      setRequired(false)
      setConfirm(true)
      setModalProps({
        message: "Are you sure you want to add this selective?",
        toggle: 'FINISHED',
        yes: async()=> {
          setConfirm(false)
          await addSelective({variables: {_id: callfile,selectiveName: file[0].name, selectives: excelData}})
          setAddSelectiveModal(false)
        },
        no: () => {
          setConfirm(false)
        }
      })
    } else {
      setRequired(true)
    }
  },[setRequired, file, callfile, addSelective, setModalProps, excelData ])


  const isLoading = downloadCallfilesLoading || deleteLoading || finishingLoading || loading || setCallfileTargetLoading

  if(isLoading) return <Loading/>

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
                const findBucket = deptBucket?.getDeptBucket.find(e=> e._id === res.callfile.bucket)

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
                    <td className="flex py-2 lg:gap-3 2xl:gap-3">
                      {
                        checkStatus &&
                        <>
                          <FaSquarePlus className=" lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" title="Add Selective" onClick={()=> {
                            setAddSelectiveModal(prev=> !prev); 
                            setCallfile(res.callfile._id)
                          }}/>

                          <FaSquareCheck className="hover:scale-110 text-green-500 lg:text-xs 2xl:text-lg cursor-pointer" onClick={()=> onClickIcon(res.callfile._id, "FINISHED", res.callfile.name)} title="Finish"/>

                          <IoSettingsSharp className="text-orange-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" title="Set Target" onClick={()=> {setModalTarget(true); setCallfileId(res.callfile)}}/>
                        </>
                      }
                      {/* <FaTrash className=" text-red-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" onClick={()=> onClickIcon(res.callfile._id, "DELETE", res.callfile.name)} title="Delete"/> */}
                      <FaDownload className="text-blue-500 lg:text-xs 2xl:text-lg cursor-pointer hover:scale-110" onClick={()=> onClickIcon(res.callfile._id, "DOWNLOAD", res.callfile.name)} title='Download' />
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
      {
        modalTarget && callfileId && 
        <div className="absolute top-0 left-0 bg-black/20 backdrop-blur-xs w-full h-full z-40 flex items-center justify-center">
          <div className="w-2/8 border h-2/5 rounded-md flex flex-col overflow-hidden border-slate-500">
            <h1 className="p-2 text-2xl bg-orange-500 text-white font-medium">
              Set Target
            </h1>
            <div className="w-full h-full bg-white flex items-center justify-center flex-col gap-8">
              <label className="flex gap-2 flex-col">
                <p className="2xl:text-2xl lg:text-lg">Enter Callfile Target:</p>
                <input 
                  type="text"
                  className="text-base border w-full px-2 py-1.5 rounded outline-0"
                  value={callfileTarget}
                  onChange={handleOnChangeAmount}
                  />
              </label>
              <div className="flex gap-5">
                <button className="w-30 bg-orange-500 py-2 rounded text-white hover:bg-orange-700 cursor-pointer" onClick={() => onClickIcon(callfileId._id,'SET',callfileId.name)}>Submit</button>
                <button className="w-30 bg-slate-500 py-2 rounded text-white hover:bg-slate-700 cursor-pointer" onClick={()=> {setModalTarget(false); setCallfileId(null); setTarget(0)}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      }
      {
        addSelectiveModal &&
        <div className="absolute top-0 left-0 bg-black/20 backdrop-blur-xs w-full h-full z-40 flex items-center justify-center">
          <div className="w-2/8 border h-2/5 rounded-md flex flex-col overflow-hidden border-slate-500">
            <h1 className="p-2 text-2xl bg-slate-500 text-white font-medium">
              Add Selectives
            </h1>
            <div className="w-full h-full bg-white flex items-center justify-center flex-col gap-8">
              <div {...getRootProps()} className={`${required && "border-red-500 bg-red-50"} border-2 border-dashed p-2 rounded-lg text-center cursor-pointer px-10 py-10 flex items-center justify-center lg:text-xs 2xl:sm`}>
                <input {...getInputProps()} />
                {
                  file.length === 0 &&
                  <>
                    {isDragActive ? (
                      <p className="text-blue-600">📂 Drop your files here...</p>
                    ) : ( 
                      <p className="text-gray-600">Drag & Drop file here or Click and select file</p>
                    )}
                  </>
                }
                {
                  file.length > 0 && (
                    <ul>
                      {file.map((file) => (
                        <li key={file.name} className="text-green-600">
                          📄 {file.name}
                        </li>
                      ))}
                    </ul>
                  )
                }
              </div>
              <div className="flex gap-5">
                <button className="w-30 bg-blue-500 py-2 rounded text-white hover:bg-blue-700 cursor-pointer" onClick={submitSetSelective}>Submit</button>
                <button className="w-30 bg-slate-500 py-2 rounded text-white hover:bg-slate-700 cursor-pointer" onClick={()=> {
                  setAddSelectiveModal(prev => !prev);
                  setFile([]);
                  setRequired(false);
                  setCallfile(null);
                  }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default CallfilesViews