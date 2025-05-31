
import { Bar } from 'react-chartjs-2'
import { color, month } from '../../middleware/exports';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';




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

interface PTP_KEPT {
  campaign: string
  amount: number
}

const PTP_KEPT_OF_MONTH = gql`
  query GetPTPKeptPerMonth {
    getPTPKeptPerMonth {
      campaign
      amount
    }
  }
`

interface DataPerCampaign {
  label: string
  data: number
  color: string
}


const PTPKept = () => {
  const {data:ptpKeptData} = useQuery<{getPTPKeptPerMonth:PTP_KEPT[]}>(PTP_KEPT_OF_MONTH)
    const {data:aomDeptData} = useQuery<{getAomDept:AomDept[] }>(AOM_DEPT)
    const [newObjectArray, setNewObjectArray] = useState<DataPerCampaign[]>([])

    useEffect(()=> {
      if(aomDeptData && ptpKeptData) {
        const newArrayId = new Array(aomDeptData.getAomDept.length).fill({})
        aomDeptData.getAomDept.forEach((ad,index) => {
          const object:DataPerCampaign = {label: "", data: 0, color: ""}
          const findCampaignPTP = ptpKeptData?.getPTPKeptPerMonth.find(ppm => ppm.campaign === ad.id)
          object["label"] = ad.name
          object["data"] = findCampaignPTP?.amount || 0
          object['color'] = color[index]
          newArrayId[index] = object
        })
        setNewObjectArray(newArrayId)
      }
    },[aomDeptData,ptpKeptData])

  const data = {
    labels: newObjectArray.map(e=> e.label),
    datasets: [
      {
        label: 'Collection',
        data: newObjectArray.map(e=> e.data),
        backgroundColor: newObjectArray.map(e=> e.color),
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
        text: `PTP Kept ${month[new Date().getMonth()]} ${new Date().getFullYear()}`,
      },
    },
    responsive: true, 
    maintainAspectRatio: false
  }

  return (
    <>
      <Bar data={data} options={option}/>
    </>
  )
}

export default PTPKept