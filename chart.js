export function displayChart() {
  const chartContainer = document.getElementById("chart-container");
  const statsContainer = document.getElementById("stats");

  chrome.storage.local.get(["logs"], function (result) {
    const logs = result.logs || [];

    if (logs.length < 2) {
      chartContainer.innerHTML = `<p class="error">차트를 표시하려면 최소 2개 이상의 로그 기록이 필요합니다.</p>`;
      chartContainer.style.display = "block";
      statsContainer.style.display = "none";
      return;
    }

    chartContainer.innerHTML = `<p>각 지표를 클릭하여 차트에서 활성화/비활성화 할 수 있습니다.</p>`;

    const oldCanvas = document.getElementById("myChart");
    if (oldCanvas) {
      oldCanvas.remove();
    }
    const canvas = document.createElement("canvas");
    canvas.id = "myChart";
    chartContainer.appendChild(canvas);

    const labels = logs.map((log) =>
      new Date(log.timestamp).toLocaleDateString()
    );
    const viewsData = logs.map((log) => log.totalViews);
    const likesData = logs.map((log) => log.totalLikes);
    const commentsData = logs.map((log) => log.totalComments);

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "총 조회수",
            data: viewsData,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            fill: false,
            tension: 0.1,
          },
          {
            label: "총 좋아요 수",
            data: likesData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: false,
            tension: 0.1,
          },
          {
            label: "총 댓글 수",
            data: commentsData,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            fill: false,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            onClick: (e, legendItem, legend) => {
              const index = legendItem.datasetIndex;
              const chart = legend.chart;
              const meta = chart.getDatasetMeta(index);
              meta.hidden = !meta.hidden;
              chart.update();
            },
            onHover: (event, legendItem, legend) => {
              const canvas = legend.chart.canvas;
              canvas.style.cursor = "pointer";
            },
            onLeave: (event, legendItem, legend) => {
              const canvas = legend.chart.canvas;
              canvas.style.cursor = "default";
            },
          },
          title: {
            display: true,
            text: "Velog 통계 추이",
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });

    chartContainer.style.display = "block";
    statsContainer.style.display = "none";
  });
}
