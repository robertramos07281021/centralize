

const DispositionSection = () => {
  return (
    <div className="max-h-[400px] row-span-4 pr-5 col-span-4 flex flex-col border border-slate-300 rounded-lg overflow-y-auto">
      <table className='w-full border-collapse'>
        <thead className='sticky top-0 bg-white'>
          <tr className='text-slate-500'>
            <th className='py-1.5'>BUCKET</th>
            <th>BS</th>
            <th>ITP</th>
            <th>RC</th>
            <th>AM</th>
            <th>FUP</th>
            <th>LM</th>
            <th>RHU</th>
            <th>WN</th>
            <th>FV</th>
            <th>P</th>
            <th>RTP</th>
            <th>NA</th>
            <th>HU</th>
            <th>PTP</th>
            <th>U</th>
          </tr>
        </thead>
        <tbody>
          { Array.from({ length: 30 }, () => (
            <tr className='odd:bg-gray-100 even:bg-white text-center text-sm text-slate-500'>
              <th className="py-1.5">M2</th>
              <td>5</td>
              <td>6</td>
              <td>10</td>
              <td>20</td>
              <td>30</td>
              <td>40</td>
              <td>50</td>
              <td>80</td>
              <td>70</td>
              <td>40</td>
              <td>32</td>
              <td>75</td>
              <td>80</td>
              <td>90</td>
              <td>7</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DispositionSection
