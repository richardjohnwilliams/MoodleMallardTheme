<?php
namespace theme_mallard\output;

defined('MOODLE_INTERNAL') || die();

use moodle_url;

/**
 * Mallard core renderer overrides.
 *
 * @package    theme_mallard
 */
class core_renderer extends \theme_boost\output\core_renderer {

    /**
     * Append the tutor block after the normal course content footer.
     *
     * @param bool $onlyifnotcalledbefore
     * @return string
     */
    public function course_content_footer($onlyifnotcalledbefore = false) {
    static $tutorappended = false;

    // Always take whatever core wants to output here.
    $html = parent::course_content_footer($onlyifnotcalledbefore);

    // If we've already appended the tutor once during this request, stop here.
    if ($tutorappended) {
        return $html;
    }

    $course = $this->page->course ?? null;
    if (!$course || empty($course->id) || (int)$course->id === (int)SITEID) {
        return $html;
    }

    // Only on the main course page (/course/view.php), not /course/section.php.
    $url = $this->page->url ?? null;
    if (!$url || !($url instanceof \moodle_url) || $url->get_path() !== '/course/view.php') {
        return $html;
    }

    // Optional: only show for Topics format.
    try {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');

        $format = \course_get_format($course)->get_format();
        if ($format !== 'topics') {
            return $html;
        }
    } catch (\Throwable $e) {
        return $html;
    }

    // 1) Prefer the course creator (derived from logs).
    $context = $this->get_course_creator_tutor_context($course);

    // 2) Fallback: course contact / editing teacher.
    if (empty($context['tutor'])) {
        $context = $this->get_course_contact_tutor_context($course);
    }

    if (!empty($context['tutor'])) {
        $html .= $this->render_from_template('theme_mallard/course_creator_tutor', $context);
        $tutorappended = true;
    }

    return $html;
}

    /**
     * Mallard decision: should a secondary navigation row exist on this page?
     * Version-safe: do not assume page methods exist.
     *
     * @return bool
     */
    public function has_secondary_navigation(): bool {
        // If core already has a secondary nav tree, we definitely want it.
        if (!empty($this->page) && method_exists($this->page, 'has_secondary_navigation')) {
            if ($this->page->has_secondary_navigation()) {
                return true;
            }
        }

        $course = $this->page->course ?? null;
        if (!$course || empty($course->id) || (int)$course->id === (int)SITEID) {
            return false;
        }

        // Exclude layouts where Moodle intentionally keeps things minimal.
        $layout = $this->page->pagelayout ?? '';
        if (in_array($layout, ['embedded', 'popup', 'print'], true)) {
            return false;
        }

        // Only show on course/incourse layouts (keeps it tight).
        return in_array($layout, ['course', 'incourse'], true);
    }

    /**
     * Output the secondary navigation HTML.
     * Version-safe:
     *  - If core has a secondarynav tree and more_menu exists, render it.
     *  - Else render fallback tabs (capability-aware).
     *
     * @return string
     */
    public function secondary_navigation(): string {
        // 1) Core tree-driven nav, when available.
        if (!empty($this->page)
            && method_exists($this->page, 'has_secondary_navigation')
            && $this->page->has_secondary_navigation()
            && property_exists($this->page, 'secondarynav')
            && !empty($this->page->secondarynav)
            && class_exists('\core\navigation\output\more_menu')
        ) {
            $tablistnav = false;
            if (method_exists($this->page, 'has_tablist_secondary_navigation')) {
                $tablistnav = (bool)$this->page->has_tablist_secondary_navigation();
            }

            $moremenu = new \core\navigation\output\more_menu(
                $this->page->secondarynav,
                'nav-tabs',
                true,
                $tablistnav
            );

            // Return the inner HTML.
            return $this->render($moremenu);
        }

        // 2) If Mallard doesn't want a row here, output nothing.
        if (!$this->has_secondary_navigation()) {
            return '';
        }

        // 3) Fallback tabs.
        $course = $this->page->course ?? null;
        if (!$course || empty($course->id) || (int)$course->id === (int)SITEID) {
            return '';
        }

        $courseid = (int)$course->id;
        $context  = \context_course::instance($courseid);

        $items = [];
        $items[] = ['label' => 'Course', 'url' => new moodle_url('/course/view.php', ['id' => $courseid])];

        if (has_capability('moodle/course:viewparticipants', $context)) {
            $items[] = ['label' => 'Participants', 'url' => new moodle_url('/user/index.php', ['id' => $courseid])];
        }

        // Grades: staff to grader report, students to user report.
        if (has_capability('gradereport/grader:view', $context)) {
            $items[] = ['label' => 'Grades', 'url' => new moodle_url('/grade/report/grader/index.php', ['id' => $courseid])];
        } else if (
            has_capability('gradereport/user:view', $context)
            || has_capability('moodle/grade:view', $context)
            || has_capability('moodle/grade:viewall', $context)
        ) {
            $items[] = ['label' => 'Grades', 'url' => new moodle_url('/grade/report/user/index.php', ['id' => $courseid])];
        }

        if (has_capability('moodle/course:update', $context)) {
            $items[] = ['label' => 'Question bank', 'url' => new moodle_url('/question/edit.php', ['courseid' => $courseid])];
            $items[] = ['label' => 'Competencies', 'url' => new moodle_url('/admin/tool/lp/coursecompetencies.php', ['courseid' => $courseid])];
        }

        $lis = '';
        foreach ($items as $item) {
            $isactive = false;
            if (!empty($this->page->url) && $item['url'] instanceof moodle_url) {
                $isactive = $this->page->url->compare($item['url'], URL_MATCH_BASE);
            }

            $linkclasses = 'nav-link' . ($isactive ? ' active' : '');
            $link = \html_writer::link($item['url'], $item['label'], ['class' => $linkclasses]);
            $lis .= \html_writer::tag('li', $link, ['class' => 'nav-item']);
        }

        return \html_writer::tag(
            'nav',
            \html_writer::tag('ul', $lis, ['class' => 'nav nav-tabs']),
            ['class' => 'moremenu navigation']
        );
    }

