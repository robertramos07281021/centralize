import { Bar } from 'react-chartjs-2';

const PerDayDispositionSection = () => {

  const options = {
    maintainAspectRatio: false, // Allows custom width & height
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

  const monthToDate = () => {
    return month[todayMonth]
  }

  const monthlyDate = (month:string) => {
    const days = [];
    for (let x = 1; x <= date[month as keyof typeof date]; x++) {
      days.push(x);
    }
    return days;
  };

  return (
<div className="row-start-4 row-span-4 col-span-4  ">
        <p>
          {monthToDate()}
        </p>
        <div className='w-full h-11/12 '>
          <Bar options={options}
            data={{
              labels: monthlyDate(month[todayMonth]),
              datasets: [
                {
                  label: "Disposition",
                  data: [250,325,469,298,671,383,465,155,265,367,655],
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
