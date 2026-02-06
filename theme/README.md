# Mallard Moodle Theme and Mallard Accordion Filter
Interview task submission

**Role:** Web Developer (Digital Education)  
**Organisation:** King’s Digital  
**Candidate:** Richard Williams  

This repository contains two Moodle plugins that work together to implement the visual and interaction intent of the provided Figma prototype, while keeping the implementation reviewable and resilient to Moodle upgrades:

1. **Theme:** `theme_mallard` (Boost child theme) in `/theme/mallard`  
2. **Filter:** `filter_mallardaccordion` (text filter) in `/filter/mallardaccordion`  

This README is written for reviewers. It explains what was built, why specific approaches were chosen, how to install and verify both plugins, and what was intentionally not changed to avoid making unsafe assumptions about the broader site and course context.

---

## Contents

1. Overview  
2. What I built, at a glance  
3. Design translation: how Figma intent maps to Moodle  
4. Plugin architecture and file responsibilities  
5. Page behaviour by context  
6. Secondary navigation stability and settings actions  
7. Course Tutor panel: scoping, selection, permissions  
8. Mallard Accordion Filter: purpose, authoring rules, and rendering behaviour  
9. Local development environment and workflow  
10. Step by step installation instructions (theme and filter)  
11. Verification checklist and troubleshooting  
12. Assumptions and limitations  
13. Improvements with more time  
14. Screenshots to include in the submission  
15. Appendix: quick commands and reference snippets  

---

## 1. Overview

**Mallard** is a child theme of **Boost**. The work focuses on changes that are appropriately owned by the theme layer: spacing rhythm, layout structure on course landing pages, predictable placement of navigation, and lightweight enhancements that preserve core Moodle behaviour (editing actions, accessibility defaults, and upgrade safety).

Alongside the theme, **Mallard Accordion Filter** provides a consistent content pattern for long-form pages by converting heading-structured content into a Bootstrap-style accordion. This reduces the amount of hand-authored HTML needed by teachers and makes it easier to create repeatable, scan-friendly pages that match the prototype’s intent.

The aim is not “pixel perfect” replication. The aim is a maintainable implementation that demonstrates:

- A correct understanding of Moodle’s theme and filter architecture and where changes should live  
- A disciplined approach to caching and verification so changes apply deterministically  
- Strong scoping so course-focused styling does not leak onto unrelated pages  
- Clear reasoning about trade-offs, especially where Moodle’s native navigation and editing affordances must remain intact  

---

## 2. What I built, at a glance

### 2.1 Course landing page experience (Topics format)

On the main course page (`/course/view.php`) the theme presents course sections as **card tiles** that match the prototype’s scan-friendly “dashboard” intent. The card styling is scoped to the **course landing page** and does not apply to section pages or activity pages.

Key characteristics:

- Consistent card grid spacing and vertical rhythm  
- Section summary surfaced without expanding the full activity list  
- Compatibility with Moodle editing states (hidden sections, restricted availability, teacher controls)  
- Each section card displays computed metadata: counts of Readings, Videos, and Activities  
- Each section card can display an estimated total duration derived from `[xx mins]` tokens in activity titles  

### 2.2 Static right sidebar slot on the course landing page

On the course landing page only, Mallard renders a **static right-hand sidebar** instead of a collapsible right block drawer, as well as a **static drawer above main content**. This supports the prototype’s two-column composition and keeps important widgets visible without requiring a drawer toggle.

The sidebar and drawer were designed to host items such as:

- The Announcements block, styled to match the Figma intent  
- A course progress indicator (when completion is available)  
- Quick links (curated navigation inside the course)  
- Upcoming events and deadlines (where Moodle provides them)  
- The standard Moodle block region drop zone (`side-pre`) when editing  

### 2.3 Secondary navigation stability

