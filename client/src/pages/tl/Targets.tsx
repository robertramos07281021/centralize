import { useQuery } from "@apollo/client";
import { ChartOptions } from "chart.js";
import gql from "graphql-tag";
import { useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2"
import { RootState } from "../../redux/store";

import { GoDotFill } from "react-icons/go";
import { Bucket } from "./TlDashboard";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";


type Target = {
  collected: number
  totalPrincipal: number
  target:number
}

const TARGET_PER_BUCKET = gql`
  query GetTargetPerCampaign($bucket:ID,$interval: String) {
    getTargetPerCampaign(bucket:$bucket, interval:$interval ) {
      collected
      totalPrincipal
      target
    }
  }
`

const TL_BUCKET = gql`
  query GetDeptBucket {
    getDeptBucket {
      _id
      name
    }
  }
`

const Targets= () => {
  const {intervalTypes, selectedBucket} = useSelector((state:RootState)=> state.auth)
  const location = useLocation()

  const pathName = location.pathname.slice(1)
  const isTLDashboard = ['tl-dashboard','aom-dashboard']?.includes(pathName)

  const {data:targetsData, refetch} = useQuery<{getTargetPerCampaign:Target}>(TARGET_PER_BUCKET,{variables: {bucket: selectedBucket, interval: intervalTypes},skip: !isTLDashboard || !selectedBucket, notifyOnNetworkStatusChange: true})

  const {data:tlBucketData, refetch:deptBucketRefetch} = useQuery<{getDeptBucket:Bucket[]}>(TL_BUCKET,{notifyOnNetworkStatusChange: true})

  const bucketObject:{[key:string]:string} = useMemo(()=> {
    const tlBuckets = tlBucketData?.getDeptBucket || []
    return Object.fromEntries(tlBuckets.map(e=> [e._id, e.name]))
  },[tlBucketData])
  const newTargetdata = targetsData?.getTargetPerCampaign || null

  const findBucket = tlBucketData?.getDeptBucket.find(bucket => bucket._id === selectedBucket)


  useEffect(()=> {
    const timer = async () => {
      await refetch()
      await deptBucketRefetch()
    }
    if(selectedBucket) {
      timer()
    }
  },[selectedBucket, intervalTypes])

  const variance = newTargetdata ? newTargetdata?.target - newTargetdata?.collected : 0
  const callfileVariance = newTargetdata ? (newTargetdata.collected/newTargetdata.totalPrincipal) * 100 : 0

  const data = {
    labels: ['Collected', 'Target Variance','Endorsement Variance'],
    datasets: [
      {
        label: 'Amount',
        data: [newTargetdata?.collected || 0,variance],
        backgroundColor: [
          'oklch(54.6% 0.245 262.881)',
          variance > 0 ? 'oklch(70.5% 0.213 47.604)' : 'green',
          'oklch(63.7% 0.237 25.331)',
        ],
        borderColor: [
          'oklch(54.6% 0.245 262.881)',
           variance > 0 ? 'oklch(70.5% 0.213 47.604)' : 'green',
          'oklch(63.7% 0.237 25.331)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options:ChartOptions<'doughnut'> = {
    plugins: {
      datalabels: {
        color: 'oklch(0 0 0)',
        font: {
          weight: "bold", 
          size: 14,
        } as const,
        formatter: (value: number) => {
          const percent = newTargetdata ? (value/newTargetdata?.target) * 100 : 0
          return (
            (isNaN(percent) || value < 1)  ?  "" : (percent.toFixed(2) + '%') 
          )
        }
      },
      legend: {
        position: 'bottom' as const,
        display: false
      },
      title: {
        display: true,
          font: {
          size: 12,
          family: 'Arial',
          weight: 'bold',
        },
        text: [
          `${bucketObject[selectedBucket as keyof typeof bucketObject]} ${!findBucket?.principal ? ` - ${intervalTypes?.toUpperCase()}` : "" } `,

          `${newTargetdata ? newTargetdata?.collected?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : 0 } / ${newTargetdata ? newTargetdata?.totalPrincipal?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) || newTargetdata?.collected?.toLocaleString('en-PH',{style: 'currency',currency: 'PHP',}) : 0} - ${callfileVariance?.toFixed(2)}%`,

          `Target - ${newTargetdata ? newTargetdata?.target?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',}) : 0}    Variance - ${variance?.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})}`
        ],
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const currentValue = context.raw as number;
            const percentage =newTargetdata ? ((currentValue/newTargetdata?.target) * 100).toFixed(2) : 0
            return `Value: ${currentValue.toLocaleString('en-PH', {style: 'currency',currency: 'PHP',})} - ${percentage}%`;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className='col-span-2 flex bg-white rounded-xl border-slate-400 border'>
      <div className="flex-wrap flex items-center w-full h-full justify-center">
      <div  className={`flex justify-center w-full h-full py-2 px-5 relative`} >
        <GoDotFill className={`absolute top-0 left-0 text-5xl ${isNaN(callfileVariance) ? "" : callfileVariance >= 50 ? "text-green-500" : "text-red-500"} `}/>
        <Doughnut data={data} options={options} />
      </div>
      </div>
    </div>  
  )
}

export default Targets