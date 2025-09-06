export function displayChart() {
  const chartContainer = document.getElementById("chart-container");
  const statsContainer = document.getElementById("stats");

  chrome.storage.local.get(["logs"], function (result) {
    const allLogs = result.logs || [];

    if (allLogs.length < 2) {
      chartContainer.innerHTML = `<p class="error">차트를 표시하려면 최소 2개 이상의 로그 기록이 필요합니다.</p>`;
      chartContainer.style.display = "block";
      statsContainer.style.display = "none";
      return;
    }

    // 기존 내용을 지우고 UI 요소를 동적으로 생성합니다.
    chartContainer.innerHTML = "";

    // 도움말 아이콘과 메시지를 담을 컨테이너 생성
    const helpContainer = document.createElement("div");
    helpContainer.style.position = "relative";
    helpContainer.style.textAlign = "right";
    helpContainer.style.marginBottom = "5px";

    // 도움말 아이콘 생성
    const helpIcon = document.createElement("span");
    helpIcon.textContent = "?";
    helpIcon.style.display = "inline-flex";
    helpIcon.style.justifyContent = "center";
    helpIcon.style.alignItems = "center";
    helpIcon.style.width = "16px";
    helpIcon.style.height = "16px";
    helpIcon.style.borderRadius = "50%";
    helpIcon.style.backgroundColor = "#e0e0e0";
    helpIcon.style.color = "#666";
    helpIcon.style.cursor = "pointer";
    helpIcon.style.fontWeight = "bold";
    helpIcon.style.fontSize = "12px";
    helpContainer.appendChild(helpIcon);

    chartContainer.appendChild(helpContainer);

    // 도움말 메시지 박스 생성 (초기에는 숨김)
    const helpMessage = document.createElement("div"); // p에서 div로 변경하여 여러 줄 처리
    helpMessage.innerHTML = `
        <ul style="margin: 0; padding-left: 20px; text-align: left;">
            <li>각 지표(범례)를 클릭하여 차트에서 활성화/비활성화 할 수 있습니다.</li>
            <li>차트 기능 업데이트(1.9.0) 이전에 저장된 일부 로그는 데이터 형식이 달라 차트에서 0으로 표시될 수 있습니다.</li>
        </ul>
    `;
    helpMessage.style.display = "none";
    helpMessage.style.position = "absolute";
    helpMessage.style.right = "0";
    helpMessage.style.top = "20px"; // 아이콘 바로 아래에 위치
    helpMessage.style.zIndex = "10";
    helpMessage.style.fontSize = "12px";
    helpMessage.style.color = "#333";
    helpMessage.style.backgroundColor = "#f9f9f9";
    helpMessage.style.border = "1px solid #ddd";
    helpMessage.style.borderRadius = "4px";
    helpMessage.style.padding = "10px";
    helpMessage.style.width = "280px"; // 너비 지정
    helpMessage.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    helpContainer.appendChild(helpMessage);

    // 도움말 아이콘 클릭 이벤트 리스너 추가
    helpIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      const isHidden = helpMessage.style.display === "none";
      helpMessage.style.display = isHidden ? "block" : "none";
    });

    // 다른 곳을 클릭하면 도움말 메시지 숨기기
    document.addEventListener("click", (e) => {
      if (!helpContainer.contains(e.target)) {
        helpMessage.style.display = "none";
      }
    });

    const oldCanvas = document.getElementById("myChart");
    if (oldCanvas) {
      oldCanvas.remove();
    }
    const canvas = document.createElement("canvas");
    canvas.id = "myChart";
    chartContainer.appendChild(canvas);

    const labels = allLogs.map((log) =>
      new Date(log.timestamp).toLocaleDateString()
    );

    const sanitizeData = (value) =>
      typeof value === "number" && !isNaN(value) ? value : 0;

    const viewsData = allLogs.map((log) => sanitizeData(log.totalViews));
    const likesData = allLogs.map((log) => sanitizeData(log.totalLikes));
    const commentsData = allLogs.map((log) => sanitizeData(log.totalComments));

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
            beginAtZero: true,
          },
        },
      },
    });

    chartContainer.style.display = "block";
    statsContainer.style.display = "none";
  });
}
