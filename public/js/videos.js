// Admin video management for homepage videos

async function fetchVideos() {
  try {
    const res = await fetch('/api/videos');
    if (!res.ok) throw new Error('Failed to fetch videos');
    return await res.json();
  } catch (err) {
    alert(err.message);
    return [];
  }
}

async function addVideo(title, video_url, thumbnail_url) {
  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ararena_token')}`
      },
      body: JSON.stringify({ title, video_url, thumbnail_url })
    });
    if (!res.ok) throw new Error('Failed to add video');
    return await res.json();
  } catch (err) {
    alert(err.message);
    return null;
  }
}

async function updateVideo(id, title, video_url, thumbnail_url) {
  try {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('ararena_token')}`
      },
      body: JSON.stringify({ title, video_url, thumbnail_url })
    });
    if (!res.ok) throw new Error('Failed to update video');
    return await res.json();
  } catch (err) {
    alert(err.message);
    return null;
  }
}

async function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) return false;
  try {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('ararena_token')}`
      }
    });
    if (!res.ok) throw new Error('Failed to delete video');
    return true;
  } catch (err) {
    alert(err.message);
    return false;
  }
}

function renderVideoList(videos) {
  const container = document.getElementById('videoList');
  container.innerHTML = '';

  if (videos.length === 0) {
    container.innerHTML = '<p>No videos added yet.</p>';
    return;
  }

  videos.forEach(video => {
    const item = document.createElement('div');
    item.className = 'video-item';
    item.innerHTML = `
      <img src="${video.thumbnail_url}" alt="${video.title}" style="width: 100px; height: 60px; object-fit: cover;">
      <div>
        <strong>${video.title}</strong><br>
        <a href="${video.video_url}" target="_blank">${video.video_url}</a>
      </div>
      <div>
        <button onclick="editVideo(${video.id}, '${video.title}', '${video.video_url}', '${video.thumbnail_url}')">Edit</button>
        <button onclick="deleteVideo(${video.id})">Delete</button>
      </div>
    `;
    container.appendChild(item);
  });
}

async function loadVideos() {
  const videos = await fetchVideos();
  renderVideoList(videos);
}

function extractYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function generateThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function handleAddVideo(e) {
  e.preventDefault();
  const title = document.getElementById('videoTitle').value.trim();
  const video_url = document.getElementById('videoUrl').value.trim();
  let thumbnail_url = document.getElementById('videoThumbnail').value.trim();

  if (!title || !video_url) {
    alert('Title and Video URL are required');
    return;
  }

  // Auto-fetch thumbnail if not provided
  if (!thumbnail_url) {
    const videoId = extractYouTubeVideoId(video_url);
    if (videoId) {
      thumbnail_url = generateThumbnailUrl(videoId);
    } else {
      alert('Invalid YouTube URL or unable to extract video ID');
      return;
    }
  }

  const result = await addVideo(title, video_url, thumbnail_url);
  if (result) {
    document.getElementById('addVideoForm').reset();
    loadVideos();
  }
}

async function handleEditVideo(e) {
  e.preventDefault();
  const id = document.getElementById('editVideoId').value;
  const title = document.getElementById('editVideoTitle').value.trim();
  const video_url = document.getElementById('editVideoUrl').value.trim();
  let thumbnail_url = document.getElementById('editVideoThumbnail').value.trim();

  if (!title || !video_url) {
    alert('Title and Video URL are required');
    return;
  }

  // Auto-fetch thumbnail if not provided
  if (!thumbnail_url) {
    const videoId = extractYouTubeVideoId(video_url);
    if (videoId) {
      thumbnail_url = generateThumbnailUrl(videoId);
    } else {
      alert('Invalid YouTube URL or unable to extract video ID');
      return;
    }
  }

  const result = await updateVideo(id, title, video_url, thumbnail_url);
  if (result) {
    document.getElementById('editVideoForm').style.display = 'none';
    document.getElementById('addVideoForm').style.display = 'block';
    loadVideos();
  }
}

function editVideo(id, title, video_url, thumbnail_url) {
  document.getElementById('editVideoId').value = id;
  document.getElementById('editVideoTitle').value = title;
  document.getElementById('editVideoUrl').value = video_url;
  document.getElementById('editVideoThumbnail').value = thumbnail_url;
  document.getElementById('editVideoForm').style.display = 'block';
  document.getElementById('addVideoForm').style.display = 'none';
}

function cancelEdit() {
  document.getElementById('editVideoForm').style.display = 'none';
  document.getElementById('addVideoForm').style.display = 'block';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
  document.getElementById('addVideoForm').addEventListener('submit', handleAddVideo);
  document.getElementById('editVideoForm').addEventListener('submit', handleEditVideo);
});
