import { Doughnut } from 'react-chartjs-2';

const DoughnutSection = () => {
  const Disposition = [
    { code: "BS", count: 4, color: "oklch(0.704 0.191 22.216)"},
    { code: "ITP", count: 6, color: "oklch(0.75 0.183 55.934)"},
    { code: "RC", count: 7, color: "oklch(0.828 0.189 84.429)"},
    { code: "AM", count: 7, color: "oklch(0.852 0.199 91.936)"},
    { code: "FUP", count: 8, color: "oklch(0.841 0.238 128.85)"},
    { code: "LM", count: 3, color: "oklch(0.792 0.209 151.711)"},
    { code: "RHU", count: 5, color: "oklch(0.765 0.177 163.223)"},
    { code: "WN", count: 9, color: "oklch(0.777 0.152 181.912)"},
    { code: "FV", count: 5, color: "oklch(0.789 0.154 211.53)"},
    { code: "P", count: 9, color: "oklch(0.746 0.16 232.661)"},
    { code: "RTP", count: 10, color: "oklch(0.707 0.165 254.624)"},
    { code: "NA", count: 8, color: "oklch(0.673 0.182 276.935)"},
    { code: "HU", count: 6, color: "oklch(0.702 0.183 293.541)"},
    { code: "PTP", count: 12, color: "oklch(0.714 0.203 305.504)"},
    { code: "U", count: 6, color: "oklch(0.74 0.238 322.16)"},
  ]

  const dataLabels = Disposition.map(d=> d.code)
  const dataCount = Disposition.map(d => d.count)
  const dataColor = Disposition.map(d=> d.color)
  const data = {
    labels: dataLabels,
    datasets: [{
      label: 'My First Dataset',
      data: dataCount,
      backgroundColor: dataColor,
      hoverOffset: 4
    }]
  };

  return (
    <div className="col-span-2 row-span-3 flex items-center justify-center text-center ">
    <Doughnut data={data}/>
  </div>
  )
}

export default DoughnutSection
