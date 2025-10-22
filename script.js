/* script.js
   - loads video-list.json
   - reads ?v=ID from URL
   - sets <video> src to correct URL
   - provides copy-link + unmute control
*/

(async function(){
  const videoEl = document.getElementById('videoPlayer');
  const unmuteBtn = document.getElementById('unmuteBtn');
  const copyBtn = document.getElementById('copyBtn');
  const shareInput = document.getElementById('shareInput');

  // helper: read query param "v"
  function getVideoParam(){
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v');
      return v ? Number(v) : null;
    } catch(e){ return null; }
  }

  // load JSON list
  async function loadList(){
    try {
      const resp = await fetch('video-list.json', {cache: "no-cache"});
      if(!resp.ok) throw new Error('Could not load video-list.json');
      return await resp.json();
    } catch(err){
      console.error(err);
      return null;
    }
  }

  // choose video entry by id, fallback to first element
  function chooseVideo(list, id){
    if(!Array.isArray(list) || list.length === 0) return null;
    if(id !== null){
      const found = list.find(item => Number(item.id) === Number(id));
      if(found) return found;
    }
    // fallback
    return list[0];
  }

  // set video src and build share link
  function playVideoEntry(entry){
    if(!entry || !entry.url) {
      videoEl.poster = ''; // optionally set a poster
      console.error('No valid entry or URL.');
      videoEl.removeAttribute('src');
      return;
    }

    // assign src directly. If terabox link requires special handling you can swap this with fetch+blob.
    videoEl.src = entry.url;
    // Try play (autoplay may still be blocked if not muted; we started muted to increase chances)
    videoEl.play().catch(e => {
      console.warn('Autoplay blocked, user interaction required to start video.', e);
    });

    // populate share link input (so user can copy & share)
    const base = window.location.origin + window.location.pathname;
    const shareURL = `${base}?v=${encodeURIComponent(entry.id)}`;
    shareInput.value = shareURL;
  }

  // copy share link to clipboard
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareInput.value);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(()=> copyBtn.textContent = 'Copy Link', 1500);
    } catch (err) {
      console.error('Copy failed', err);
      copyBtn.textContent = 'Copy Failed';
      setTimeout(()=> copyBtn.textContent = 'Copy Link', 1500);
    }
  });

  // unmute toggle
  unmuteBtn.addEventListener('click', () => {
    videoEl.muted = !videoEl.muted;
    unmuteBtn.textContent = videoEl.muted ? 'Unmute 🔇' : 'Mute 🔈';
  });

  // main init
  const list = await loadList();
  if(!list){
    // show friendly message in ad slot (or console)
    document.getElementById('ad-top').innerText = 'Error: video-list.json not found or invalid.';
    return;
  }

  const v = getVideoParam();
  const entry = chooseVideo(list, v);
  playVideoEntry(entry);

  // Optional: if the video url might redirect or require CORS, you can implement fetch->blob here.
  // But many file-hosts disallow cross-origin fetch. If you run into playback errors, replace
  // videoEl.src = entry.url with a server-side redirector or host files where CORS allows streaming.

})();
