import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { FaPlusCircle, FaMinusCircle, FaEdit  } from "react-icons/fa";
import SuccessToast from "./SuccessToast";
import Confirmation from "./Confirmation";
import { setSelectedGroup } from "../redux/slices/authSlice";
import { RootState, useAppDispatch } from "../redux/store";
import { useSelector } from "react-redux";


interface Success {
  success: boolean,
  message: string
}

interface Member {
  _id: string
  name: string
  user_id: string
  buckets: string[]
}
interface Group {
  _id:string
  name:string
  description:string
  members: Member[]
}

interface DeptAgent {
  _id: string
  name: string
  user_id: string
  group: string
  buckets: string[]
}




const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!, $description: String!) {
    createGroup(name: $name, description: $description) {
      message
      success
    }
  }
`

const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id) {
      success
      message
    }
  }
`
const UPDATE_GROUP = gql`
  mutation DeleteGroup($id: ID!, $name: String, $description: String) {
    updateGroup(id: $id, name: $name, description: $description) {
      message
      success
    }
  }

`


const DEPT_GROUP = gql`
  query Query {
    findGroup {
      _id
      name
      description
      members {
        _id
        name
        user_id
        buckets
      }
    }
  }
`

const DEPT_AGENT = gql`
  query FindAgents {
    findAgents {
      _id
      name
      user_id
      group
      buckets 
    }
  }
`
const ADD_GROUP_MEMBER = gql`
  mutation AddGroupMember($addGroupMemberId: ID!, $member: ID!) {
    addGroupMember(id: $addGroupMemberId, member: $member) {
      message
      success
    }
  }
`

const DELETE_GROUP_MEMBER = gql`
  mutation Mutation($id: ID!, $member: ID!) {
  deleteGroupMember(id: $id, member: $member) {
    message
    success
  }
}
`

interface Bucket {
  id:string
  name: string
  dept: string
}

const GET_DEPT_BUCKETS = gql`
  query Query {
    getDeptBucket {
      id
      name
      dept
    }
  }
`


