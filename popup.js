import { fetchPosts, fetchPostStats } from "./api.js";
import { displayStats, displayLogs } from "./utils.js";
import { saveLog } from "./logManager.js";
import { displayChart } from "./chart.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("auth-form");
  const statsContainer = document.getElementById("stats");
  const manualButton = document.getElementById("manual-button");
  const viewChartButton = document.getElementById("view-chart-button");
  const viewLogsButton = document.getElementById("view-logs-button");
  const chartContainer = document.getElementById("chart-container");
  const modal = document.getElementById("manual-modal");
  const closeButton = document.getElementsByClassName("close")[0];

  let accessToken = "";
  let allPosts = [];

  chrome.cookies.get(
    { url: "https://velog.io", name: "access_token" },
    function (cookie) {
      if (cookie) {
        accessToken = cookie.value;
      }
    }
  );

  // 조회하기 버튼
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = document.getElementById("userId").value;

    statsContainer.style.display = "block";
    statsContainer.innerHTML = "<p class='loading'>통계 조회 중...</p>";
    chartContainer.style.display = "none";

    try {
      if (!userId) {
        throw new Error("Velog ID를 입력해주세요.");
      }

      allPosts = await fetchAllPosts(userId, accessToken);
      const stats = await fetchAllPostStats(allPosts, accessToken);
      displayStats(statsContainer, allPosts, stats);
      saveLog(userId, stats);
    } catch (error) {
      console.error("Main error:", error);
      statsContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
    }
  });

  async function fetchAllPosts(userId, accessToken) {
    let allPosts = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchPosts(userId, accessToken, cursor);
      allPosts = allPosts.concat(result);
      if (result.length < 20) {
        hasMore = false;
      } else {
        cursor = result[result.length - 1].id;
      }

      statsContainer.innerHTML = `<p class='loading'>게시물 ${allPosts.length}개 로드 중...</p>`;
    }

    return allPosts;
  }

  async function fetchAllPostStats(allPosts, accessToken) {
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    statsContainer.innerHTML = `<p class='loading'>게시물 통계 처리 중... (0/${allPosts.length})</p>`;

    for (let [index, post] of allPosts.entries()) {
      try {
        const stats = await fetchPostStats(post.id, accessToken);
        post.views = stats.total || 0;
        totalViews += post.views;
        totalLikes += post.likes || 0;
        totalComments += post.comments_count || 0;

        statsContainer.innerHTML = `<p class='loading'>게시물 통계 처리 중... (${
          index + 1
        }/${allPosts.length})</p>`;
      } catch (postError) {
        console.error("Post stats error:", postError);
        post.views = 0;
      }
    }

    return { totalViews, totalLikes, totalComments };
  }

  // 로그 버튼
  viewLogsButton.addEventListener("click", function (e) {
    e.preventDefault();
    chartContainer.style.display = "none";
    statsContainer.style.display = "block";
    displayLogs(statsContainer);
  });

  // 차트 보기 버튼
  viewChartButton.addEventListener("click", function (e) {
    e.preventDefault();
    statsContainer.style.display = "none";
    chartContainer.style.display = "block";
    displayChart();
  });

  // 설명서/정보 버튼
  manualButton.addEventListener("click", function (e) {
    e.preventDefault();
    modal.style.display = "block";
  });

  if (closeButton) {
    closeButton.onclick = function () {
      modal.style.display = "none";
    };
  }
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
});
