import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Loader from '../components/utils/Loader';
import Tooltip from '../components/utils/Tooltip';
import { Bar } from 'react-chartjs-2';
import * as d3 from 'd3';

const Dashboard = () => {
  const authState = useSelector(state => state.authReducer);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchData, { loading }] = useFetch();
  const chartRef = useRef();

  const fetchTasks = useCallback(() => {
    const config = { url: "/tasks", method: "get", headers: { Authorization: authState.token } };
    fetchData(config, { showSuccessToast: false }).then(data => {
      setTasks(data.tasks);
      setFilteredTasks(data.tasks);
    });
  }, [authState.token, fetchData]);

  useEffect(() => {
    if (!authState.isLoggedIn) return;
    fetchTasks();
  }, [authState.isLoggedIn, fetchTasks]);

  const handleDelete = (id) => {
    const config = { url: `/tasks/${id}`, method: "delete", headers: { Authorization: authState.token } };
    fetchData(config).then(() => fetchTasks());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    filterTasks(e.target.value);
  };

  const filterTasks = (searchTerm) => {
    const filtered = tasks.filter(task => {
      return task.description.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredTasks(filtered);
  };

  useEffect(() => {
    if (filteredTasks.length > 0) {
      const chartContainer = d3.select(chartRef.current);

      // Prepare data for visualization
      const data = filteredTasks.map((task, index) => ({
        label: `Task ${index + 1}`,
        value: task.completion,
      }));

      // Remove existing chart
      chartContainer.selectAll('*').remove();

      // Create D3.js visualization
      const width = 300;
      const height = 200;
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };

      const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.1);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .nice()
        .rangeRound([height - margin.bottom, margin.top]);

      const svg = chartContainer
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      svg.append('g')
        .attr('fill', 'steelblue')
        .selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', d => x(d.label))
        .attr('y', d => y(d.value))
        .attr('height', d => y(0) - y(d.value))
        .attr('width', x.bandwidth());

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

      return () => {
        // Clean up D3.js visualization
        chartContainer.selectAll('*').remove();
      };
    }
  }, [filteredTasks]);

  return (
    <>
      <div className="my-2 mx-auto max-w-[700px] py-4">
        {tasks.length !== 0 && <h2 className='my-2 ml-2 md:ml-0 text-xl'>Your tasks ({tasks.length})</h2>}
       
        <div>
          {loading ? (
            <Loader />
          ) : (
            <>
              {filteredTasks.length === 0 ? (
                <div className='w-[600px] h-[300px] flex items-center justify-center gap-4'>
                  <span>No tasks found</span>
                  <Link to="/tasks/add" className="bg-blue-500 text-white hover:bg-blue-600 font-medium rounded-md px-4 py-2">+ Add new task </Link>
                </div>
              ) : (
                <>
                  <div ref={chartRef} />
                  {filteredTasks.map((task, index) => (
                    <div key={task._id} className='bg-white my-4 p-4 text-gray-600 rounded-md shadow-md'>
                      <div className='flex'>
                        <span className='font-medium'>Task #{index + 1}</span>
                        <Tooltip text={"Edit this task"} position={"top"}>
                          <Link to={`/tasks/${task._id}`} className='ml-auto mr-2 text-green-600 cursor-pointer'>
                            <i className="fa-solid fa-pen"></i>
                          </Link>
                        </Tooltip>
                        <Tooltip text={"Delete this task"} position={"top"}>
                          <span className='text-red-500 cursor-pointer' onClick={() => handleDelete(task._id)}>
                            <i className="fa-solid fa-trash"></i>
                          </span>
                        </Tooltip>
                      </div>
                      <div className='whitespace-pre'>{task.description}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