const GroupSection = () => {
  const dispatch = useAppDispatch()
  const {selectedGroup} = useSelector((state:RootState)=> state.auth)
  const [success, setSuccess] = useState<Success>({
    success:false,
    message: ""
  })
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [confirm, setConfirm] = useState<boolean>(false)
  const [addMember, setAddMember] = useState(false)
  const [required, setRequire] = useState(false)
  const [groupRequired, setGroupRequired] = useState(false)
  const {data:deptGroupData, refetch:deptGroupDataRefetch} = useQuery<{findGroup:Group[]}>(DEPT_GROUP)
  const {data:deptAgentData, refetch:deptAgentDataRefetch} = useQuery<{findAgents:DeptAgent[]}>(DEPT_AGENT)
  const selectedGroupData = deptGroupData?.findGroup.find((dgd)=> dgd.name === selectedGroup)
  const [dgdObject, setDgdObject] = useState<{[key: string]:string}>({})
  const [dgdObjectName, setdgdObjectName] = useState<{[key: string]:string}>({})
  const [updatedGroup, setUpdateGroup] = useState<boolean>(false)

    const [bucketObject, setBucketObject] = useState<{[key:string]:string}>({})
    const {data:deptBucketData} = useQuery<{getDeptBucket:Bucket[]}>(GET_DEPT_BUCKETS)
  
    useEffect(()=> {

      if(deptBucketData) {
        const newObject:{[key:string]:string} = {}
        deptBucketData?.getDeptBucket?.map((b) => 
          newObject[b.id] = b.name
        )
        setBucketObject(newObject)
      }
    },[ deptBucketData])


  useEffect(()=> {
    setUpdateGroup(false)
  },[selectedGroup])
  
  useEffect(()=> {
    if(updatedGroup){
      setName(selectedGroupData? selectedGroupData?.name : "")
      setDescription(selectedGroupData ? selectedGroupData?.description : "")
    } else {
      setName("")
      setDescription("")
    }
  },[updatedGroup,selectedGroupData])


  useEffect(()=> {
    if(deptGroupData) {
      const newDataObject:{[key: string]: string} = {}
      deptGroupData.findGroup.forEach(dgd => 
        newDataObject[dgd.name] = dgd._id
      )
      setDgdObject(newDataObject)
      const newDataObjectName:{[key: string]: string} = {}
      deptGroupData.findGroup.forEach(dgd => 
        newDataObjectName[dgd._id] = dgd.name
      )
      setdgdObjectName(newDataObjectName)
    }
  },[deptGroupData])

//mutations ============================================================================
  const [createGroup] = useMutation(CREATE_GROUP,{
    onCompleted:(result) => {
      setName("")
      setDescription("")
      setConfirm(false)
      deptGroupDataRefetch()
      setSuccess({
        success: result.createGroup.success,
        message: result.createGroup.message
      })
    },
  })

  const [updateGroup] = useMutation(UPDATE_GROUP, {
    onCompleted:(result) => {
      setName("")
      setDescription("")
      setConfirm(false)
      dispatch(setSelectedGroup(""))
      deptGroupDataRefetch()
      setUpdateGroup(false)
      setSuccess({
        success: result.updateGroup.success,
        message: result.updateGroup.message
      })
    },
  })

  const [deleteGroup] = useMutation(DELETE_GROUP,{
    onCompleted:(result) => {
      setName("")
      deptGroupDataRefetch()
      setDescription("")
      deptAgentDataRefetch()
      dispatch(setSelectedGroup(""))
      setConfirm(false)
      setAddMember(false)
      setSuccess({
        success: result.deleteGroup.success,
        message: result.deleteGroup.message
      })
    },
  })
  
  const [addGroupMember] = useMutation(ADD_GROUP_MEMBER,{
    onCompleted:() => {
      deptGroupDataRefetch()
      deptAgentDataRefetch()
    },
  })

  const [deleteGroupMember] = useMutation(DELETE_GROUP_MEMBER, {
    onCompleted:() => {
      deptGroupDataRefetch()
      deptAgentDataRefetch()
    },
  })

//mutations end =========================================================================  

  const [modalProps, setModalProps] = useState({
    message: "",
    toggle: "CREATE" as "CREATE" | "UPDATE" | "DELETE" | "LOGOUT",
    yes: () => {},
    no: () => {}
  })

  const onSubmitCreateGroup = () => {
    if(!name) {
      setRequire(true)
    } else { 
      setRequire(false)
      setConfirm(true)
      setModalProps({
        message: "Do you want to add this group?",
        toggle: "CREATE",
        yes: async() => {
          try {
            await createGroup({variables: {name, description}})
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error:any) {
            const errorMessage = error?.graphQLErrors?.[0]?.message;
            if (errorMessage?.includes("E11000")) {
              setSuccess({
                success: true,
                message: "Group name already exists"
              })
              setConfirm(false)
            }
          }
        },
        no: ()=> {setConfirm(false)}
      })
    }
  }
  
  const handleAddGroupMember = async(memberId:string) => {
    try {
      await addGroupMember({variables: {addGroupMemberId: dgdObject[selectedGroup],member:memberId}})
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddMemberTransition = () => {
    if(!addMember) {
      if(!selectedGroup) {
        setGroupRequired(true)
      } else {
        setGroupRequired(false)
        setAddMember(true)
      }
    } else {
      setAddMember(false)
    }
  }

  const handleDeleteMember = async(memberId:string) => {
    try {
      await deleteGroupMember({variables: {id: dgdObject[selectedGroup], member: memberId}})
    } catch (error) {
      console.log(error) 
    }
  } 

  const handleClickDeleteGroup = () => {
    setConfirm(true)  
    setModalProps({
      message: "Do you want to delete this group?",
      toggle: "DELETE",
      yes: async() => {
        try {
          await deleteGroup({variables: {id: dgdObject[selectedGroup]}})
        } catch (error) {
         console.log(error)
        }
      },
      no: ()=> {setConfirm(false)}
    })
  }

  const handleClickUpdateGroupSubmit = () => {
    if (!name) {
      setRequire(true)
    } else {
      setRequire(false)
      setConfirm(true)  
      setModalProps({
        message: "Do you want to update this group?",
        toggle: "UPDATE",
        yes: async() => {
          try {
            await updateGroup({variables: {id: dgdObject[selectedGroup], name: name, description: description}})
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error:any) {
            const errorMessage = error?.graphQLErrors?.[0]?.message;
            if (errorMessage?.includes("E11000")) {
              setSuccess({
                success: true,
                message: "Group name already exists"
              })
              setConfirm(false)
            }
          }
        },
        no: ()=> {setConfirm(false)}
      })

    }
  }
  return (
    <>
      {
        success?.success &&
        <SuccessToast successObject={success || null} close={()=> setSuccess({success:false, message:""})}/>
      }
      <div className=" flex justify-end w-full gap-5 items-end flex-col">
        <div className="flex gap-5">
          <input 
            type="text" 
            name="name" 
            id="name" 
            autoComplete="false"
            value={name}
            className={`border ${required ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-50"}  rounded-md lg:px-1.5 lg:py-1  2xl:py-1.5 2xl:px-2  lg:w-50 2xl:w-70 lg:text-[0.6em] 2xl:text-xs`}
            onChange={(e)=> setName(e.target.value)}
            placeholder="Enter Group Name..."/>
          <input 
            type="text" 
            name="discription" 
            id="discription"
            autoComplete="false"
            value={description}
            className="border border-slate-300 bg-slate-50 rounded-md lg:px-1.5 lg:py-1  2xl:py-1.5 2xl:px-2 lg:w-70 2xl:w-96 2xl:text-xs lg:text-[0.6em]"
            onChange={(e)=> setDescription(e.target.value)}
            placeholder="Enter Group Description..."/>
            {
              !updatedGroup ? 
              <button type="button" className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs px-5 h-10 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" onClick={onSubmitCreateGroup}>Add Group</button> : 
              <div className="flex gap-4 ">

                <button type="button" className="focus:outline-none text-white bg-orange-700 hover:bg-orange-800 focus:ring-4 focus:ring-orange-300 font-medium rounded-lg text-xs px-5 h-10 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-green-800" onClick={handleClickUpdateGroupSubmit}>Submit</button>  
                <button type="button" className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700" onClick={()=> setUpdateGroup(false)}>Cancel</button>  
              </div>
            }
        </div>
        <div className="flex items-center gap-5 relative lg:text-[0.6em] 2xl:text-xs">
          {
            selectedGroup &&
            <>
              <div>
                <FaPlusCircle  className={`${addMember && "rotate-45"} peer text-3xl transition-transform hover:scale-105 cursor-pointer `} onClick={handleAddMemberTransition}/>
                <p className="peer-hover:block hidden absolute text-xs -translate-x-1/2 left-4 -top-5 font-bold text-slate-700 bg-white ">{addMember ? "Close" : "Add Member"}</p>
              </div>
              <div>
                <FaEdit className="peer w-8 h-8 border rounded-full p-1 bg-orange-400 text-white hover:scale-105 cursor-pointer " onClick={()=> setUpdateGroup(true)}/>
                <p className="peer-hover:block hidden absolute text-xs -translate-x-1/2 left-16 -top-5 font-bold text-slate-700 bg-white">Update Group</p>
              </div>
              <div>
                <FaMinusCircle className="peer text-3xl text-red-700 hover:scale-105 cursor-pointer" onClick={handleClickDeleteGroup}/>
                <p className="peer-hover:block hidden absolute text-xs translate-x-1/2 left-10 -top-5 font-bold text-slate-700 bg-white">Delete Group</p>
              </div>
              
            </>
          }
          {
            !addMember ? (
        
              <select 
                id="group" 
                name="group" 
                value={selectedGroup}
                className={`${groupRequired ? "border-red-500 bg-red-50" : "bg-gray-50 border-gray-300"} border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block lg:w-50 2xl:w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                onChange={(e) => { dispatch(setSelectedGroup(e.target.value)); setGroupRequired(false)}}
                >
                <option value="" >Select Group</option>
                {
                  deptGroupData?.findGroup?.map((dgd) => (
                    <option key={dgd._id} value={dgd.name}>{dgd.name}</option>
                  ))
                }
              </select>
            
            ) : (
              <div className=" ps-3.5 h-10 pe-0 lg:w-50 2xl:w-96 border border-slate-300 rounded-lg bg-slate-50 cursor-default flex justify-between items-center"><p>{selectedGroup}</p> </div>
            )
          }
          {
            addMember &&
            <>
              <div className="bg-white z-10 lg:w-50 2xl:w-96 absolute border -translate-x-full -left-2 h-96 top-0 rounded-lg border-slate-300 shadow-lg shadow-black/15 p-3 flex flex-col">
                <p className="font-bold text-slate-700">Agent</p>
                <div className="h-full overflow-y-auto mt-2 text-slate-700">
                  {
                    deptAgentData?.findAgents.map(da=> (
                      <div key={da._id} className="grid grid-cols-5 text-center py-1.5  odd:bg-slate-100">
                        <p className="cursor-default">{da.user_id}</p>
                        <p className="text-nowrap truncate uppercase cursor-default" title={da.name.toUpperCase()}>{da.name}</p>
                        <p className="col-span-2 cursor-default">{da.buckets.map((e)=>bucketObject[e] ).join(', ')}</p>
                        <p className="flex justify-center cursor-default">{da.group ? dgdObjectName[da.group] : <FaPlusCircle className="lg:text-base 2xl:text-lg text-green-500" onClick={() => handleAddGroupMember(da._id)} />}</p></div>
                    ))
                  }
                </div>
              </div>
              <div className="bg-white z-10 lg:w-50 2xl:w-96 absolute border right-0 h-96 top-12 rounded-lg border-slate-300 shadow-lg shadow-black/15 p-2 grid grid-rows-3">
                <div className="flex flex-col overflow-y-auto">
                  <h1 className="font-bold text-slate-700">Description</h1>
                  <div className="indent-5 mt-2 flex flex-col overflow-y-auto text-justify px-2">
                    {
                      selectedGroupData?.description
                    }
                  </div>

                </div>
                <div className=" flex flex-col ">
                  <h1 className="font-bold text-slate-700">Member{selectedGroupData?.members && selectedGroupData?.members?.length > 1 ? "s" : ""}</h1>
                  <div className="h-full flex flex-col overflow-y-auto">
                    {
                      selectedGroupData?.members.map((m)=> (
                        <div key={m._id} className="grid grid-cols-5 text-center odd:bg-slate-100 py-1">
                          <p className="cursor-default">
                            {m.user_id}
                          </p>
                          <p className="uppercase text-nowrap truncate cursor-default" title={m.name.toUpperCase()}>
                            {m.name}
                          </p>
                          <p className="col-span-2 cursor-default">
                            {m.buckets.map((e)=> bucketObject[e]).join(', ')}
                          </p>
                          <p className="flex justify-center">
                          <FaMinusCircle className="lg:text-base 2xl:text-lg text-red-500" onClick={()=> handleDeleteMember(m._id)}/>
                          </p>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
              </div>
            </>
          }
        </div>
      </div>
      { confirm &&
      <Confirmation {...modalProps}/>
      }
    </>
  )
}

export default GroupSection