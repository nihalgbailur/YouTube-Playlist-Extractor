document.getElementById("extract-btn").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url.includes("youtube.com/playlist")) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: extractPlaylistURLs,
        },
        (result) => {
          const urls = result[0]?.result || [];
          document.getElementById("output").value = urls.length
            ? urls.join("\n")
            : "No videos found or invalid playlist structure.";
        }
      );
    } else {
      alert("Please open a YouTube playlist!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Check the console for details.");
  }
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const output = document.getElementById("output");
  if (output.value) {
    navigator.clipboard
      .writeText(output.value)
      .then(() => alert("URLs copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy text:", err);
        alert("Failed to copy URLs. Check clipboard permissions and try again.");
      });
  } else {
    alert("No URLs to copy!");
  }
});

function extractPlaylistURLs() {
  const videoLinks = Array.from(
    document.querySelectorAll(
      "#contents a.yt-simple-endpoint.style-scope.ytd-playlist-video-renderer"
    )
  ).map((link) => `https://www.youtube.com${link.getAttribute("href")}`);
  return videoLinks;
}
