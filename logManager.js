export function saveLog(userId, stats) {
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

export function deleteLog(index, callback) {
  chrome.storage.local.get(["logs"], function (result) {
    let logs = result.logs || [];
    if (index >= 0 && index < logs.length) {
      logs.splice(index, 1);
      chrome.storage.local.set({ logs: logs }, function () {
        console.log("Log deleted");
        if (callback) callback();
      });
    } else {
      console.error("Invalid log index");
    }
  });
}
