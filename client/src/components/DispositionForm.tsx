

const DispositionForm = () => {
  return (
    <div className="flex flex-col">
      <h1 className="text-center text-lg text-slate-700 font-bold">Customer Disposition</h1>
      <div className="grid grid-cols-2 mt-10">
        <div className="flex flex-col gap-2">
          <label className="flex gap-2 items-center">
            <p className="text-gray-800 font-bold text-sm">Amount</p>
            <input type="text" name="amount" id="amount" className="p-1.5 border rounded-lg border-slate-500 w-80"/>
          </label>
          <label className="flex gap-2 items-center">
            <p className="text-gray-800 font-bold text-sm">Payment</p>
            <select name="" id="" className="p-1.5 border rounded-lg border-slate-500 w-80">
              <option value="">select payment</option>
              <option value="partial">Partial</option>
              <option value="full">Full</option>
            </select>
          </label>
        </div>
        <div>

        </div>
      </div>
      <div className=" ">
        
      </div>
    </div>
  )
}

export default DispositionForm