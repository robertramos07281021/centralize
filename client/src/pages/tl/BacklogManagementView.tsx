import Uploader from "../../components/Uploader"


const BacklogManagementView = () => {
  return (
    <div className="grid grid-cols-2 grid-rows-2">
      <div>
        <div>
          <h1 className="text-lg font-bold text-slate-700 text-center">Select Report</h1>
          <div>

          </div>

        </div>
        <Uploader/>

      </div>
      <div className="print:hidden"></div>

      <div className="col-span-2 border">

      </div>


    </div>
  )
}

export default BacklogManagementView