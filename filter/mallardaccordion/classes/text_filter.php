<?php
namespace filter_mallardaccordion;

defined('MOODLE_INTERNAL') || die();

// Version-agnostic base class.
// Moodle 4.5+ may provide \core_filters\text_filter.
// Older versions use \moodle_text_filter.
if (class_exists('\\core_filters\\text_filter')) {
    abstract class base_text_filter extends \core_filters\text_filter
    {
    }
} else {
    abstract class base_text_filter extends \moodle_text_filter
    {
    }
}

class text_filter extends base_text_filter
{

    public function filter($text, array $options = [])
    {
        if (!is_string($text) || $text === '') {
            return $text;
        }

        // Only on Page activity view.
        if (!$this->is_page_module_context($options)) {
            return $text;
        }

        // Prevent double-processing if something already transformed it.
        if (stripos($text, 'mallard-accordion__ui') !== false || stripos($text, 'mallard-accordion--rendered') !== false) {
            return $text;
        }

        return $this->transform_wrappers($text);
    }

    private function is_page_module_context(array $options): bool
    {
        global $PAGE;

        // Most reliable and earliest available.
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        if ($script === '/mod/page/view.php') {
            return true;
        }

        // Fallback: Moodle pagetype often looks like "mod-page-view".
        $pagetype = $PAGE->pagetype ?? '';
        if (is_string($pagetype) && strpos($pagetype, 'mod-page-') === 0) {
            return true;
        }

        return false;
    }

    private function transform_wrappers(string $html): string
    {
        $doc = new \DOMDocument('1.0', 'UTF-8');
        $old = libxml_use_internal_errors(true);

        $wrapped = '<div id="__mallard_filter_root__">' . $html . '</div>';

        $flags = 0;
        if (defined('LIBXML_HTML_NOIMPLIED')) {
            $flags |= LIBXML_HTML_NOIMPLIED;
        }
        if (defined('LIBXML_HTML_NODEFDTD')) {
            $flags |= LIBXML_HTML_NODEFDTD;
        }

        $doc->loadHTML('<?xml encoding="UTF-8"?>' . $wrapped, $flags);

        libxml_clear_errors();
        libxml_use_internal_errors($old);

        $xpath = new \DOMXPath($doc);

        $rootnodelist = $xpath->query("//*[@id='__mallard_filter_root__']");
        $root = ($rootnodelist && $rootnodelist->length) ? $rootnodelist->item(0) : null;

        if (!$root || !($root instanceof \DOMElement)) {
            return $html;
        }

        $nodes = $xpath->query(
            ".//div[contains(concat(' ', normalize-space(@class), ' '), ' mallard-accordion ')]",
            $root
        );

        if (!$nodes || $nodes->length === 0) {
            // AUTO MODE: if there is no explicit wrapper, treat the whole content as one accordion,
            // but only if it looks like an accordion (2+ headings).
            $headingcount = 0;
            foreach ($root->childNodes as $child) {
                if ($child instanceof \DOMElement) {
                    $tag = strtolower($child->tagName);
                    if (in_array($tag, ['h2', 'h3', 'h4', 'h5', 'h6'], true)) {
                        $headingcount++;
                    }
                }
            }

            // If the page does not have at least two headings, do nothing.
            if ($headingcount < 2) {
                return $html;
            }

            // Wrap all existing root content in a mallard-accordion container.
            $auto = $doc->createElement('div');
            $auto->setAttribute('class', 'mallard-accordion mallard-accordion--auto');

            while ($root->firstChild) {
                $auto->appendChild($root->firstChild);
            }
            $root->appendChild($auto);

            // Transform the new wrapper.
            $this->transform_single_wrapper($doc, $auto);

            return $this->inner_html($root);
        }
        $wrappers = [];
        foreach ($nodes as $n) {
            if ($n instanceof \DOMElement) {
                $wrappers[] = $n;
            }
        }

        foreach ($wrappers as $wrapper) {
            $this->transform_single_wrapper($doc, $wrapper);
        }

        return $this->inner_html($root);
    }

