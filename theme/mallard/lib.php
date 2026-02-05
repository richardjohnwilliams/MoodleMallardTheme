<?php
defined('MOODLE_INTERNAL') || die();

function theme_mallard_get_main_scss_content($theme) {
    global $CFG;

    $scss = '';
    $filename = !empty($theme->settings->preset) ? $theme->settings->preset : null;
    $fs = get_file_storage();

    $context = context_system::instance();

    if ($filename === 'default.scss') {
        // Load the default Boost preset directly.
        $scss .= file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/default.scss');
    } else if ($filename === 'plain.scss') {
        // Load the plain Boost preset directly.
        $scss .= file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/plain.scss');
    } else if ($filename && ($presetfile = $fs->get_file(
        $context->id,
        'theme_mallard',
        'preset',
        0,
        '/',
        $filename
    ))) {
        // Load preset uploaded to the Mallard theme file area.
        $scss .= $presetfile->get_content();
    } else {
        // Safety fallback.
        $scss .= file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/default.scss');
    }

    // Pre SCSS – loaded before the preset and main SCSS.
    $pre = file_get_contents($CFG->dirroot . '/theme/mallard/scss/pre.scss');

    // Post SCSS – loaded after the preset and main SCSS.
    $post = file_get_contents($CFG->dirroot . '/theme/mallard/scss/post.scss');

    // Combine and return.
    return $pre . "\n" . $scss . "\n" . $post;
}
