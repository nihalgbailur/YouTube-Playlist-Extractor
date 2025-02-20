// Format selection handling
let selectedFormat = 'url';
document.querySelectorAll('input[name="format"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedFormat = e.target.value;
    if (document.getElementById('output').value) {
      extractPlaylist(); // Re-extract with new format
    }
  });
});

// Clear button functionality
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('output').value = '';
  document.getElementById('video-count').textContent = '0 videos found';
  document.getElementById('total-duration').textContent = 'Total: 0:00';
  document.getElementById('status').textContent = '';
});

// Enhanced extract button functionality
document.getElementById("extract-btn").addEventListener("click", extractPlaylist);

// Add download button functionality
document.getElementById("download-btn").addEventListener("click", () => {
  const output = document.getElementById("output");
  const status = document.getElementById("status");
  
  if (!output.value) {
    status.textContent = "Nothing to download";
    setTimeout(() => status.textContent = "", 2000);
    return;
  }

  try {
    // Create playlist name from current date and time
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const format = selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1);
    const filename = `playlist_${format}_${timestamp}.txt`;

    // Create blob and download link
    const blob = new Blob([output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    status.textContent = "Download started!";
    setTimeout(() => status.textContent = "", 2000);
  } catch (error) {
    console.error("Download error:", error);
    status.textContent = "Download failed";
    setTimeout(() => status.textContent = "", 2000);
  }
});

async function extractPlaylist() {
  const extractBtn = document.getElementById("extract-btn");
  const status = document.getElementById("status");
  
  try {
    extractBtn.disabled = true;
    status.textContent = "Extracting...";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url.includes("youtube.com/playlist")) {
      throw new Error("Please open a YouTube playlist!");
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPlaylistData,
    }, (result) => {
      const data = result[0]?.result || { videos: [], totalDuration: '0:00' };
      updateOutput(data);
      extractBtn.disabled = false;
      status.textContent = "Extraction complete!";
      setTimeout(() => status.textContent = "", 2000);
    });
  } catch (error) {
    console.error("Error:", error);
    status.textContent = error.message;
    extractBtn.disabled = false;
  }
}

// Enhanced copy button functionality
document.getElementById("copy-btn").addEventListener("click", () => {
  const output = document.getElementById("output");
  const status = document.getElementById("status");
  
  if (output.value) {
    navigator.clipboard.writeText(output.value)
      .then(() => {
        status.textContent = "Copied to clipboard!";
        setTimeout(() => status.textContent = "", 2000);
      })
      .catch(err => {
        console.error("Failed to copy text:", err);
        status.textContent = "Failed to copy";
      });
  } else {
    status.textContent = "Nothing to copy";
    setTimeout(() => status.textContent = "", 2000);
  }
});

function extractPlaylistData() {
  const videos = Array.from(
    document.querySelectorAll("ytd-playlist-video-renderer")
  ).map(video => ({
    url: `https://www.youtube.com${video.querySelector("a.yt-simple-endpoint").getAttribute("href")}`,
    title: video.querySelector("#video-title").textContent.trim(),
    duration: video.querySelector("span.ytd-thumbnail-overlay-time-status-renderer").textContent.trim()
  }));

  // Calculate total duration
  const totalSeconds = videos.reduce((total, video) => {
    const [minutes, seconds] = video.duration.split(':').map(Number);
    return total + (minutes * 60 + seconds);
  }, 0);
  
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const totalDuration = totalHours > 0 
    ? `${totalHours}:${String(totalMinutes).padStart(2, '0')}`
    : `${totalMinutes}:${String(totalSeconds % 60).padStart(2, '0')}`;

  return { videos, totalDuration };
}

function updateOutput(data) {
  const { videos, totalDuration } = data;
  let output = '';
  
  // Get playlist title if available
  const playlistTitle = document.querySelector("yt-formatted-string.title")?.textContent || "YouTube Playlist";
  
  switch (selectedFormat) {
    case 'url':
      output = videos.map(v => v.url).join('\n');
      break;
    case 'markdown':
      output = `# ${playlistTitle}\n\n` +
        videos.map(v => `- [${v.title}](${v.url}) (${v.duration})`).join('\n') +
        `\n\nTotal Duration: ${totalDuration}`;
      break;
    case 'titles':
      output = `${playlistTitle}\n\n` +
        videos.map(v => v.title).join('\n');
      break;
  }

  document.getElementById('output').value = output;
  document.getElementById('video-count').textContent = `${videos.length} videos found`;
  document.getElementById('total-duration').textContent = `Total: ${totalDuration}`;
}