A key functional requirement was ensuring that **secondary navigation (tabs)** remains present and reliable across contexts. During implementation, I identified and resolved a failure mode where template and layout guarding could inadvertently remove the DOM anchors that Moodle uses to mount editing actions, especially on in-course activity pages.

### 2.4 Course Tutor panel (course landing page only)

A “Meet the course tutor” panel is appended at the end of the main course content, but only on the main course landing page. It is not shown on section pages, activity pages, or non-course pages. The content is populated from the profile of the course creator, based on the assumption that each course has a different creator. The “Edit profile” link is permission-aware and only appears for the user viewing their own profile.

### 2.5 Mallard Accordion Filter (consistent content pattern)

To support consistent, teacher-friendly page authoring, the filter converts standard HTML headings (for example `h4`/`h5`) and paragraph content into an accordion pattern. This allows staff to create structured, expandable pages using headings and normal content, without writing custom accordion markup.

The accordion output follows a consistent rhythm:

- The section heading becomes the accordion header  
- The content until the next heading becomes the accordion body  
- The accordion body uses an **8/4 two-column layout**:  
  - Left column (`col-md-8`): text and primary content  
  - Right column (`col-md-4`): an image area if an image exists, otherwise an empty column to keep alignment consistent  

---

## 3. Design translation: how the Figma intent maps to Moodle

The prototype establishes clear expectations around hierarchy, spacing, and predictable placement of navigation and key course information. In Moodle, not everything is owned by the theme layer, and some UX elements must remain native to preserve upgrade safety and platform consistency.

Mallard therefore prioritises **intent** over hard overrides:

- Use template and layout changes only when structure must change  
- Use CSS where appearance is the only requirement  
- Use small JavaScript enhancements only for progressive improvement, never for essential navigation  
- Preserve core Moodle navigation and editing workflows  

### 3.1 Why I did not change core navigation labels or hide primary Moodle navigation

The prototype shows a specific navigation set. I did not hard-rewrite the secondary navigation labels or hide Moodle’s primary site navigation because that would require assumptions that cannot safely be made in an interview task context:

- The design may represent a single course, but Moodle commonly hosts multiple courses and programmes. Learners need predictable routes between them.  
- Moodle already provides native course and site navigation patterns that are accessible and familiar to users.  
- Replacing navigation links at theme level can create upgrade risk and can also conflict with local configurations and custom plugins.  

Instead, I focused on ensuring navigation placement and stability is correct, and I used native Moodle methods for what Moodle is already good at, while styling the presentation to match the prototype.

### 3.2 Minimal design flourishes by design

Where choices existed between custom styling and sticking close to Moodle defaults, I intentionally stayed conservative:

- I created a simple favicon using standard favicon design practice, but avoided decorative “brand extras” that would pull the interface away from the prototype’s minimal intent.  
- I used Moodle’s standard iconography where appropriate (for example, within card metadata and right sidebar items) to maintain consistency and reduce bespoke assets.  

---

## 4. Plugin architecture and file responsibilities

### 4.1 Directory map

```
theme/mallard/
  config.php
  version.php
  lang/en/theme_mallard.php

  layout/
    drawers.php

  templates/
    drawers.mustache
    course_creator_tutor.mustache

  classes/output/
    core_renderer.php
    drawer.php

  scss/
    preset/default.scss
    mallard.scss

  javascript/
    sectioncards.js
    sectioncardimages.js
    sectioncardcounts.js
    latest_announcement_header.js

  pix/
    favicon.ico
    screenshot.jpg   (required by Moodle theme selector)

filter/mallardaccordion/
  version.php
  lang/en/filter_mallardaccordion.php

  classes/
    text_filter.php

  pix/
    icon.png
    section-card-placehodlers.jpg
    theme-screenshot.jpg
```

### 4.2 Responsibilities, at a glance

**Theme (`theme/mallard`)**

- `config.php`  
  Declares Boost as the parent theme, registers Sass presets and JavaScript, and defines layouts.

