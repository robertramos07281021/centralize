import { IoMdCloseCircleOutline } from "react-icons/io";
import { CurrentDispo } from "../middleware/types";

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

type AccountHistory = {
  _id: string
  account_bucket: Bucket
  case_id: string
  dpd: number
  balance: number
  account_callfile: Callfile
  endorsement_date: string
  max_dpd: number
  out_standing_details: OSD
  cd: CurrentDispo
  dispotype: Dispotype
}


type ComponentProps = {
  close: ()=> void
  histories: AccountHistory[]
}

const AccountHistoriesView:React.FC<ComponentProps> = ({histories,close}) => {
  return (
    <div className="w-full h-full z-50 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] p-10">
        <IoMdCloseCircleOutline className="text-5xl absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-slate-500 text-white" onClick={close}/>
        {
          histories.map(x=> {
            return (
            <div key={x._id} className="w-1/4 border flex flex-col p-5 h-2/6 bg-white rounded-md border-slate-500 ">
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
                    <div className="font-medium">Disposition :</div>
                    <div className="text-2xl font-medium ">{x.dispotype.name}</div>
                  </div>
                  
                  <button className="mt-4 cursor-pointer w-1/3 bg-orange-500 text-white hover:bg-orange-600 py-1.5 rounded-md ">
                    Show more...
                  </button>
                </div>
              </div>
            </div>
            )
          })
        }



     
     
    </div>
  )
}

export default AccountHistoriesView