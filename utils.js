import { deleteLog } from "./logManager.js";

export function displayStats(statsContainer, allPosts, stats) {
  statsContainer.innerHTML = `
    <div class="summary">
      <h2>통계</h2>
      <p>총 게시물 수: ${allPosts.length}</p>
      <p>총 조회수: ${stats.totalViews.toLocaleString()}</p>
      <p>총 좋아요: ${stats.totalLikes.toLocaleString()}</p>
      <p>총 댓글: ${stats.totalComments.toLocaleString()}</p>
      <div class="sort-buttons">
        <button id="sort-views">조회수 순</button>
        <button id="sort-likes">좋아요 순</button>
        <button id="sort-comments">댓글 순</button>
      </div>
    </div>
    <h3>게시물 별 통계</h3>
  `;

  displayPosts(statsContainer, allPosts);

  addSortEventListeners(statsContainer, allPosts, stats);
}

function displayPosts(statsContainer, posts) {
  const postsContainer = document.createElement("div");
  postsContainer.className = "posts-container";

  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className = "post-item";
    postElement.innerHTML = `
      <strong>${post.title}</strong><br>
      조회수: ${post.views.toLocaleString()}, 좋아요: ${
      post.likes || 0
    }, 댓글: ${post.comments_count || 0}
    `;
    postsContainer.appendChild(postElement);
  });

  statsContainer.appendChild(postsContainer);
}

function addSortEventListeners(statsContainer, allPosts, stats) {
  document.getElementById("sort-views").addEventListener("click", () => {
    const sortedPosts = [...allPosts].sort((a, b) => b.views - a.views);
    displayStats(statsContainer, sortedPosts, stats);
  });

  document.getElementById("sort-likes").addEventListener("click", () => {
    const sortedPosts = [...allPosts].sort(
      (a, b) => (b.likes || 0) - (a.likes || 0)
    );
    displayStats(statsContainer, sortedPosts, stats);
  });

  document.getElementById("sort-comments").addEventListener("click", () => {
    const sortedPosts = [...allPosts].sort(
      (a, b) => (b.comments_count || 0) - (a.comments_count || 0)
    );
    displayStats(statsContainer, sortedPosts, stats);
  });
}

export function displayLogs(statsContainer) {
  chrome.storage.local.get(["logs"], function (result) {
    let logs = result.logs || [];
    let isAscending = false;

    logs = logs.map((log, index) => ({ ...log, originalIndex: index }));

    function sortAndDisplayLogs() {
      logs.sort((a, b) => {
        return isAscending
          ? new Date(a.timestamp) - new Date(b.timestamp)
          : new Date(b.timestamp) - new Date(a.timestamp);
      });

      let logsHtml = `
        <div class="log-header-container">
          <button id="sort-button" class="sort-btn">
            시간순 정렬: ${isAscending ? "▲" : "▼"}
          </button>
        </div>
      `;

      logs.forEach((log) => {
        logsHtml += `
          <div class="log-card" data-index="${log.originalIndex}">
            <div class="log-content">
              <span class="log-item"><strong>조회 시간:</strong> ${new Date(
                log.timestamp
              ).toLocaleString()}</span>
              <span class="log-item"><strong>총 조회수:</strong> ${log.totalViews.toLocaleString()}</span>
              <span class="log-item"><strong>총 좋아요:</strong> ${log.totalLikes.toLocaleString()}</span>
              <span class="log-item"><strong>총 댓글:</strong> ${log.totalComments.toLocaleString()}</span>
            </div>
            <button class="delete-log-btn" data-index="${
              log.originalIndex
            }">🗑️</button>
          </div>
        `;
      });

      statsContainer.innerHTML = logsHtml;
      statsContainer.style.display = "block";

      document
        .getElementById("sort-button")
        .addEventListener("click", function () {
          isAscending = !isAscending;
          sortAndDisplayLogs();
        });

      document.querySelectorAll(".delete-log-btn").forEach((btn) => {
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          const index = parseInt(this.getAttribute("data-index"));
          deleteLog(index, () => {
            logs = logs.filter((log) => log.originalIndex !== index);
            sortAndDisplayLogs();
          });
        });
      });
    }

    sortAndDisplayLogs();
  });
}