- `layout/drawers.php`  
  The main structural decision point. It identifies when the request is the course landing page and selects either a static right sidebar or Boost-like drawer behaviour. It also ensures region main settings actions are built when required.

- `templates/drawers.mustache`  
  Outputs structural markup including secondary navigation, main content, the settings menu proxy, and the sidebar or drawer.

- `classes/output/core_renderer.php`  
  Adds theme-specific output behaviour, including injecting the Course Tutor panel after the course content footer, with strict scoping.

- `scss/` and `javascript/`  
  Visual styling and small progressive enhancements for the section card experience and sidebar widgets.

**Filter (`filter/mallardaccordion`)**

- `classes/text_filter.php`  
  Transforms HTML content into an accordion pattern based on headings. The filter is defensive: it only applies when content structure indicates it should, and it does not rely on authors adding fragile wrapper markup.

---

## 5. Page behaviour by context

Mallard is deliberately conservative outside course contexts.

### 5.1 Course landing page (`/course/view.php`)

Primary objectives:

- Secondary navigation visible and correctly placed  
- Sections styled as cards (Topics format expectation)  
- Static right sidebar visible (instead of a right drawer)  
- Tutor panel appended at the end of course content  

#### Section card metadata: activity counts and duration estimation

On the course landing page, each section is presented as a card tile. To support quick scanning (as implied by the prototype), each card can display two pieces of computed metadata:

- **Activity counts** (Readings, Videos, Activities)  
- **Estimated duration** (a total in minutes, displayed as a pill)  

These values are derived from the existing Moodle section content using a lightweight progressive enhancement approach. No Moodle core data model changes are required, and the course still functions normally if JavaScript is disabled.

##### Activity counting rules (Readings, Videos, Activities)

Mallard counts activities within each section using a conservative DOM-based rule set.

- The script targets the canonical activity list items within a section (the `li.activity` nodes).  
- Each activity is categorised based on the visible activity title text, using a naming convention:  
  - **Reading**: activity name begins with `Reading` (case-insensitive).  
  - **Video**: activity name begins with `Video` (case-insensitive).  
  - **Activity**: everything else.  

This convention keeps authoring simple (staff do not need special fields or HTML), and it matches a common pattern used in structured online courses where prefixes convey content type.

To avoid false counts (a real pitfall during implementation), the counting logic is intentionally scoped to the “real” activity nodes only, rather than wrapper elements or nested label containers. This prevents double counting when Moodle outputs additional markup inside each activity row.

##### Duration estimation rules (time tokens in square brackets)

Mallard estimates a section’s total time by parsing time tokens included in activity titles.

- If an activity title ends with a token in square brackets, for example:  
  - `Reading 1 [10 mins]`  
  - `Video Introduction [20 mins]`  
- Mallard extracts the numeric value and treats it as **minutes**.  
- The total minutes for all activities in a section are summed and displayed on the section card as a single duration pill (for example `60 min`).  

If an activity does not include a bracket token, it contributes `0` minutes. If the token is present but does not match the expected “minutes” format, it is ignored rather than risking an incorrect parse. This keeps the behaviour predictable and avoids inventing time values.

##### Why this approach (and what it does not do)

This logic is intentionally simple and transparent:

- It does not rely on module type detection or database reads. Those approaches can vary by site configuration and are not needed to demonstrate the interaction intent.  
- It does not attempt to infer time from file size, video length, or completion rules. Those assumptions are unreliable without additional metadata.  
- It is designed to be easy to reason about in review. The computed values follow directly from the activity names staff can see and edit.  

##### Recommended authoring guidance for staff

To get consistent results:

- Prefix activities with `Reading` or `Video` where you want them counted in those categories.  
- Add a time token at the end of the activity name using the format:  
  - `[10 mins]`, `[20 mins]`, `[5 mins]`  

This keeps the authoring workflow entirely within standard Moodle editing and avoids introducing bespoke fields or HTML patterns.

