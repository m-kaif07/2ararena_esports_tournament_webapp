// Homepage enhancements can go here if needed.

// Load videos dynamically
async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    if (!res.ok) throw new Error('Failed to fetch videos');
    const videos = await res.json();
    console.log('Videos loaded:', videos);
    renderVideos(videos);
  } catch (err) {
    console.error('Failed to load videos:', err);
    // Fallback to default videos if API fails
    renderDefaultVideos();
  }
}

function renderVideos(videos) {
  const grid = document.getElementById('videoGrid');
  if (!grid) {
    console.error('videoGrid element not found');
    return;
  }

  if (videos.length === 0) {
    grid.innerHTML = '<p>No videos available.</p>';
    return;
  }

  grid.innerHTML = '';
  videos.forEach(video => {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = video.video_url;
    card.target = '_blank';
    card.rel = 'noopener';
    card.setAttribute('aria-label', video.title);
    card.innerHTML = `
      <div class="video-thumb" style="--thumb:url('${video.thumbnail_url}')"></div>
      <div class="video-overlay"><span class="play">▶</span></div>
    `;
    grid.appendChild(card);
  });
}

function renderDefaultVideos() {
  const grid = document.getElementById('videoGrid');
  if (!grid) {
    console.error('videoGrid element not found for default videos');
    return;
  }

  grid.innerHTML = `
    <a class="video-card" href="https://youtu.be/VbLPiDdOHmE?si=-2hI64RGWUKGV8UH" target="_blank" rel="noopener" aria-label="Featured Video 1">
      <div class="video-thumb" style="--thumb:url('https://img.youtube.com/vi/VbLPiDdOHmE/hqdefault.jpg')"></div>
      <div class="video-overlay"><span class="play">▶</span></div>
    </a>
    <a class="video-card" href="https://youtu.be/VOHgjWUtXfg?si=-UM0exwqEpLE50AY" target="_blank" rel="noopener" aria-label="Featured Video 2">
      <div class="video-thumb" style="--thumb:url('https://img.youtube.com/vi/VOHgjWUtXfg/hqdefault.jpg')"></div>
      <div class="video-overlay"><span class="play">▶</span></div>
    </a>
    <a class="video-card" href="https://youtu.be/KCDo_YEXNuQ?si=mdo8FJRwd3QDqdV-" target="_blank" rel="noopener" aria-label="Featured Video 3">
      <div class="video-thumb" style="--thumb:url('https://img.youtube.com/vi/KCDo_YEXNuQ/hqdefault.jpg')"></div>
      <div class="video-overlay"><span class="play">▶</span></div>
    </a>
  `;
}

// Load videos when page loads
document.addEventListener('DOMContentLoaded', loadVideos);

// Real-time updates for videos
const socket = io();
console.log('Socket connected:', socket.connected);
socket.on('connect', () => {
  console.log('Socket connected to server');
});
socket.on('videosChanged', () => {
  console.log('Received videosChanged event, reloading videos');
  loadVideos();
});
