<?php
defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {

    // Use the Boost tabbed settings page class.
    $settings = new theme_boost_admin_settingspage_tabs(
        'themesettingmallard',
        get_string('configtitle', 'theme_mallard')
    );

    // General settings tab.
    $page = new admin_settingpage(
        'theme_mallard_general',
        get_string('generalsettings', 'theme_mallard')
    );

    // Add your settings to $page here.
    // Example: preset, presetfiles, brandcolor, loginbackgroundimage, etc.

    // IMPORTANT: Add the tab page to the tabbed settings container.
    $settings->add($page);

    // Advanced settings tab.
    $page = new admin_settingpage(
        'theme_mallard_advanced',
        get_string('advancedsettings', 'theme_mallard')
    );

    // Add advanced settings (scsspre, scss etc) to this $page.

    // Add the advanced tab page.
    $settings->add($page);
}
