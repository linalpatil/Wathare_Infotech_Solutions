import {useEffect, useState} from 'react';
import axios from 'axios';


import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

import {Bar} from 'react-chartjs-2';
import Header from './Header';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  const options = {
    indexAxis: 'x',
    elements: {
      bar: {
        borderWidth: 2,
        backgroundColor: 'green',
      },
    },
    responsive: true,
    plugins: {
      legend: {
        position: 'left',
      },
      title: {
        display: true,
        text: 'Cycle Status',
      },
    },
  };

 
const start_time = '2024-01-21T15:00:00Z';
const end_time = '2024-01-21T16:59:50Z';
    
const BarChart =() => {
    const [data, setData] = useState(null);
    const [summary, setSummary] = useState({ ones: 0, zeros: 0, continuous: [] });


    useEffect(()=> {
        axios.get('http://localhost:5095/getData').then((res) =>{
           // console.log(res.data);
            
            if(res.data.length > 0){
                const filteredData = res.data.filter(item => {
                    const time = item.ts; 
                    return time >= start_time && time <= end_time;
                });

                let onesCount = 0;
                let zerosCount = 0;
                let continuousCounts = [];
                let lastStatus = null;
                let count = 0;
        
                filteredData.forEach((item, index) => {
                  if (item.machine_status === 1) onesCount++;
                  if (item.machine_status === 0) zerosCount++;
        
                  if (lastStatus === item.machine_status) {
                    count++;
                  } else {
                    if (lastStatus !== null) {
                      continuousCounts.push({ status: lastStatus, count: count });
                    }
                    count = 1;
                    lastStatus = item.machine_status;
                  }
        
                  if (index === filteredData.length - 1) {
                    continuousCounts.push({ status: lastStatus, count: count });
                  }
                });
        
                setData({
                    labels : filteredData.map(individualData => individualData.ts),
                    datasets:[{
                        label: '',
                        data:  filteredData.map((individualData) => individualData.machine_status),
                        backgroundColor:  filteredData.map((individualData) => {
                            if(individualData.machine_status === 1){
                                return 'green';
                            }
                            else if(individualData.machine_status === 0){
                                return 'yellow';
                            }
                            else{
                                return 'red';
                            }
                        }),
                    }]
                })

                setSummary({
                    ones: onesCount,
                    zeros: zerosCount,
                    continuous: continuousCounts
                  });
            }
            else{
                console.log("No Data Found");
            }
        }).catch((err) => {
            console.log(err.message);
        })
    })
   
    return(
        <>
        <Header></Header>
        
        <div style={{width:'80%', height:'50%'}}>
                  {data !== null ? (
        <>
          <Bar data={data} options={options} />
          <br></br>
          <div>
            <h3>Summary</h3>
            <table className="table-primary">
              <tbody>
                <tr  className="table-primary">
                  <th>Count of 1's</th>
                  <th>Count of 0's</th>
                  <th>Continuous Counts</th>
                </tr>
                <tr>
                <td>{summary.ones}</td>
                  <td>{summary.zeros}</td>
                  <td>
                    {summary.continuous.map((seq, index) => (
                      <div key={index}>
                        {seq.status === 1 ? 'Ones: ' : 'Zeros: '}{seq.count}
                      </div>
                    ))}
                  </td>
                </tr>
                
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div>"Data is Null"</div>
      )}
   
         </div>
         </>)
}

export default BarChart;