### 5.2 In-course activity pages (page layout `incourse`)

Primary objectives:

- Preserve Moodle’s core editing workflows  
- Ensure settings actions (for example “Edit settings”) remain available when editing is on  
- Keep navigation stable without inserting empty wrappers  

### 5.3 Standard site pages (non-course)

Primary objectives:

- Behave like Boost  
- Avoid course-specific styling or layout overrides  
- Preserve default drawer behaviour  

---

## 6. Secondary navigation stability and settings actions

This was the most important technical issue encountered because it affects core editing workflows, not just presentation.

### 6.1 Symptom

On some in-course pages, expected editing actions did not appear (for example “Edit settings”). In the DOM there was no region main settings menu markup and no proxy element for Moodle’s JavaScript to attach the action menu.

### 6.2 Root cause

The layout logic incorrectly coupled two unrelated concerns:

- Secondary navigation presence, and  
- Whether Moodle includes region main settings actions in header actions  

If secondary navigation was present, the code path suppressed building the settings menu entirely, even when Moodle was not outputting it elsewhere. That removed the markup Moodle needs to mount actions.

### 6.3 Fix

Build the region main settings menu whenever core is not including it in header actions. Do not suppress it based on secondary navigation presence. Ensure the template outputs the proxy element required by Moodle’s JavaScript.

Minimum proxy requirement:

```html
<div class="region_main_settings_menu_proxy"></div>
```

### 6.4 Verification approach

With editing on, open an activity page and confirm one of the following exists in the page source:

- `region_main_settings_menu_proxy`, or  
- a rendered region main settings menu container  

If neither exists, the menu is not being built or the template branch is not outputting the required markup.

---

## 7. Course Tutor panel: scoping, selection, permissions

### 7.1 What it is

A small panel titled “Meet the course tutor” appended after the main course content footer on the course landing page.

### 7.2 Why it is rendered via the theme renderer

This is presentation logic with strict scoping requirements. Injecting via the theme renderer keeps the rule set in PHP, where it can be expressed and reviewed clearly, without duplicating large template blocks.

### 7.3 Scoping rules

The panel renders only when:

- A real course object exists (not the site course)  
- The current URL matches `/course/view.php`  
- The request is the main course landing page, not section pages or activities  

### 7.4 Permissions and “Edit profile”

The “Edit profile” link is shown only when:

- the tutor displayed is the same as the user viewing the page, and  
- the viewer has permission to edit their own profile  

This prevents exposing edit links for other users.

---

## 8. Mallard Accordion Filter: purpose, authoring rules, and rendering behaviour

### 8.1 Purpose

The filter enables teachers to create consistent accordion-style pages without hand-writing accordion markup. This supports a repeatable content rhythm aligned with the prototype’s scan-first structure.

### 8.2 When the filter applies

The filter looks for heading structure. It applies when content indicates it is appropriate to do so, for example where there are multiple headings that represent “sections” of a reading or lesson page. If the structure does not meet the threshold, the filter returns the original HTML without changes.

### 8.3 Authoring rules (what staff need to do)

To create an accordion page:

1. Add normal content to a Moodle Page (or another area where text filters apply).  
2. Use headings (`h2` to `h6`) to represent each accordion section title.  
3. Put the content for that section immediately after the heading, until the next heading.  
4. If you want a right-hand image for a section, include an image near the start of that section’s content. The filter treats the first image in that section as the section’s “illustration” and places it in the right-hand column.

### 8.4 Output structure

Each accordion panel body uses a two-column grid:

- `col-md-8`: text and main content  
- `col-md-4`: image area, populated if an image is available, otherwise left empty  

This keeps vertical alignment consistent across pages and makes it easier to mix image-rich and text-only panels.

### 8.5 Accessibility considerations

