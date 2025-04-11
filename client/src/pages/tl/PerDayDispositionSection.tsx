import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useEffect } from 'react';


type PerDay = {
  day: string
  count: string
}

type DispositionPerDay = {
  month: string
  dispositionsCount: PerDay[]
}

type PerMonth = {
  month: string
  count: string
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
        count
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
        count
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

  const options = {
    maintainAspectRatio: false,
  };

  const month = [ 
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
  const date:Record<string, number> = {
    January: 31,
    February: 29,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 31,
    December: 31
  }

  const todayMonth = new Date().getMonth()

  const BarDataPerDay = (totalDay:number) =>  {
    const data = new Array(totalDay).fill("");

    perDayDispostiion?.getDispositionPerDay.dispositionsCount.forEach((e) => {
      const dayIndex = parseInt(e.day) - 1; 
      if (dayIndex >= 0 && dayIndex < totalDay) {
        data[dayIndex] = e.count;
      }
    })

    return data
  }

  const BarDataPerMonth = (totalMonth:number) => {
    const data = new Array(12).fill("")
    perMonthDisposition?.getDispositionPerMonth.dispositionsCount.forEach((e)=> {
      const monthIndex = parseInt(e.month) - 1
      if(monthIndex >= 0 && monthIndex < totalMonth) {
        data[monthIndex] = e.count
      }
    })
    
    return data
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
            data={{
              labels: month.map((element)=> {return element.slice(0,3)}),
              datasets: [
                {
                  label: `${new Date().getFullYear()}`,
                  data: BarDataPerMonth(12),
                  backgroundColor: "rgba(255,0,22,.6)"
                },
              ]
            }}
          />
        </div>
      </div>
  )
}

export default PerDayDispositionSection