    /**
     * Build tutor context from the course creation log event (best-effort).
     * This relies on log retention and the standard log store being installed.
     *
     * @param \stdClass $course
     * @return array
     */
    private function get_course_creator_tutor_context(\stdClass $course): array {
        global $DB;

        // Guard: table exists (keeps this safe if the log store is not present for any reason).
        try {
            $manager = $DB->get_manager();
            if (!$manager->table_exists('logstore_standard_log')) {
                return [];
            }
        } catch (\Throwable $e) {
            return [];
        }

        $sql = "SELECT l.userid
                  FROM {logstore_standard_log} l
                 WHERE l.eventname = :eventname
                   AND l.objecttable = :objecttable
                   AND l.objectid = :courseid
              ORDER BY l.timecreated ASC";
        $params = [
            'eventname' => '\\core\\event\\course_created',
            'objecttable' => 'course',
            'courseid' => (int)$course->id,
        ];

        $userid = $DB->get_field_sql($sql, $params, IGNORE_MULTIPLE);
        if (empty($userid)) {
            return [];
        }

        $user = \core_user::get_user((int)$userid);
        if (!$user || !empty($user->deleted)) {
            return [];
        }

        return $this->build_tutor_context_from_user($user, $course);
    }

    /**
     * Fallback: build tutor context from course contacts / editing teacher role assignment.
     *
     * @param \stdClass $course
     * @return array
     */
    private function get_course_contact_tutor_context(\stdClass $course): array {
        global $CFG, $DB;

        $coursecontext = \context_course::instance($course->id);

        // Roles shown as "course contacts" are controlled by $CFG->coursecontact (comma-separated role IDs).
        $roleids = [];
        if (!empty($CFG->coursecontact)) {
            $roleids = array_filter(array_map('intval', explode(',', $CFG->coursecontact)));
        }

        // Fallback: try editingteacher if course contacts is not configured.
        if (empty($roleids)) {
            $editingteacher = $DB->get_record('role', ['shortname' => 'editingteacher'], 'id', IGNORE_MISSING);
            if ($editingteacher && !empty($editingteacher->id)) {
                $roleids = [(int)$editingteacher->id];
            }
        }

        if (empty($roleids)) {
            return [];
        }

        list($insql, $inparams) = $DB->get_in_or_equal($roleids, SQL_PARAMS_NAMED, 'r');
        $params = ['contextid' => $coursecontext->id] + $inparams;

        $sql = "SELECT u.*
                  FROM {role_assignments} ra
                  JOIN {user} u ON u.id = ra.userid
                 WHERE ra.contextid = :contextid
                   AND ra.roleid $insql
                   AND u.deleted = 0
              ORDER BY u.lastname, u.firstname";

        $users = $DB->get_records_sql($sql, $params, 0, 1);
        if (!$users) {
            return [];
        }

        $user = reset($users);
        return $this->build_tutor_context_from_user($user, $course);
    }

    /**
     * Convert a Moodle user record into the template context the Mustache file expects.
     *
     * @param \stdClass $user
     * @param \stdClass $course
     * @return array
     */
    private function build_tutor_context_from_user(\stdClass $user, \stdClass $course): array {
        global $USER;

        // This returns HTML, which your Mustache expects as {{{ picture }}}.
        $picture = $this->user_picture($user, [
            'size' => 100,
            'class' => 'rounded-circle',
            'link' => false,
        ]);

        $bio = '';
        if (!empty($user->description)) {
            $bio = format_text(
                $user->description,
                $user->descriptionformat,
                ['context' => \context_user::instance($user->id)]
            );
        }

        // Link to profile page.
        $profileurl = (new moodle_url('/user/profile.php', [
            'id' => $user->id,
            'course' => $course->id,
        ]))->out(false);

        // Only allow "Edit profile" for the tutor themselves, and only if they can edit own profile.
        $editprofileurl = '';
        $usercontext = \context_user::instance($user->id);
        if ((int)$USER->id === (int)$user->id && has_capability('moodle/user:editownprofile', $usercontext)) {
            $editprofileurl = (new moodle_url('/user/edit.php', [
                'id' => $user->id,
                'course' => $course->id,
            ]))->out(false);
        }

        return [
            'tutor' => [
                'fullname' => fullname($user),
                'picture' => $picture,
                'bio' => $bio,
                'profileurl' => $profileurl,
                'editprofileurl' => $editprofileurl,
            ],
        ];
    }
}