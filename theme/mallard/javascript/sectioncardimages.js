(function() {
  const body = document.body;

  // Only on course homepage in Topics format.
  if (body.id !== 'page-course-view-topics') return;
  if (!body.classList.contains('path-course-view')) return;
  if (!body.classList.contains('format-topics')) return;
  if (body.classList.contains('editing')) return;

  const getDefaultImageUrl = (n) => {
    // Preferred: use Moodle's pix URL helper when available.
    if (window.M && M.util && typeof M.util.image_url === 'function') {
      return M.util.image_url('section-' + n, 'theme_mallard');
    }
    return null;
  };

  const apply = () => {
    const cards = document.querySelectorAll('.course-content ul.topics > li.section.course-section');
    cards.forEach((li, idx) => {
      const sectionItem = li.querySelector('.section-item');
      if (!sectionItem) return;

      // Do not duplicate if already injected.
      if (sectionItem.querySelector('.mallard-section-card-media')) return;

      const media = document.createElement('div');
      media.className = 'mallard-section-card-media';

      // Try teacher-provided image: first image in the section summary/content.
      const summary = li.querySelector('.content .summary, .section-summary, .summary');
      const customImg = summary ? summary.querySelector('img') : null;

      if (customImg && customImg.src) {
        const img = document.createElement('img');
        img.src = customImg.src;
        img.alt = customImg.getAttribute('alt') || '';
        img.loading = 'lazy';
        media.appendChild(img);

        // Remove the original image so it doesn't appear twice inside the card.
        customImg.remove();
      } else {
        // Default image by card position (rotates 1..6).
        const n = (idx % 6) + 1;
        const url = getDefaultImageUrl(n);

        if (url) {
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.setAttribute('role', 'presentation');
          img.setAttribute('aria-hidden', 'true');
          img.loading = 'lazy';
          media.appendChild(img);
        }
      }

      sectionItem.insertBefore(media, sectionItem.firstChild);
    });
  };

  // Initial apply.
  apply();

  // Course editor can re-render parts of the page, watch for changes.
  const list = document.querySelector('.course-content ul.topics');
  if (list) {
    const obs = new MutationObserver(() => apply());
    obs.observe(list, { childList: true, subtree: true });
  }
})();
