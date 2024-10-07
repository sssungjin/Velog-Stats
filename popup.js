import { fetchPosts, fetchPostStats } from "./api.js";
import { displayStats, displayLogs } from "./utils.js";
import { saveLog } from "./logManager.js";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("auth-form");
  const statsContainer = document.getElementById("stats");
  const manualButton = document.getElementById("manual-button");
  const modal = document.getElementById("manual-modal");
  const closeButton = document.getElementsByClassName("close")[0];
  const viewLogsButton = document.createElement("button");
  viewLogsButton.textContent = "로그";
  viewLogsButton.id = "view-logs-button";
  form.appendChild(viewLogsButton);

  statsContainer.style.display = "none";

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

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userId = document.getElementById("userId").value;

    statsContainer.style.display = "block";
    statsContainer.innerHTML = "<p class='loading'>통계 조회 중...</p>";

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

  manualButton.onclick = function () {
    modal.style.display = "block";
  };

  closeButton.onclick = function () {
    modal.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  viewLogsButton.addEventListener("click", function (e) {
    e.preventDefault();
    displayLogs(statsContainer);
  });
});
