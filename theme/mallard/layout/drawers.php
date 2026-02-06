<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Mallard drawers layout (based on Boost drawers).
 *
 * @package   theme_mallard
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();
echo $OUTPUT->doctype();
global $CFG, $PAGE, $OUTPUT, $SITE, $USER;

require_once($CFG->libdir . '/behat/lib.php');
require_once($CFG->dirroot . '/course/lib.php');


// Identify course view page so we can switch to a static right sidebar layout.
$iscourseview = (
    $PAGE->pagelayout === 'course' &&
    $PAGE->url->compare(new moodle_url('/course/view.php'), URL_MATCH_BASE)
);

// Add block button in editing mode.
$addblockbutton = $OUTPUT->addblockbutton();

if (isloggedin()) {
    $courseindexopen = (get_user_preferences('drawer-open-index', true) == true);
    $blockdraweropen = (get_user_preferences('drawer-open-block') == true);
} else {
    $courseindexopen = false;
    $blockdraweropen = false;
}

if (defined('BEHAT_SITE_RUNNING') && get_user_preferences('behat_keep_drawer_closed') != 1) {
    $blockdraweropen = true;
}

$extraclasses = ['uses-drawers'];
if ($courseindexopen) {
    $extraclasses[] = 'drawer-open-index';
}

$blockshtml = $OUTPUT->blocks('side-pre');
$hasblocks = (strpos($blockshtml, 'data-block=') !== false || !empty($addblockbutton));

$abovecontenthtml = $OUTPUT->blocks('abovecontent');
// Show the region if it contains blocks OR we are editing (so the drop zone exists).
$hasabovecontent = (strpos($abovecontenthtml, 'data-block=') !== false || $PAGE->user_is_editing());

if (!$hasblocks) {
    $blockdraweropen = false;
}

$courseindex = core_course_drawer();
if (!$courseindex) {
    $courseindexopen = false;
}

if (defined('BEHAT_SITE_RUNNING') && get_user_preferences('behat_keep_drawer_closed') == 1) {
    // Keep behaviour consistent with Boost in behat runs when requested.
    $courseindexopen = false;
    $blockdraweropen = false;
}

$forceblockdraweropen = $OUTPUT->firstview_fakeblocks();

// Decide whether to show a drawer (non-course pages) or a static sidebar (course view).
$showblockdrawer = !$iscourseview && $hasblocks;
$showsidebarslot = $iscourseview && $hasblocks;

// If we are not showing the block drawer, do not add the open class.
if (!$showblockdrawer) {
    $blockdraweropen = false;
}

$bodyattributes = $OUTPUT->body_attributes($extraclasses);

/**
 * Secondary navigation visibility.
 *
 * IMPORTANT: Do NOT call $OUTPUT->has_secondary_navigation() on older Moodle versions
 * (or where Boost renderer doesn't expose it), because it can fatal.
 *
 * We use:
 * - corehassecondarynavigation: core tree-driven secondary nav exists on this page
 * - mallardforcessecondarynavigation: Mallard wants to show the wrapper on course/incourse,
 *   even if core tree isn't present, because theme_mallard\output\core_renderer can output
 *   a fallback tabs row.
 */
$corehassecondarynavigation = $PAGE->has_secondary_navigation();

$mallardforcessecondarynavigation = (
    ($PAGE->pagelayout === 'course' || $PAGE->pagelayout === 'incourse') &&
    !empty($PAGE->course) &&
    !empty($PAGE->course->id) &&
    (int)$PAGE->course->id !== SITEID
);

$hassecondarynavigation = ($corehassecondarynavigation || $mallardforcessecondarynavigation);

// Overflow only exists when core has a secondarynav tree; fallback tabs won't provide it.
$overflow = '';
if ($corehassecondarynavigation && !empty($PAGE->secondarynav)) {
    $overflowdata = $PAGE->secondarynav->get_overflow_menu_data();
    if (!is_null($overflowdata)) {
        $overflow = $overflowdata->export_for_template($OUTPUT);
    }
}

$primary = new core\navigation\output\primary($PAGE);
$renderer = $PAGE->get_renderer('core');
$primarymenu = $primary->export_for_template($renderer);

// If core is not putting the settings menu into header actions, we must build it for the page.
$buildregionmainsettings = !$PAGE->include_region_main_settings_in_header_actions();
$regionmainsettingsmenu = $buildregionmainsettings ? $OUTPUT->region_main_settings_menu() : false;

// Activity header (guarded).
$headercontent = false;
if (!empty($PAGE->activityheader) && method_exists($PAGE->activityheader, 'export_for_template')) {
    $headercontent = $PAGE->activityheader->export_for_template($renderer);
}

$templatecontext = [
    'sitename' => format_string($SITE->shortname, true, [
        'context' => context_course::instance(SITEID),
        'escape'  => false,
    ]),
    'output'                    => $OUTPUT,
    'bodyattributes'            => $bodyattributes,
    'courseindexopen'           => $courseindexopen,
    'blockdraweropen'           => $blockdraweropen,
    'courseindex'               => $courseindex,
    'primarymoremenu'           => $primarymenu['moremenu'],
    'mobileprimarynav'          => $primarymenu['mobileprimarynav'],
    'usermenu'                  => $primarymenu['user'],
    'langmenu'                  => $primarymenu['lang'],
    // Mallard: template shows wrapper if true. Actual HTML comes from {{{ output.secondary_navigation }}}.
    'hassecondarynavigation'    => $hassecondarynavigation,
    'forceblockdraweropen'      => $forceblockdraweropen,
    'regionmainsettingsmenu'    => $regionmainsettingsmenu,
    'hasregionmainsettingsmenu' => !empty($regionmainsettingsmenu),
    'overflow'                  => $overflow,
    'headercontent'             => $headercontent,
    'addblockbutton'            => $addblockbutton,
    'sidepreblocks'             => $blockshtml,
    'hasblocks'                 => $hasblocks,
    'abovecontentblocks'        => $abovecontenthtml,
    'hasabovecontent'           => $hasabovecontent,
    // Static sidebar flags.
    'iscourseview'              => $iscourseview,
    'showblockdrawer'           => $showblockdrawer,
    'showsidebarslot'           => $showsidebarslot,
];

// Course progress (optional sidebar widget).
$courseprogresspercent = null;
if ($iscourseview && isloggedin() && !isguestuser()) {
    if (
        class_exists('\core_completion\progress') &&
        method_exists('\core_completion\progress', 'get_course_progress_percentage')
    ) {
        $courseprogresspercent = (int)\core_completion\progress::get_course_progress_percentage($PAGE->course, $USER->id);
    } else {
        // Fallback: compute % from activities with completion enabled.
        $completion = new completion_info($PAGE->course);
        $cms = $completion->get_activities();
        $total = 0;
        $done = 0;

        foreach ($cms as $cm) {
            if ((int)$cm->completion === COMPLETION_TRACKING_NONE) {
                continue;
            }
            $total++;
            $data = $completion->get_data($cm, true, $USER->id);
            if (!empty($data->completionstate) && (int)$data->completionstate === COMPLETION_COMPLETE) {
                $done++;
            }
        }

        if ($total > 0) {
            $courseprogresspercent = (int)round(($done / $total) * 100);
        }
    }
}

$templatecontext['courseprogresspercent'] = $courseprogresspercent;
$templatecontext['hascourseprogress'] = ($courseprogresspercent !== null);

echo $OUTPUT->render_from_template('theme_mallard/drawers', $templatecontext);