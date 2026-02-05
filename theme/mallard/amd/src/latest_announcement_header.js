/* theme/mallard/javascript/latest_announcement_header.js */
(function() {
    'use strict';

    function init() {
        // Only on course view pages.
        if (!document.body || !document.body.classList.contains('path-course-view')) {
            return;
        }

        // The "Latest announcements" block is block_news_items.
        // Moodle typically renders it as: section.block_news_items.block.card
        var block = document.querySelector('#block-region-abovecontent section.block_news_items');
        if (!block) {
            return;
        }

        // Find the block header <h3 ...>Latest announcements</h3>
        var header = block.querySelector('.card-body > h3, .card-body > h4, .card-body > h5');
        if (!header) {
            return;
        }

        // Find the first announcement title link inside the block.
        // It usually appears inside: div.info > a
        var firstTitleLink = block.querySelector('.card-text .info a');
        if (!firstTitleLink) {
            // Nothing to show (no posts, permissions, or forum misconfigured).
            return;
        }

        var announcementTitle = (firstTitleLink.textContent || '').trim();
        if (!announcementTitle) {
            return;
        }

        // Build an accessible header:
        // - Icon with alt text "Latest announcement"
        // - Title text after the icon (the latest discussion title)
        // - Keep original header text for screen readers (optional but helpful)
        var originalText = (header.textContent || '').trim();

        header.textContent = '';

        // Screen-reader-only original heading text, so the block still has a clear label.
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = originalText || 'Latest announcements';
        header.appendChild(sr);

        var wrap = document.createElement('span');
        wrap.style.display = 'inline-flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '10px';

        var img = document.createElement('img');
        img.src = (window.M && M.cfg && M.cfg.wwwroot)
            ? (M.cfg.wwwroot + '/theme/mallard/pix/letter-i.png')
            : '/theme/mallard/pix/letter-i.png';
        img.alt = 'Latest announcement';
        img.width = 20;
        img.height = 20;
        img.style.display = 'inline-block';

        var text = document.createElement('span');
        text.textContent = announcementTitle;

        wrap.appendChild(img);
        wrap.appendChild(text);

        header.appendChild(wrap);

        // Optional: make the title link open the announcement.
        // If you want the header title clickable, uncomment the next block.
        /*
        var headerLink = document.createElement('a');
        headerLink.href = firstTitleLink.href;
        headerLink.textContent = announcementTitle;
        headerLink.style.textDecoration = 'none';
        headerLink.style.color = 'inherit';
        wrap.removeChild(text);
        headerLink.prepend(document.createTextNode('')); // no-op, keeps structure simple
        wrap.appendChild(headerLink);
        */
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
