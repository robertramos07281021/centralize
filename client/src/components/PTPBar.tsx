import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { color, month } from '../middleware/exports'




interface PTPPerMonth {
  campaign: string
  amount: number
}

const PTP_PER_MONTH = gql`
  query GetPTPPerMonth {
    getPTPPerMonth {
      campaign
      amount
    }
  }
`

interface AomDept {
  id: string
  name: string
}

const AOM_DEPT = gql`
  query getAomDept {
    getAomDept {
      id
      name
    }
  }
`

interface DataPerCampaign {
  label: string
  data: number
  color: string
}

const PTPBar = () => {

  const {data:ptpPerMonth} = useQuery<{getPTPPerMonth:PTPPerMonth[]}>(PTP_PER_MONTH)
  const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
  const [newObjectArray, setNewObjectArray] = useState<DataPerCampaign[]>([])

  useEffect(()=> {
    if(aomDeptData && ptpPerMonth) {
      const newArrayId = new Array(aomDeptData.getAomDept.length).fill({})
      aomDeptData.getAomDept.forEach((ad,index) => {
        const object:DataPerCampaign = {label: "", data: 0, color: ""}
        const findCampaignPTP = ptpPerMonth?.getPTPPerMonth.find(ppm => ppm.campaign === ad.id)
        object["label"] = ad.name
        object["data"] = findCampaignPTP?.amount || 0
        object['color'] = color[index]
        newArrayId[index] = object
      })
      setNewObjectArray(newArrayId)
    }
  },[aomDeptData,ptpPerMonth])

  const data = {
    labels: newObjectArray.map(noa=> noa.label),
    datasets: [
      {
        label: 'Collection',
        data: newObjectArray.map(nob => nob.data),
        backgroundColor:  newObjectArray.map((nob => nob.color)),
      },
    ],
  };
    
  const option = { 
    plugins: {
      datalabels:{
        display:false
      },
        legend: {
        display: false
      },
      title: {
        display: true,
        text: `PTP ${month[new Date().getMonth()]} ${new Date().getFullYear()}`,
      },
    },
    responsive: true, 
    maintainAspectRatio: false
  }

  return (
   <>
    <Bar data={data} options={option} />
   </>
  )
}

export default PTPBar