    private function transform_single_wrapper(\DOMDocument $doc, \DOMElement $wrapper): void
    {
        $children = [];
        foreach ($wrapper->childNodes as $child) {
            $children[] = $child;
        }

        $headingtag = null;
        foreach ($children as $child) {
            if ($child instanceof \DOMElement) {
                $tag = strtolower($child->tagName);
                if (in_array($tag, ['h2', 'h3', 'h4', 'h5', 'h6'], true)) {
                    $headingtag = $tag;
                    break;
                }
            }
        }

        if (!$headingtag) {
            return;
        }

        $preamble = [];
        $panels = [];
        $current = null;

        foreach ($children as $child) {
            if ($child instanceof \DOMElement && strtolower($child->tagName) === $headingtag) {
                if ($current) {
                    $panels[] = $current;
                }

                $title = trim(preg_replace('/\s+/', ' ', $child->textContent ?? ''));
                if ($title === '') {
                    $title = 'Section';
                }

                $current = [
                    'title' => $title,
                    'nodes' => [],
                ];
                continue;
            }

            if ($current) {
                $current['nodes'][] = $child;
            } else {
                $preamble[] = $child;
            }
        }

        if ($current) {
            $panels[] = $current;
        }

        if (!$panels) {
            return;
        }

        while ($wrapper->firstChild) {
            $wrapper->removeChild($wrapper->firstChild);
        }

        $existing = trim((string) $wrapper->getAttribute('class'));
        if (strpos(' ' . $existing . ' ', ' mallard-accordion--rendered ') === false) {
            $wrapper->setAttribute('class', trim($existing . ' mallard-accordion--rendered'));
        }

        if ($preamble) {
            $pre = $doc->createElement('div');
            $pre->setAttribute('class', 'mallard-accordion__preamble');
            foreach ($preamble as $n) {
                $pre->appendChild($n);
            }
            $wrapper->appendChild($pre);
        }

        $accid = 'mallardacc_' . $this->short_id();

        $accordion = $doc->createElement('div');
        $accordion->setAttribute('class', 'accordion mallard-accordion__ui');
        $accordion->setAttribute('id', $accid);

        foreach ($panels as $i => $panel) {
            $index = $i + 1;

            $card = $doc->createElement('div');
            $card->setAttribute('class', 'card');

            $headerid = $accid . '_h' . $index;
            $collapseid = $accid . '_c' . $index;

            $header = $doc->createElement('div');
            $header->setAttribute('class', 'card-header');
            $header->setAttribute('id', $headerid);

            $h = $doc->createElement('h3');
            $h->setAttribute('class', 'h6 mb-0');

            $btn = $doc->createElement('button');
            $btn->setAttribute('type', 'button');
            $btn->setAttribute('class', 'btn btn-link w-100 text-left text-start mallard-accordion__toggle' . ($i === 0 ? '' : ' collapsed'));

            $btn->setAttribute('data-toggle', 'collapse');
            $btn->setAttribute('data-target', '#' . $collapseid);

            $btn->setAttribute('data-bs-toggle', 'collapse');
            $btn->setAttribute('data-bs-target', '#' . $collapseid);

            $btn->setAttribute('aria-controls', $collapseid);
            $btn->setAttribute('aria-expanded', $i === 0 ? 'true' : 'false');
            $btn->appendChild($doc->createTextNode($panel['title']));

            $h->appendChild($btn);
            $header->appendChild($h);

            $collapse = $doc->createElement('div');
            $collapse->setAttribute('id', $collapseid);
            $collapse->setAttribute('class', 'collapse' . ($i === 0 ? ' show' : ''));
            $collapse->setAttribute('aria-labelledby', $headerid);

            $collapse->setAttribute('data-parent', '#' . $accid);
            $collapse->setAttribute('data-bs-parent', '#' . $accid);

            $body = $doc->createElement('div');
            $body->setAttribute('class', 'card-body');

            // Two-column layout: text (col-md-8) + images (col-md-4).
            $row = $doc->createElement('div');
            $row->setAttribute('class', 'row');

            $coltext = $doc->createElement('div');
            $coltext->setAttribute('class', 'col-md-8');

            $colmedia = $doc->createElement('div');
            $colmedia->setAttribute('class', 'col-md-4');

            foreach ($panel['nodes'] as $n) {
                $coltext->appendChild($n);
            }

            // Move block-style images (and image-only wrappers) into the right column.
            $this->move_images_to_media_column($doc, $coltext, $colmedia);

            // Always append both columns (empty media column if no images).
            $row->appendChild($coltext);
            $row->appendChild($colmedia);
            $body->appendChild($row);

            $collapse->appendChild($body);
            $card->appendChild($header);
            $card->appendChild($collapse);
            $accordion->appendChild($card);
        }

        $wrapper->appendChild($accordion);
    }

