import { useQuery } from "@apollo/client"
import gql from "graphql-tag"
import { useEffect, useMemo, useRef, useState } from "react"
import { IoMdArrowDropdown } from "react-icons/io";
import {  FaDownload} from "react-icons/fa6";
import ReportsComponents from "./ReportsComponents";

interface DispositionType  {
  id: string
  name: string
  code: string

}
const GET_DISPOSITION_TYPES = gql`
  query getDispositionTypes {
    getDispositionTypes {
      id
      name
      code
    }
  }
`


const AgentReport = () => {
  const {data:dispotypeData} = useQuery<{getDispositionTypes:DispositionType[]}>(GET_DISPOSITION_TYPES)
  const dispotypeObject:{[key:string]:string} = useMemo(()=> {
    const db = dispotypeData?.getDispositionTypes || []
    return Object.fromEntries(db.map(e=> [e.id, e.name]))
  },[dispotypeData])

  const [selectedDispoAgent, setSelectedDispoAgent] = useState<string[]>([])

  const handleCheckeDisposition = (value:string, e:React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.checked) {
      setSelectedDispoAgent( prev => prev.includes(value) ? prev : [...prev, value])
    } else {
      setSelectedDispoAgent(prev => prev.filter(item => item !== value))
    }
  }

  const [date, setDate] = useState<{from:string, to:string}>({
    from: "",
    to: ""
  })

  const [popUpDispo, setPopUpDispo] = useState(false)

  const onClickPopUpDispoType = ()=> {
    setPopUpDispo(!popUpDispo)
  }

  const modalRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setPopUpDispo(false);
    }
  };
  
  useEffect(() => {
    if (popUpDispo) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popUpDispo]);


  return (
    <div className="flex h-full w-full overflow-hidden flex-col ">
      <div className="flex flex-col gap-2">
        <h1 className="p-2 text-2xl font-bold text-gray-500">Report</h1>
        <div className="flex justify-center gap-2">
          <div className="  border-2 border-slate-500 h-10 w-2/12 max-w-3/12 rounded-md relative" ref={modalRef}>
            <div className="h-full flex items-center px-2 cursor-default" onClick={onClickPopUpDispoType} title={selectedDispoAgent.map(e=> dispotypeObject[e]).join(', ')}>
              {
                selectedDispoAgent.length > 0 ? 
                  <div className="w-full truncate text-sm">
                    {selectedDispoAgent.map(e=> dispotypeObject[e]).join(', ')}
                  </div>
                :
                  <div className="w-full  text-sm">
                    Disposition Types Filter
                  </div>
              }
              <IoMdArrowDropdown className="text-2xl"/>
            </div>
            {
              popUpDispo &&
              <div className="w-full h-96 overflow-y-auto border absolute top-10 bg-white left-0 flex flex-col p-2 border-slate-300 shadow-lg shadow-black/30">
                    <label className="flex gap-2 px-2 py-1.5 text-sm">
                      <input 
                        type="checkbox" 
                        name='all'
                        id='all'
                        onChange={(e)=> {
                          if(e.target.checked){
                            const dispotype:string[] = dispotypeData?.getDispositionTypes.map(y => y.id) || []
                            setSelectedDispoAgent(dispotype)
                          } else {
                            setSelectedDispoAgent([])
                          }
                        }}
                        checked={dispotypeData?.getDispositionTypes.length === selectedDispoAgent.length}
                        />
                      <span className="select-none">SELECT ALL</span>
                    </label>
                {
                  dispotypeData?.getDispositionTypes.map((dispotype) => 
                    <label key={dispotype.id} className="flex gap-2 px-2 py-1.5 text-sm">
                      <input 
                        type="checkbox" 
                        name={dispotype.name} 
                        id={dispotype.name} 
                        onChange={(e)=> handleCheckeDisposition(dispotype.id,e)}
                        checked={selectedDispoAgent.toString().includes(dispotype.id)}
                        />
                      <span className="select-none">{dispotype.name} - {dispotype.code}</span>
                    </label>
                  )
                }
              </div>
            }
          </div>
          <div className="flex gap-5 items-center">
            <label className="flex gap-2 items-center">
              <span className="font-medium">From :</span>
              <input 
                type="date" 
                name="from" 
                id="from"
                onChange={(e)=> setDate({...date, from: e.target.value})} 
                className="border-2 border-slate-500 text-base px-2 py-1 rounded-md w-60"/>
            </label>
            <label className="flex gap-2 items-center">
              <span className="font-medium">To :</span>
              <input 
                type="date" 
                name="to" 
                id="to"  
                onChange={(e)=> setDate({...date, to: e.target.value})} 
                className="border-2 border-slate-500 text-base px-2 py-1 rounded-md w-60"/>
            </label>
            <button className="flex items-center gap-5 rounded-md border px-4 hover:scale-110 duration-200 ease-in-out cursor-pointer py-1.5 bg-blue-500 text-white font-bold ">Export <FaDownload/></button>
          </div>
        </div>
      </div>
      <ReportsComponents dispositions={selectedDispoAgent} from={date.from} to={date.to}/>
    </div>
  )
}

export default AgentReport