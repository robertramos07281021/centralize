import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';

import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

interface DispositionCount {
  count: string
  code: string
  color: string
}

const colorDispo: { [key: string]: string } = {
  DISP: "oklch(0.704 0.191 22.216)",
  FFUP: "oklch(0.75 0.183 55.934)",
  FV: "oklch(0.828 0.189 84.429)",
  HUP: "oklch(0.852 0.199 91.936)",
  ITP: "oklch(0.841 0.238 128.85)",
  LM: "oklch(0.792 0.209 151.711)",
  PAID:"oklch(0.765 0.177 163.223)",
  PTP: "oklch(0.777 0.152 181.912)",
  RPCCB:"oklch(0.789 0.154 211.53)",
  RTP: "oklch(0.746 0.16 232.661)",
  UNEG: "oklch(0.707 0.165 254.624)",
  ANSM:"oklch(0.673 0.182 276.935)",
  WN: "oklch(0.702 0.183 293.541)",
  NOA: "oklch(0.714 0.203 305.504)",
  KOR: "oklch(0.74 0.238 322.16)",
  OCA: "oklch(0.73 0.195 45.0)",
  NIS: "oklch(0.7 0.2 340.0)",
  BUSY: "oklch(0.73 0.19 10.0)",
  DEC: "oklch(0.76 0.185 30.0)",
  UNK: "oklch(0.78 0.18 350.0)"
}


const GET_DISPOSITION_TYPES = gql`
  query Query {
    getDispositionTypes {
      id
      name
      code
    }
  }
`

const GET_ALL_DISPOSITION_COUNT = gql`
  query Query($dept: String) {
    getDeptDispositionCount(dept: $dept) {
      count
      code
    }
  }
`




const DoughnutSection = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)

  const {data:disposition} = useQuery<{getDispositionTypes:DispositionCount[]}>(GET_DISPOSITION_TYPES)

  const {data:dispositionCount} = useQuery<{getDeptDispositionCount:DispositionCount[]}>(GET_ALL_DISPOSITION_COUNT,{variables: {dept:userLogged.department}})




  const [dispositionData, setDispositionData] = useState<DispositionCount[]>([])
  const [dispositionDataObj, setDispositionDataObj] = useState<{[key: string]:string}>({})
  const [total, setTotal] = useState<number>(0)

  useEffect(()=> {
    if(dispositionCount?.getDeptDispositionCount) {
    
      const newData = dispositionCount?.getDeptDispositionCount.map((ddc)=> ({
        code: ddc.code,
        count: ddc.count,
        color: colorDispo[ddc.code] || "#ccc",
      }))
      const newDataObject:{[key: string]:string} = {}

      dispositionCount?.getDeptDispositionCount.forEach((ddc)=> {
        newDataObject[ddc.code] = ddc.count
      })
      
      setTotal(dispositionCount?.getDeptDispositionCount.map((ddc)=> parseInt(ddc.count)).reduce((total, value)=> {
        return total + value;
      }))

      setDispositionDataObj(newDataObject)
      setDispositionData(newData)
    }

  },[dispositionCount])


  const dataLabels = dispositionData.map(d=> d.code)
  const dataCount = dispositionData.map(d => d.count)
  const dataColor = dispositionData.map(d=> d.color)
  const data = {
    labels: dataLabels,
    datasets: [{
      label: 'Count',
      data: dataCount,
      backgroundColor: dataColor,
      hoverOffset: 4
    }]
  };

  const options = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 12,
        } as const,
        formatter: (value: number) => {return value === 0 ? "" :  `${value}`},
      },
      legend: {
        position: 'bottom' as const,
        display: false
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };




  return (
    <div className="col-span-3 row-span-3 flex items-center justify-between text-center">
      <div className="text-xs">
        <div  className='grid grid-cols-6 py-0.5 text-slate-800  font-medium'>
          <div className="col-span-2">Code</div>
          <div></div>
          <div>Count</div>
          <div></div>
          <div>Percentage</div>
        </div>
        {
          disposition?.getDispositionTypes?.map((d,index)=>{
            const codeExists = dispositionData.map((dd)=> dd.code)

            return codeExists.includes(d.code) && (
              <div key={index} className='grid grid-cols-6 py-0.5 text-slate-800 '>
                <div className="font-medium col-span-2 " style={{backgroundColor: `${colorDispo[d.code]}`}}>{d.code}</div>
                <div>-</div>
                <div>{dispositionDataObj[d.code] || 0}</div>
                <div>-</div>
                <div>{(parseInt(dispositionDataObj[d.code])/total * 100).toPrecision(4)}%</div>
              </div>
            )
          } 
          )
        }
      </div>
      <div className='2xl:h-full lg:h-3/5'>
        <Doughnut data={data} options={options}/>
      </div>
  </div>
  )
}

export default DoughnutSection