    private function short_id(): string
    {
        try {
            return bin2hex(random_bytes(4));
        } catch (\Throwable $e) {
            return substr(md5((string) microtime(true)), 0, 8);
        }
    }

    private function inner_html(\DOMElement $el): string
    {
        $out = '';
        foreach ($el->childNodes as $child) {
            $out .= $el->ownerDocument->saveHTML($child);
        }
        return $out;
    }

    private function move_images_to_media_column(\DOMDocument $doc, \DOMElement $coltext, \DOMElement $colmedia): void
    {
        // Collect images first (DOMNodeList is live).
        $imgs = $coltext->getElementsByTagName('img');
        $tomove = [];
        foreach ($imgs as $img) {
            if ($img instanceof \DOMElement) {
                $tomove[] = $img;
            }
        }

        foreach ($tomove as $img) {
            $parent = $img->parentNode;

            // If the image is inside a link, treat the link as the "image node".
            if ($parent instanceof \DOMElement && strtolower($parent->tagName) === 'a') {
                $candidate = $parent;
            } else {
                $candidate = $img;
            }

            // Prefer moving a whole block wrapper if it only contains the image(s).
            $block = null;

            if ($candidate->parentNode instanceof \DOMElement) {
                $p = $candidate->parentNode;
                $tag = strtolower($p->tagName);

                if ($tag === 'figure') {
                    $block = $p; // keep figcaption with the image
                } else if ($tag === 'p' && $this->element_contains_only_images($p)) {
                    $block = $p;
                } else if ($tag === 'div' && $this->element_contains_only_images($p)) {
                    $block = $p;
                }
            }

            if ($block instanceof \DOMElement) {
                $this->ensure_img_fluid($block);
                $colmedia->appendChild($block);
            } else if ($candidate instanceof \DOMElement) {
                // Only move the image/link if it is not embedded in mixed text.
                // If it is embedded, leave it where it is to avoid breaking paragraphs.
                if ($candidate->parentNode instanceof \DOMElement && $this->element_contains_only_images($candidate->parentNode)) {
                    $this->ensure_img_fluid($candidate);
                    $colmedia->appendChild($candidate->parentNode);
                }
            }
        }

        // Clean up empty <p> left behind.
        $ps = $coltext->getElementsByTagName('p');
        $ptoclean = [];
        foreach ($ps as $p) {
            if ($p instanceof \DOMElement) {
                $ptoclean[] = $p;
            }
        }
        foreach ($ptoclean as $p) {
            $hasimg = $p->getElementsByTagName('img')->length > 0;
            if (!$hasimg && trim((string) $p->textContent) === '') {
                if ($p->parentNode) {
                    $p->parentNode->removeChild($p);
                }
            }
        }
    }

    private function element_contains_only_images(\DOMElement $el): bool
    {
        foreach ($el->childNodes as $child) {
            if ($child instanceof \DOMText) {
                if (trim($child->wholeText) !== '') {
                    return false;
                }
                continue;
            }

            if ($child instanceof \DOMElement) {
                $tag = strtolower($child->tagName);

                if ($tag === 'img') {
                    continue;
                }

                // Allow <a><img></a>
                if ($tag === 'a' && $this->element_contains_only_images($child)) {
                    continue;
                }

                // Anything else means mixed content.
                return false;
            }
        }
        return true;
    }

    private function ensure_img_fluid(\DOMElement $node): void
    {
        // Add img-fluid to any images inside the node.
        $imgs = $node->getElementsByTagName('img');
        foreach ($imgs as $img) {
            if (!$img instanceof \DOMElement) {
                continue;
            }
            $class = trim((string) $img->getAttribute('class'));
            if (strpos(' ' . $class . ' ', ' img-fluid ') === false) {
                $img->setAttribute('class', trim($class . ' img-fluid'));
            }
        }
    }
}