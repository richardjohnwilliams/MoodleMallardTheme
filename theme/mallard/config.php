<?php

// Every file should have GPL and copyright in the header - we skip it in tutorials but you should not skip it for real.

// This line protects the file from being accessed by a URL directly.
defined('MOODLE_INTERNAL') || die();

// $THEME is defined before this page is included and we can define settings by adding properties to this global object.

// The first setting we need is the name of the theme. This should be the last part of the component name, and the same
// as the directory name for our theme.
$THEME->name = 'mallard';

$THEME->favicon = 'pix/favicon.ico';

// This setting lists the style sheets we want to include in our theme.
// Because we want to use SCSS instead of CSS, we do not list any CSS files here.
$THEME->sheets = [];

// This setting can be used to style the content in the text editor.
// Atto does not need this, so we leave it empty.
$THEME->editor_sheets = [];

// This is a critical setting.
// We inherit from Boost to get Bootstrap-based layouts, templates, and defaults.
$THEME->parents = ['boost'];

// Boost does not support a dock, so neither do we.
$THEME->enable_dock = false;

// Legacy YUI CSS modules are not required for Boost-based themes.
$THEME->yuicssmodules = array();

// This renderer factory allows the theme to override any core renderer.
$THEME->rendererfactory = 'theme_overridden_renderer_factory';

// Boost does not require any specific blocks to be present.
$THEME->requiredblocks = '';

// Prevents the "Add a block" block from forcing a block region.
$THEME->addblockposition = BLOCK_ADDBLOCK_POSITION_FLATNAV;

// Enable the edit switch in the navigation bar.
$THEME->haseditswitch = true;

// This callback allows us to inject SCSS before the main content.
$THEME->prescsscallback = 'theme_mallard_get_pre_scss';

// This function returns the SCSS source for the main file in our theme.
// We override the Boost version so that presets uploaded to Mallard’s
// own file area can be selected in the preset list.
$THEME->scss = function($theme) {
    return theme_mallard_get_main_scss_content($theme);
};

// Optional post-processing of the compiled CSS.
$THEME->csspostprocess = 'theme_mallard_process_css';

$THEME->javascripts_footer = ['sectioncards', 'sectioncardimages', 'sectioncardcounts'];

$THEME->layouts = [
    'base' => [
        'file' => 'drawers.php',
        'regions' => [],
    ],

    // Standard pages (non-course pages which still use drawers.php).
    'standard' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre', 'abovecontent'],
        'defaultregion' => 'side-pre',
    ],

    // Main course page.
    'course' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre', 'abovecontent'],
        'defaultregion' => 'side-pre',
        'options' => ['langmenu' => true],
    ],

    'coursecategory' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre', 'abovecontent'],
        'defaultregion' => 'side-pre',
    ],

    // Course activity pages.
    'incourse' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre', 'abovecontent'],
        'defaultregion' => 'side-pre',
    ],

    // Site home.
    'frontpage' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre', 'abovecontent'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],

    // Server administration scripts.
    'admin' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
    ],

    // My courses page.
    'mycourses' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true],
    ],

    // My dashboard page.
    'mydashboard' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => ['nonavbar' => true, 'langmenu' => true],
    ],

    // My public page.
    'mypublic' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
    ],

    'login' => [
        'file' => 'login.php',
        'regions' => [],
        'options' => ['langmenu' => true],
    ],

    'popup' => [
        'file' => 'columns1.php',
        'regions' => [],
        'options' => [
            'nofooter' => true,
            'nonavbar' => true,
            'activityheader' => [
                'notitle' => true,
                'nocompletion' => true,
                'nodescription' => true,
            ],
        ],
    ],

    'frametop' => [
        'file' => 'columns1.php',
        'regions' => [],
        'options' => [
            'nofooter' => true,
            'nocoursefooter' => true,
            'activityheader' => [
                'nocompletion' => true,
            ],
        ],
    ],

    'embedded' => [
        'file' => 'embedded.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
    ],

    'maintenance' => [
        'file' => 'maintenance.php',
        'regions' => [],
    ],

    'print' => [
        'file' => 'columns1.php',
        'regions' => [],
        'options' => ['nofooter' => true, 'nonavbar' => false, 'noactivityheader' => true],
    ],

    'redirect' => [
        'file' => 'embedded.php',
        'regions' => [],
    ],

    'report' => [
        'file' => 'drawers.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
    ],

    'secure' => [
        'file' => 'secure.php',
        'regions' => ['side-pre'],
        'defaultregion' => 'side-pre',
        'options' => [
            'activityheader' => [
                'notitle' => false,
            ],
        ],
    ],
];
$THEME->javascript = [
    'latest_announcement_header',
];
