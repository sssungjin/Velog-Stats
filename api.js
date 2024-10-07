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

export async function fetchPosts(userId, accessToken, cursor = null) {
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

export async function fetchPostStats(postId, accessToken) {
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
