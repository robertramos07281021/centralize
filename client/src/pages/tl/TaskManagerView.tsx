

const TaskManagerView = () => {
  const disposSample = ["DISPUTE","FOLLOW UP PAYMENT","FAILED VERIFICATION","HUNG UP","INCAPACITY TO PAY","LEAVE MESSAGE","PROMISE TO PAY","RPC CALL BACK","REFUSE TO PAY","UNDER NEGO","ANSWERING MACHINE","WRONG NUMBER","NO ANSWER","KEEP ON RINGING","OUT OF COVERAGE AREA","NOT IN SERVICE","BUSY","DECEASED","UNKNOWN"]


  



  return (
    <div className="h-full w-full p-5">
      <div className="w-full p-5 flex flex-wrap gap-10 text-sm text">
        {
          disposSample.map((e,index)=> 
            <label key={index} className="flex gap-2">

              <input  type="checkbox" name={e} id={e} value={e} />
              <p>{e}</p>

            </label>
          )
        }
      </div>
    </div>
  )
}

export default TaskManagerView