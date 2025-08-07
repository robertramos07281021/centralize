import { IoMdCloseCircleOutline } from "react-icons/io";
import { CurrentDispo } from "../middleware/types";
import { useEffect, useState } from "react";

type OSD = {
  principal_os: number
  total_os: number
}

type Dispotype = {
  _id: string
  code: string
  name: string
}

type Callfile = {
  name: string
}

type Bucket = {
  name: string
}

type User = {
  _id: string
  name: string
  user_id: string
}

type AccountHistory = {
  _id: string
  balance: number
  account_bucket: Bucket
  case_id: string
  dpd: number
  account_callfile: Callfile
  endorsement_date: string
  max_dpd: number
  out_standing_details: OSD
  cd: CurrentDispo
  dispotype: Dispotype
  user: User
}


type ComponentProps = {
  close: ()=> void
  histories: AccountHistory[]
}


const FieldsComponents = ({label, value}: {label:string, value: string | number | null | undefined}) => {
  let newValue = null
  if(typeof value  === 'number') {
    newValue = value.toLocaleString('en-PH', {style: 'currency', currency: 'PHP'})
  } else {
    newValue = value 
  }
  return (
    <div>
      <h1 className="text-base font-medium text-gray-700">{label} :</h1>
      <div className={`${newValue ? "p-2" : "p-5 bg-slate-100"} border rounded-md border-slate-500 text-slate-900 font-light`}>{newValue}</div>
    </div>
  )
}


const AccountHistoriesView:React.FC<ComponentProps> = ({histories,close}) => {
  const [showMore,setShowMore] = useState<boolean>(false)
  const [selectedHistory, setSelectedHistory] = useState<AccountHistory | null>(null)
  
  const date = (date:string) => {
    const createdDate = new Date(date).toLocaleDateString()
    const time = new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    return `${createdDate} - ${time}`
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMore) {
        setShowMore(false)
      } else if (e.key === 'Escape' && !showMore) {
        close()
      } 
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setShowMore, close, showMore]);



  return (
    <>
      {
        showMore &&
        <div className="absolute top-0 left-0 bg-black/20 backdrop-blur-xs w-full h-full z-50 flex justify-center p-5">
          <IoMdCloseCircleOutline className="text-5xl  absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-black text-white hidden lg:block" onClick={()=> {setShowMore(false);setSelectedHistory(null)}}/>
          <div className="min-h-96 border lg:w-1/2 w-full bg-white rounded-lg border-slate-400 p-10 flex flex-col relative">
          <IoMdCloseCircleOutline className="text-5xl  absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-black text-black lg:hidden block" onClick={()=> {setShowMore(false);setSelectedHistory(null)}}/>
            <h1 className="text-3xl font-medium text-gray-600">{selectedHistory?.account_callfile.name}</h1>
            <h1 className="text-lg text-gray-600 font-medium">{selectedHistory?.account_bucket.name}</h1>
            <div className="h-full flex flex-col">
              
              <div className="flex gap-10 mt-5">
                <div className="w-full flex gap-2 flex-col">
                  <FieldsComponents label="Case ID" value={selectedHistory?.case_id}/>
                  <FieldsComponents label="Endorsement Date" value={selectedHistory?.endorsement_date}/>
                  <FieldsComponents label="DPD" value={selectedHistory?.dpd}/>
                </div>
                <div className="w-full flex gap-2 flex-col">
                  <FieldsComponents label="Balance" value={selectedHistory?.balance}/>
                  <FieldsComponents label="Principal" value={selectedHistory?.out_standing_details.principal_os}/>
                  <FieldsComponents label="Total OB" value={selectedHistory?.out_standing_details.total_os}/>
                </div>
              </div>
              <div className="h-full mt-5 flex gap-2 flex-col">
                <h1 className="text-2xl font-medium text-slate-600">Existing Disposition</h1>
               
                    <fieldset className="flex w-full gap-10 border p-2 rounded-md border-slate-500">
                      <legend className="px-2 text-lg font-medium text-slate-700 ">Agent Info</legend>
                      <div className="w-full">
                        <FieldsComponents label="Name" value={selectedHistory?.user.name.toUpperCase()}/>
                      </div>
                      <div className="w-full">
                        <FieldsComponents label="SIP ID" value={selectedHistory?.user.user_id}/>
                      </div>
                    </fieldset>
                <div className="h-full flex gap-10">
                  <div className="w-full flex flex-col gap-2">
                    <FieldsComponents label="Time Stamp" value={date(selectedHistory?.cd?.createdAt || "")}/>
                    <FieldsComponents label="Amount" value={selectedHistory?.cd.amount}/>
                    <FieldsComponents label="Contact Method" value={selectedHistory?.cd.contact_method.toUpperCase()}/>
                    <FieldsComponents label="Comment" value={selectedHistory?.cd.comment}/>
                  </div>
                  <div className="w-full flex gap-2 flex-col">
                    <FieldsComponents label="Disposition: " value={selectedHistory?.dispotype.name}/>
                    <FieldsComponents label="Payment" value={selectedHistory?.cd?.payment?.toString() || ""}/>
                    {
                      selectedHistory?.cd.chatApp &&
                      <FieldsComponents label="Chat App" value={selectedHistory?.cd?.chatApp.toUpperCase()}/>
                    }
                    {
                      selectedHistory?.cd.sms &&
                      <FieldsComponents label="SMS" value={selectedHistory?.cd?.sms.toUpperCase()}/>
                    }
                    {
                      selectedHistory?.cd.dialer &&
                      <FieldsComponents label="Dialer" value={selectedHistory?.cd?.dialer.toUpperCase()}/>
                    }
                    <FieldsComponents label="RFD" value={selectedHistory?.cd?.RFD?.toString() || ""}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      <div className="w-full h-full z-40 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] p-10 overflow-hidden flex flex-col">
        
          <IoMdCloseCircleOutline className="text-5xl  absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-black text-white" onClick={close}/>
          <h1 className="text-3xl font-bold text-white">Past Callfile History</h1>
          <div className="flex h-full overflow-x-auto flex-wrap gap-5">
            {
              histories.map(x=> {
                return (
                <div key={x._id} className="w-2/8 border basis-3/10 flex flex-col p-5 h-2/6 bg-white rounded-md border-slate-500 ">
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex flex-col">
                      <h1 className="text-2xl font-medium text-gray-600">{x.account_callfile.name}</h1>
                      <h1 className="text-lg text-gray-600 font-medium">{x.account_bucket.name}</h1>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex justify-between text-gray-700 items-end">
                        <div className="font-medium">Balance :</div>
                        <div className="text-2xl font-medium ">{x.balance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
                      </div>
                      <div className="flex justify-between text-gray-700 items-end">
                        <div className="font-medium">Status :</div>
                        <div className="text-2xl font-medium ">{x.dispotype.name}</div>
                      </div>
                
                      <div className="flex justify-between text-gray-700 items-end">
                        <div className="font-medium">Time Stamp :</div>
                        <div className="text-2xl font-medium ">{new Date(x.cd.createdAt).toLocaleTimeString("en-US", { month: 'short', day: '2-digit', year: 'numeric', hour: "2-digit", minute: "2-digit", hour12: true })}</div>
                      </div>
                    
                      <button className="mt-4 cursor-pointer w-1/3 bg-orange-500 text-white hover:bg-orange-600 py-1.5 rounded-md " onClick={()=> {setShowMore(true); setSelectedHistory(x)}}>
                        Show more...
                      </button>
                    </div>
                  </div>
                </div>
                )
              })
            }
          
          </div>
      </div>
    
    </>
  )
}

export default AccountHistoriesView