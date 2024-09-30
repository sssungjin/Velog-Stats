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

      allPosts = [];
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

      const stats = await fetchAllPostStats();
      displayStats();
      saveLog(userId, stats);
    } catch (error) {
      console.error("Main error:", error);
      statsContainer.innerHTML = `<p class="error">오류 발생: ${error.message}</p>`;
    }
  });

  async function fetchAllPostStats() {
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

  function displayStats(sortedPosts = null) {
    const postsToDisplay = sortedPosts || allPosts;
    const { totalViews, totalLikes, totalComments } = postsToDisplay.reduce(
      (acc, post) => ({
        totalViews: acc.totalViews + post.views,
        totalLikes: acc.totalLikes + (post.likes || 0),
        totalComments: acc.totalComments + (post.comments_count || 0),
      }),
      { totalViews: 0, totalLikes: 0, totalComments: 0 }
    );

    statsContainer.innerHTML = `
      <div class="summary">
        <h2>통계</h2>
        <p>총 게시물 수: ${postsToDisplay.length}</p>
        <p>총 조회수: ${totalViews.toLocaleString()}</p>
        <p>총 좋아요: ${totalLikes.toLocaleString()}</p>
        <p>총 댓글: ${totalComments.toLocaleString()}</p>
        <div class="sort-buttons">
          <button id="sort-views">조회수 순</button>
          <button id="sort-likes">좋아요 순</button>
          <button id="sort-comments">댓글 순</button>
        </div>
      </div>
      <h3>게시물 별 통계</h3>
    `;

    postsToDisplay.forEach((post) => {
      statsContainer.innerHTML += `
        <div class="post-item">
          <strong>${post.title}</strong><br>
          조회수: ${post.views.toLocaleString()}, 좋아요: ${
        post.likes || 0
      }, 댓글: ${post.comments_count || 0}
        </div>
      `;
    });

    // Add event listeners to sort buttons
    document.getElementById("sort-views").addEventListener("click", () => {
      const sortedPosts = [...allPosts].sort((a, b) => b.views - a.views);
      displayStats(sortedPosts);
    });

    document.getElementById("sort-likes").addEventListener("click", () => {
      const sortedPosts = [...allPosts].sort(
        (a, b) => (b.likes || 0) - (a.likes || 0)
      );
      displayStats(sortedPosts);
    });

    document.getElementById("sort-comments").addEventListener("click", () => {
      const sortedPosts = [...allPosts].sort(
        (a, b) => (b.comments_count || 0) - (a.comments_count || 0)
      );
      displayStats(sortedPosts);
    });
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

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  async function fetchPosts(userId, accessToken, cursor = null) {
    const response = await sendMessage({
      action: "fetchData",
      url: "https://v2.velog.io/graphql",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        operationName: "Posts",
        variables: { username: userId, tag: null, cursor: cursor },
        query: `
          query Posts($cursor: ID, $username: String, $tag: String) {
            posts(cursor: $cursor, username: $username, tag: $tag) {
              id
              title
              likes
              comments_count
            }
          }
        `,
      },
    });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }
    return response.data.posts;
  }

  async function fetchPostStats(postId, accessToken) {
    const response = await sendMessage({
      action: "fetchData",
      url: "https://v2.velog.io/graphql",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        operationName: "GetStats",
        variables: { post_id: postId },
        query: `query GetStats($post_id: ID!) {
          getStats(post_id: $post_id) {
            total
          }
        }`,
      },
    });

    if (response.errors) {
      throw new Error(response.errors[0].message);
    }
    return response.data.getStats;
  }

  // 새로운 함수: 로그 저장
  function saveLog(userId, stats) {
    const log = {
      userId: userId,
      timestamp: new Date().toISOString(),
      totalViews: stats.totalViews,
      totalLikes: stats.totalLikes,
      totalComments: stats.totalComments,
    };

    chrome.storage.local.get(["logs"], function (result) {
      let logs = result.logs || [];
      logs.push(log);
      chrome.storage.local.set({ logs: logs }, function () {
        console.log("Log saved");
      });
    });
  }

  viewLogsButton.addEventListener("click", function (e) {
    e.preventDefault(); // 폼 제출 방지
    displayLogs();
  });

  // 정렬 상태 변수 (기본값: 내림차순)
  let isAscending = false;

  // ... (이전 코드 유지)

  function displayLogs() {
    chrome.storage.local.get(["logs"], function (result) {
      let logs = result.logs || [];

      logs = logs.map((log, index) => ({ ...log, originalIndex: index }));

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

      logs.forEach((log, displayIndex) => {
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
          displayLogs();
        });

      document.querySelectorAll(".delete-log-btn").forEach((btn) => {
        btn.addEventListener("click", function (event) {
          event.stopPropagation();
          const index = parseInt(this.getAttribute("data-index"));
          deleteLog(index);
        });
      });
    });
  }

  function deleteLog(index) {
    chrome.storage.local.get(["logs"], function (result) {
      let logs = result.logs || [];
      if (index >= 0 && index < logs.length) {
        logs.splice(index, 1);
        chrome.storage.local.set({ logs: logs }, function () {
          console.log("Log deleted");
          displayLogs();
        });
      } else {
        console.error("Invalid log index");
      }
    });
  }
});