The filter preserves semantic headings as the source of truth for section titles and uses Bootstrap-style collapse behaviour. Content remains readable even if the accordion interaction is unavailable, because the underlying HTML is still present in the page.

---

## 9. Local development environment and workflow

### 9.1 Stack (Docker on Windows)

Development environment used:

- Windows host running Docker Desktop (Linux containers)  
- Moodle container using `moodlehq/moodle-php-apache:8.2`  
- MariaDB 10.6  
- Local access via `http://localhost:8080`

### 9.2 Deterministic cache workflow

Moodle caches themes and templates aggressively. To avoid “why didn’t my change apply?”, I used a consistent workflow:

1. Make a change  
2. Purge caches  
3. Rebuild theme CSS when Sass changes  
4. Confirm the compiled assets contain the change  
5. Confirm the browser is loading Mallard’s compiled CSS (the URL should include `mallard`)  

Example commands:

```bash
# Purge caches
docker exec -it moodle-dev-moodle-1 bash -lc "php /var/www/html/admin/cli/purge_caches.php"

# Rebuild theme CSS
docker exec -it moodle-dev-moodle-1 bash -lc "php /var/www/html/admin/cli/build_theme_css.php --themes=mallard --direction=ltr"
```

In development, I also used Moodle’s built-in cache purge tooling from the UI where available, but the CLI workflow was the most reliable for repeatable results.

---

## 10. Step by step installation instructions (theme and filter)

### 10.1 Install the theme

1. Copy the theme folder into Moodle:

   - Place `mallard` in:  
     `YOUR_MOODLE_ROOT/theme/mallard`

2. Log in as an administrator.

3. Trigger plugin installation:

   - Go to **Site administration -> Notifications** and complete the installation steps.

4. Select the theme:

   - Go to **Site administration -> Appearance -> Themes -> Theme selector**  
   - Set **Mallard** as the active theme.

5. Purge caches.

6. Confirm activation:

   - View page source and confirm compiled CSS includes `/theme/styles.php/mallard/`.

### 10.2 Install the filter plugin

1. Copy the filter folder into Moodle:

   - Place `mallardaccordion` in:  
     `YOUR_MOODLE_ROOT/filter/mallardaccordion`

2. Go to **Site administration -> Notifications** to trigger installation.

3. Enable the filter:

   - Go to **Site administration -> Plugins -> Filters -> Manage filters**  
   - Ensure **Mallard Accordion** is enabled and ordered appropriately relative to other filters.

4. Purge caches.

### 10.3 Add the required theme screenshot

Moodle’s theme selector expects a screenshot in the theme’s `pix` folder. Place:

- `theme/mallard/pix/screenshot.jpg`

No additional `$THEME->...` configuration is required for the screenshot. Moodle discovers it automatically when present.

---

## 11. Verification checklist and troubleshooting

### 11.1 Quick verification checklist

1. **Course landing page (`/course/view.php`)**
   - Secondary navigation tabs visible  
   - Sections appear as cards  
   - Static right sidebar visible  
   - Tutor panel appears at the end of the main content  
   - Counts row present (Readings, Videos, Activities)  
   - Duration pill appears when activity titles include `[xx mins]` tokens  

2. **Section page (`/course/section.php` or single section view)**
   - Card styling does not apply  
   - Tutor panel does not appear  

3. **Activity page (page layout `incourse`) with editing on**
   - “Edit settings” available  
   - `region_main_settings_menu_proxy` present in page source (or equivalent settings markup)  

4. **Accordion filter**
   - Create a Page with at least two headings (`h2` to `h6`)  
   - Confirm headings become accordion headers  
   - Confirm content is placed inside the accordion bodies  
   - If a section contains an image, confirm it appears in the right column  

### 11.2 Troubleshooting

**My CSS change did nothing**

- Confirm Mallard is active (CSS URL contains `mallard`)  
- Rebuild theme CSS and purge caches  
- Hard refresh the browser or test in a private window  
- Use DevTools to confirm which selector is winning  

