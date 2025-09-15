import React from 'react';

const PreviewPane: React.FC = () => {
  const dashboardHtml = `
    <html>
      <head>
        <script src='https://cdn.jsdelivr.net/npm/chart.js'></script>
      </head>
      <body>
        <div style="padding: 20px;">
          <h2 style="margin-bottom: 20px;">Sample Dashboard Metrics</h2>
          <canvas id="myChart" width="400" height="200"></canvas>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Tasks', 'Chats', 'Metrics'],
                datasets: [{
                  label: 'Counts',
                  data: [50, 30, 100],
                  backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
          </script>
        </div>
      </body>
    </html>
  `;

  return (
    <iframe
      srcDoc={dashboardHtml}
      className="w-full h-full border-0"
      title="Preview Dashboard"
    />
  );
};

export default PreviewPane;
