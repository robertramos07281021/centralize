import { IoMdCloseCircleOutline } from "react-icons/io";

type ComponentProps = {
  close: ()=> void
}

const AccountHistoriesView:React.FC<ComponentProps> = ({close}) => {
  return (
    <div className="w-full h-full z-50 gap-5 absolute px-10 top-0 left-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-10">
      <div className="w-full border h-full bg-white rounded-md p-10 border-slate-500 relative">
        <IoMdCloseCircleOutline className="text-5xl absolute top-4 right-5 hover:scale-110 cursor-pointer hover:text-slate-500" onClick={close}/>
        <div>




        </div>
      </div>
    </div>
  )
}

export default AccountHistoriesView