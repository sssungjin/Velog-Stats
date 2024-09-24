document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("auth-form");
  const statsContainer = document.getElementById("stats");
  const manualButton = document.getElementById("manual-button");
  const modal = document.getElementById("manual-modal");
  const closeButton = document.getElementsByClassName("close")[0];

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

      await fetchAllPostStats();
      displayStats();
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
});