**Template change did nothing**

- Mustache templates are cached. Purge caches after template edits.  
- Add a temporary HTML comment to confirm the template you edited is the one being served, then remove it after verifying.

**Edit settings is missing on activity pages**

- Search page source for `region_main_settings_menu_proxy`  
- If missing, confirm the settings menu is being built in `layout/drawers.php` and the template branch outputs the proxy element  

**Counts or duration do not appear on section cards**

- Confirm you are on the course landing page (`/course/view.php?id=X`) and not a section page (`/course/section.php?id=Y`).  
- Confirm the section contains standard activity list items (not only labels).  
- Confirm title conventions are being followed:  
  - Titles start with `Reading` or `Video` (for those categories)  
  - Time tokens use square brackets and minutes (for example `[10 mins]`)  
- Confirm JavaScript is not blocked by the browser or dev tools settings.  

---

## 12. Assumptions and limitations

Assumptions made to keep the submission theme-level and reviewable:

- The primary design target is the course-facing learner experience, especially `/course/view.php`  
- Section cards are designed for Topics format on the landing page  
- Progressive enhancement does not alter essential navigation or essential content  
- Tutor selection is best-effort and avoids introducing a new data model  

Limitations (by design):

- Exact pixel matching is not the objective because heavy template replacement increases upgrade risk  
- Moodle markup differs by page type, and the theme prioritises stability over aggressive restructuring  
- Navigation labels and site-level navigation were not rewritten, because doing so would require assumptions about multi-course navigation needs  
- Activity counts and duration estimates rely on a title convention (`Reading…`, `Video…`, and `[xx mins]`). This keeps authoring friction low, but inconsistent naming will produce inconsistent metadata.  

---

## 13. Improvements with more time

If more time were available, I would prioritise:

- **Theme settings for tokens**: expose key colours, widths, and spacing as configurable admin settings.  
- **Regression checks across breakpoints**: a lightweight, repeatable checklist for desktop and mobile.  
- **Accordion as a dedicated authoring tool**: explore packaging the accordion pattern as a dedicated Moodle activity or editor component, rather than relying on heading conventions alone.  
- **Accessibility validation**: formal keyboard testing of accordion controls, navigation, and drawer toggles, plus auditing labels for custom UI elements.  
- **More robust metadata classification**: replace title-prefix classification with a configurable rule set (while keeping the convention as the default), to reduce dependence on naming consistency.  

---

## 14. Screenshots to include in the submission

Screenshots with captions:

1. Course landing page showing tabs, section cards, sidebar, tutor panel, counts row, and duration pill: `theme/mallard/pix/screenshot.jpg`  
2. Course landing page with editing on, showing teacher affordances remain intact: `theme/mallard/pix/screenshot_2.png`  
3. Activity page with editing on, showing “Edit settings” and settings menu behaviour: `theme/mallard/pix/screenshot_3.png`  
4. Page activity demonstrating the accordion filter (including a panel with an image): `theme/mallard/pix/screenshot_4.png`  
5. Theme selector view showing the Mallard screenshot and favicon: `theme/mallard/pix/screenshot_5.png`  

---

## 15. Appendix: quick commands and reference snippets

### 15.1 Cache purge and rebuild (Docker)

```bash
docker exec -it moodle-dev-moodle-1 bash -lc "php /var/www/html/admin/cli/purge_caches.php"
docker exec -it moodle-dev-moodle-1 bash -lc "php /var/www/html/admin/cli/build_theme_css.php --themes=mallard --direction=ltr"
```

### 15.2 Main course page detection (example)

```php
$iscourseview = (
    $PAGE->pagelayout === 'course' &&
    $PAGE->url->compare(new moodle_url('/course/view.php'), URL_MATCH_BASE)
);
```

### 15.3 Settings action proxy markup

```html
<div class="region_main_settings_menu_proxy"></div>
```
