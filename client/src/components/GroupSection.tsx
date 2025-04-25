import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useEffect, useState } from "react";
import { FaPlusCircle, FaMinusCircle  } from "react-icons/fa";
import SuccessToast from "./SuccessToast";
import Confirmation from "./Confirmation";
import { setSelectedGroup } from "../redux/slices/authSlice";
import { useAppDispatch } from "../redux/store";


interface Success {
  success: boolean,
  message: string
}

interface Member {
  _id: string
  name: string
  user_id: string
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
}

const CREATE_GROUP = gql`
mutation CreateGroup($name: String!, $description: String!) {
  createGroup(name: $name, description: $description) {
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
      }
    }
  }
`

const DEPT_AGENT = gql`
  query Query{
  findDeptAgents {
    _id
    name
    user_id
    group
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

const GroupSection = () => {
  const dispatch = useAppDispatch()
  const [success, setSuccess] = useState<Success>({
    success:false,
    message: ""
  })
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [confirm, setConfirm] = useState<boolean>(false)
  const [addMember, setAddMember] = useState(false)
  const [groupName, setGroupName] = useState<string>("")
  const [required, setRequire] = useState(false)
  const [groupRequired, setGroupRequired] = useState(false)
  const {data:deptGroupData, refetch:deptGroupDataRefetch} = useQuery<{findGroup:Group[]}>(DEPT_GROUP)
  const {data:deptAgentData, refetch:deptAgentDataRefetch} = useQuery<{findDeptAgents:DeptAgent[]}>(DEPT_AGENT)
  const [dgdObject, setDgdObject] = useState<{[key: string]:string}>({})
  const selectedGroup = deptGroupData?.findGroup.find((dgd)=> dgd.name === groupName)
  const [dgdObjectName, setdgdObjectName] = useState<{[key: string]:string}>({})

  useEffect(()=> {
    dispatch(setSelectedGroup(groupName))
  },[groupName,dispatch])

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
      setSuccess({
        success: result.createGroup.success,
        message: result.createGroup.message
      })
      deptGroupDataRefetch()
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
      await addGroupMember({variables: {addGroupMemberId: dgdObject[groupName],member:memberId}})
    } catch (error) {
      console.log(error)
    }
  }

  const handleAddMemberTransition = () => {
    if(!addMember) {
      if(!groupName) {
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
      await deleteGroupMember({variables: {id: dgdObject[groupName], member: memberId}})
    } catch (error) {
      console.log(error) 
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
          <button type="button" className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-xs px-5 h-10 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" onClick={onSubmitCreateGroup}>Add Group</button>
        </div>
        <div className="flex items-center gap-5 relative lg:text-[0.6em] 2xl:text-xs">
          {
            groupName &&
            <>
              <div>
                <FaPlusCircle  className={`${addMember && "rotate-45"} peer text-3xl transition-transform `} onClick={handleAddMemberTransition}/>
                <p className="peer-hover:block hidden absolute text-xs -translate-x-1/2 left-4 -top-5 font-bold text-slate-700 bg-white">{addMember ? "Close" : "Add Member"}</p>
              </div>
              <div>
                <FaMinusCircle className="peer text-3xl text-red-700"/>
                <p className="peer-hover:block hidden absolute text-xs translate-x-1/2 -left-2  -top-5 font-bold text-slate-700 bg-white">Delete Group</p>
              </div>
            </>
          }
          {
            !addMember ? (
            <label>
              <select 
                id="group" 
                name="group" 
                value={groupName}
                className={`${groupRequired ? "border-red-500 bg-red-50" : "bg-gray-50 border-gray-300"} border text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block lg:w-50 2xl:w-96 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
                onChange={(e) => {setGroupName(e.target.value); setGroupRequired(false)}}
                >
                <option value="">Select Group</option>
                {
                  deptGroupData?.findGroup?.map((dgd) => (
                    <option key={dgd._id} value={dgd.name}>{dgd.name}</option>
                  ))
                }
              </select>
            </label>
            ) : (
              <div className=" ps-3.5 h-10 pe-0 lg:w-50 2xl:w-96 border border-slate-300 rounded-lg bg-slate-50 cursor-default flex justify-between items-center"><p>{groupName}</p> </div>
            )
          }
          {
            addMember &&
            <>
              <div className="bg-white z-10 lg:w-50 2xl:w-96 absolute border -translate-x-full -left-2 h-96 top-0 rounded-lg border-slate-300 shadow-lg shadow-black/15 p-3 flex flex-col">
                <p className="font-bold text-slate-700">Agent</p>
                <div className="h-full overflow-y-auto mt-2 text-slate-700">
                  {
                    deptAgentData?.findDeptAgents.map(da=> (
                      <div key={da._id} className="grid grid-cols-3 text-center py-1.5  odd:bg-slate-100">
                        <p>{da.name}</p>
                        <p>{da.user_id}</p>
                        <p className="flex justify-center ">{da.group ? dgdObjectName[da.group] : <FaPlusCircle className="lg:text-base 2xl:text-lg text-green-500" onClick={() => handleAddGroupMember(da._id)} />}</p></div>
                    ))
                  }
                </div>

              </div>
              <div className="bg-white z-10 lg:w-50 2xl:w-96 absolute border right-0 h-96 top-12 rounded-lg border-slate-300 shadow-lg shadow-black/15 p-2 grid grid-rows-3">
                <div className="flex flex-col overflow-y-auto">
                  <h1 className="font-bold text-slate-700">Description</h1>
                  <div className="indent-5 mt-2 flex flex-col overflow-y-auto text-justify px-2">
                    {
                      selectedGroup?.description
                    }
                  </div>

                </div>
                <div className=" flex flex-col ">
                  <h1 className="font-bold text-slate-700">Member{selectedGroup?.members &&  selectedGroup?.members?.length > 1 ? "s" : ""}</h1>
                  <div className="h-full flex flex-col overflow-y-auto">
                    {
                      selectedGroup?.members.map((m)=> (
                        <div key={m._id} className="grid grid-cols-3 text-center odd:bg-slate-100 py-1">
                          <div>
                            {m.name}
                          </div>
                          <div>
                            {m.user_id}
                          </div>
                          <div className="flex justify-center">
                          <FaMinusCircle className="lg:text-base 2xl:text-lg text-red-500" onClick={()=> handleDeleteMember(m._id)}/>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="font-bold text-slate-700">Tasks</h1>
                  <div className="mt-2 flex flex-col overflow-y-auto">

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