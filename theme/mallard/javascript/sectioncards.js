(function() {
  // Only run on course view + topics format and not editing.
  const body = document.body;
  if (!body.classList.contains('path-course-view')) return;
  if (!body.classList.contains('format-topics')) return;
  if (body.classList.contains('editing')) return;

  const sections = document.querySelectorAll('ul.topics > li.section.course-section');
  sections.forEach(section => {
    // Find the first meaningful link that represents the section.
    const titleLink =
      section.querySelector('.sectionname a') ||
      section.querySelector('.section-title a') ||
      section.querySelector('a[href*="#section-"]');

    if (!titleLink || !titleLink.href) return;

    // Make it behave like a clickable card.
    section.style.cursor = 'pointer';
    section.setAttribute('tabindex', '0');
    section.setAttribute('role', 'link');
    section.setAttribute('aria-label', titleLink.textContent.trim() || 'Open section');

    const go = (e) => {
      // Do not hijack clicks on interactive elements.
      const interactive = e.target.closest('a, button, input, select, textarea, [role="button"]');
      if (interactive) return;
      window.location.href = titleLink.href;
    };

    section.addEventListener('click', go);
    section.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = titleLink.href;
      }
    });
  });
})();
