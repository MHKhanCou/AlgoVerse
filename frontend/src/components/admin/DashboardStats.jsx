import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardStats = ({ stats }) => {
  const statsChartData = {
    labels: ['Users', 'Algorithms', 'Blogs', 'Progress'],
    datasets: [
      {
        label: 'Counts',
        data: [
          stats?.total_users || 0,
          stats?.total_algorithms || 0,
          stats?.total_blogs || 0,
          stats?.user_progress || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Dashboard Statistics' },
    },
  };

  return (
    <section>
      <h2>Dashboard Stats</h2>
      {stats ? (
        <>
          <div className="stats-chart">
            <Bar data={statsChartData} options={chartOptions} />
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p>{stats.total_users || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Algorithms</h3>
              <p>{stats.total_algorithms || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Blogs</h3>
              <p>{stats.total_blogs || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Total Progress Entries</h3>
              <p>{stats.user_progress || 0}</p>
            </div>
          </div>
        </>
      ) : (
        <p>No stats available.</p>
      )}
    </section>
  );
};

export default DashboardStats;