import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useEffect } from 'react';
import { date, month, options } from '../../middleware/exports';


type PerDay = {
  day: string
  amount: string
}

type DispositionPerDay = {
  month: string
  dispositionsCount: PerDay[]
}

type PerMonth = {
  month: string
  amount: string
}

type DispositionPerMonth = {
  year: string
  dispositionsCount: PerMonth[]
}

const PER_DAY_DISPOSITION = gql`
  query Query($dept:String) {
    getDispositionPerDay(dept:$dept) {
      dispositionsCount {
        day
        amount
      }
      month
    }
  }
`

const PER_MONTH_DISPOSITION = gql`
  query Query($dept:String) {
    getDispositionPerMonth(dept:$dept){
      dispositionsCount {
        month
        amount
      }
      year
    }
  }

`

const PerDayDispositionSection = () => {
  const {userLogged} = useSelector((state:RootState)=> state.auth)
  const {data:perDayDispostiion, refetch:perDayRefetch} = useQuery<{getDispositionPerDay:DispositionPerDay}>(PER_DAY_DISPOSITION,{variables: {dept:userLogged.department}})
  const {data:perMonthDisposition, refetch:perMonthRefetch} = useQuery<{getDispositionPerMonth:DispositionPerMonth}>(PER_MONTH_DISPOSITION,{variables: {dept:userLogged.department}})

  useEffect(()=> {
    const refetch = () => {
      perDayRefetch();
      perMonthRefetch();
    }
    const refetchInterval = setInterval(refetch,1000)
    return () => clearInterval(refetchInterval)
  },[perDayRefetch,perMonthRefetch])




  
  const todayMonth = new Date().getMonth()

  const BarDataPerDay = (totalDay:number) =>  {
    const data = new Array(totalDay).fill("");

    perDayDispostiion?.getDispositionPerDay.dispositionsCount.forEach((e) => {
      const dayIndex = parseInt(e.day) - 1; 
      if (dayIndex >= 0 && dayIndex < totalDay) {
        data[dayIndex] = e.amount === '0' ? "" : (parseFloat(e.amount).toFixed(2)).toString() ;
      }
    })
    return data
  }

  const dataPerMonth = {
    labels: month.map((element)=> {return element.slice(0,3)}),
    datasets: [
      {
        label: `${new Date().getFullYear()}`,
        data: (() => {
            const data = new Array(month.length).fill("")
            perMonthDisposition?.getDispositionPerMonth.dispositionsCount.forEach((e)=> {
              const monthIndex = parseInt(e.month) - 1
              if(monthIndex >= 0 && monthIndex < month.length) {
                data[monthIndex] = (parseFloat(e.amount).toFixed(2)).toString()
              }
            })
            return data
          }
        )(),
        backgroundColor: "rgba(255,0,22,.6)"
      },
    ]
  }

  const monthlyDate = (month:string) => {
    const days = [];
    for (let x = 1; x <= date[month as keyof typeof date]; x++) {
      days.push(x);
    }
    return days;
  };

  return (
      <div className="row-start-4 row-span-3 col-span-4 grid grid-rows-2 gap-5 ">
      
        <div className=' bg-white rounded-md border border-slate-300 p-2'>
          <Bar options={options}
            data={{
              labels: monthlyDate(month[todayMonth]),
              datasets: [
                {
                  label: month[todayMonth],
                  data: BarDataPerDay(date[month[todayMonth]]),
                  backgroundColor: "rgba(255,0,22,.6)"
                },
              ]
            }}
          />
        </div>
        <div className='bg-white rounded-md border border-slate-300 p-2'>
        <Bar options={options}
            data={dataPerMonth}
          />
        </div>
      </div>
  )
}

export default PerDayDispositionSection
