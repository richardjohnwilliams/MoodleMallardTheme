<?php
defined('MOODLE_INTERNAL') || die();

// Moodle 4.5+ loads the namespaced class in classes/text_filter.php.
// Older versions load filter.php and expect the legacy class name.
// This alias supports both.
class_alias(\filter_mallardaccordion\text_filter::class, \filter_mallardaccordion::class);