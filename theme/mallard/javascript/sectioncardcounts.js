/* sectioncardcounts.js
   Mallard: Course home section cards (Topics format)
   - Counts: Reading / Video / Activity based on name prefixes
   - Duration: sums trailing [..] minutes tokens
   - Recently viewed: marks the last clicked section card (no cookies)
*/

(function () {
  const body = document.body;
  const path = window.location.pathname || "";
  const params = new URLSearchParams(window.location.search);

  const isEditing = body.classList.contains("editing");

  const isCourseHome =
    body.id === "page-course-view-topics" &&
    body.classList.contains("path-course-view") &&
    body.classList.contains("format-topics");

  const isSectionPage = /\/course\/section\.php$/.test(path);

  // Course id on /course/view.php?id=XX
  const courseId = params.get("id");

  // Section id on /course/section.php?id=YY  (this is course_sections.id)
  const sectionIdFromSectionPage = isSectionPage ? params.get("id") : null;

  // Only run the card rendering on the course home, not editing.
  if (!isCourseHome || isEditing) {
    // Still allow "recently viewed" to be stored from section pages.
    if (isSectionPage && sectionIdFromSectionPage) {
      setRecent(sectionIdFromSectionPage);
    }
    return;
  }

  /* ---------------------------
     Utilities
  ---------------------------- */

  const normaliseText = (s) => (s || "").replace(/\s+/g, " ").trim();

  const getActivityName = (activityLi) => {
    // Most reliable: visible name is inside .instancename
    const inst = activityLi.querySelector(".instancename");
    if (inst) {
      const clone = inst.cloneNode(true);
      clone.querySelectorAll(".accesshide").forEach((n) => n.remove());
      return normaliseText(clone.textContent || "");
    }

    const link =
      activityLi.querySelector(".activityname a") ||
      activityLi.querySelector("a.aalink") ||
      activityLi.querySelector("a");

    return normaliseText(link?.textContent || "");
  };

  // Extract minutes from trailing [..] token.
  // Supports: [10min], [10 mins], [1h], [1h 30m], [90m], [10]
  const extractMinutesFromTitle = (name) => {
    if (!name) return 0;

    const m = name.match(/\[(.+?)\]\s*$/);
    if (!m) return 0;

    const token = m[1].toLowerCase().replace(/\s+/g, " ").trim();

    // 1) Hours + minutes, e.g. "1h 30m"
    const hm = token.match(
      /(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:ins?|inutes?)?/
    );
    if (hm) {
      const h = parseInt(hm[1], 10);
      const mins = parseInt(hm[2], 10);
      return (isNaN(h) ? 0 : h * 60) + (isNaN(mins) ? 0 : mins);
    }

    // 2) Hours only, e.g. "1h"
    const hOnly = token.match(/(\d+)\s*h(?:ours?)?/);
    if (hOnly) {
      const h = parseInt(hOnly[1], 10);
      return isNaN(h) ? 0 : h * 60;
    }

    // 3) Minutes only, e.g. "10m" / "10 min" / "10 mins"
    const mOnly = token.match(/(\d+)\s*m(?:ins?|inutes?)?/);
    if (mOnly) {
      const mins = parseInt(mOnly[1], 10);
      return isNaN(mins) ? 0 : mins;
    }

    // 4) Pure number fallback, e.g. "[10]"
    const n = token.match(/^(\d+)$/);
    if (n) {
      const mins = parseInt(n[1], 10);
      return isNaN(mins) ? 0 : mins;
    }

    return 0;
  };

  const stripTrailingBracketToken = (name) =>
    normaliseText((name || "").replace(/\s*\[.+?\]\s*$/, ""));

  /* ---------------------------
     Footer helper
  ---------------------------- */

  const ensureFooter = (cardLi, metaRowEl) => {
    let footer = cardLi.querySelector(".mallard-card-footer");
    if (footer) return footer;

    footer = document.createElement("div");
    footer.className = "mallard-card-footer";

    // Prefer: after summary if it exists, otherwise after the meta row.
    const summary = cardLi.querySelector(".summarytext");
    if (summary) {
      summary.insertAdjacentElement("afterend", footer);
      return footer;
    }

    if (metaRowEl) {
      metaRowEl.insertAdjacentElement("afterend", footer);
      return footer;
    }

    // Final fallback: append inside section-item
    const sectionItem = cardLi.querySelector(".section-item");
    if (sectionItem) sectionItem.appendChild(footer);

    return footer;
  };

  /* ---------------------------
     Meta row + duration
  ---------------------------- */

  const buildMetaRow = (counts) => {
    const meta = document.createElement("div");
    meta.className = "mallard-card-meta";

    const add = (iconClass, n, singular, plural) => {
      if (!n) return;
      const item = document.createElement("span");
      item.className = "mallard-meta-item";
      item.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i> ${n} ${
        n === 1 ? singular : plural
      }`;
      meta.appendChild(item);
    };

    // Figma behaviour: only show non-zero types.
    add("fa fa-file-o", counts.reading, "reading", "readings");
    add("fa fa-tasks", counts.activity, "activity", "activities");
    add("fa fa-play-circle", counts.video, "video", "videos");

    return meta;
  };

  const buildDurationTag = (totalMins) => {
    const tag = document.createElement("span");
    tag.className = "mallard-duration-tag";
    tag.textContent = `${totalMins} min`;
    return tag;
  };

  const applyCards = () => {
    const cards = document.querySelectorAll(
      ".course-content ul.topics > li.section.course-section"
    );

    cards.forEach((li) => {
      // Avoid duplicating on re-render.
      if (li.querySelector(".mallard-card-meta")) return;

      const header = li.querySelector(".course-section-header");
      if (!header) return;

      const activityLis = li.querySelectorAll(
        'ul.section[data-for="cmlist"] > li.activity'
      );
      if (!activityLis.length) return;

      const counts = { reading: 0, video: 0, activity: 0 };
      let totalMinutes = 0;

      activityLis.forEach((actLi) => {
        const rawName = getActivityName(actLi);
        const nameForType = stripTrailingBracketToken(rawName);

        // Primary rule: naming convention (do not depend on modtype).
        if (/^reading\b/i.test(nameForType)) {
          counts.reading += 1;
        } else if (/^video\b/i.test(nameForType)) {
          counts.video += 1;
        } else {
          counts.activity += 1;
        }

        totalMinutes += extractMinutesFromTitle(rawName);
      });

      const metaRow = buildMetaRow(counts);
      header.insertAdjacentElement("afterend", metaRow);

      // Hide full activity list via CSS class (course homepage only).
      li.classList.add("mallard-hide-activities");

      // Footer (mins + recently viewed)
      const footer = ensureFooter(li, metaRow);

      // Duration tag (left side of footer)
      if (totalMinutes > 0 && !footer.querySelector(".mallard-duration-tag")) {
        const tag = buildDurationTag(totalMinutes);
        footer.prepend(tag);
      }
    });
  };

  /* ---------------------------
     Recently viewed (localStorage)
  ---------------------------- */

  const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

  const keyForCourse = (cid) => `mallard_recent_section_${cid}`;
  const GLOBAL_KEY = "mallard_recent_section_global";

  const safeParse = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  function setRecent(sectionId) {
    const payload = JSON.stringify({
      sectionId: String(sectionId),
      ts: Date.now(),
    });

    try {
      if (courseId) localStorage.setItem(keyForCourse(courseId), payload);
      localStorage.setItem(GLOBAL_KEY, payload);
    } catch (e) {
      // Storage may be blocked; fail quietly.
    }
  }

  const getRecentForThisCourse = () => {
    const raw =
      (courseId ? localStorage.getItem(keyForCourse(courseId)) : null) ||
      localStorage.getItem(GLOBAL_KEY);

    const data = safeParse(raw);
    if (!data || !data.sectionId || !data.ts) return null;
    if (Date.now() - Number(data.ts) > MAX_AGE_MS) return null;

    return data;
  };

  const ensureRecentBadge = (li) => {
    const footer = ensureFooter(li, li.querySelector(".mallard-card-meta"));
    if (!footer || footer.querySelector(".mallard-recent-badge")) return;

    const badge = document.createElement("span");
    badge.className = "mallard-recent-badge";
    badge.textContent = "Recently viewed";

    footer.appendChild(badge);
  };

  const clearRecentMarks = () => {
    document
      .querySelectorAll(
        ".course-content ul.topics > li.section.course-section.mallard-recent"
      )
      .forEach((el) => el.classList.remove("mallard-recent"));

    document
      .querySelectorAll(".course-content ul.topics .mallard-recent-badge")
      .forEach((el) => el.remove());
  };

  const markRecent = () => {
    clearRecentMarks();

    const recent = getRecentForThisCourse();
    if (!recent) return;

    const li = document.querySelector(
      `.course-content ul.topics > li.section.course-section[data-id="${CSS.escape(
        String(recent.sectionId)
      )}"]`
    );
    if (!li) return;

    li.classList.add("mallard-recent");
    ensureRecentBadge(li);
  };

  /* ---------------------------
     Boot + observers
  ---------------------------- */

  const run = () => {
    applyCards();
    markRecent();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  // Capture clicks on cards so it updates immediately.
  // Use capture so it runs even if Moodle intercepts the click.
  document.addEventListener(
    "click",
    (e) => {
      if (isEditing) return;

      const li = e.target.closest(
        ".course-content ul.topics > li.section.course-section"
      );
      if (!li) return;

      // Use data-id (course_sections.id). Do not use data-sectionid.
      const sid = li.getAttribute("data-id");
      if (!sid) return;

      setRecent(sid);

// Only delay if the click is on a link (so we expect navigation).
const clickedLink = e.target.closest('a[href]');
const delay = clickedLink ? 250 : 0;

window.setTimeout(() => {
  markRecent();
}, delay);
    },
    true
  );

  // Re-apply if Moodle re-renders sections dynamically.
  const list = document.querySelector(".course-content ul.topics");
  if (list) {
    let raf = 0;
    const obs = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        applyCards();
        markRecent();
      });
    });
    obs.observe(list, { childList: true, subtree: true });
  }
})();
