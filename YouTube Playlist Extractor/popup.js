document.getElementById("extract-btn").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url.includes("youtube.com/playlist")) {
      console.log("Active Tab:", tab);

      // Use chrome.scripting.executeScript to extract playlist URLs
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          function: extractPlaylistURLs,
        },
        (result) => {
          const urls = result[0]?.result || [];
          console.log("Extracted URLs:", urls);

          // Display the extracted URLs in the textarea
          const outputElement = document.getElementById("output");
          outputElement.value = urls.length
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

// Function executed in the YouTube playlist page context
function extractPlaylistURLs() {
  const videoLinks = Array.from(
    document.querySelectorAll(
      "#contents a.yt-simple-endpoint.style-scope.ytd-playlist-video-renderer"
    )
  ).map((link) => `https://www.youtube.com${link.getAttribute("href")}`);
  return videoLinks;
}
