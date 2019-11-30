<?php
    require 'restrict.php';
    $templateFile = fopen("template.html", "r");
    $outputFile = fopen("../index.html", "w");
    $jsonContent = file_get_contents("entries.json");
    $jsonLatest = file_get_contents("latestChanges.json");
    $entries = json_decode($jsonContent);
    $latest = json_decode($jsonLatest);
    while (!feof($templateFile)) {
        $line = fgets($templateFile);
        fwrite($outputFile, $line);
        if (strpos($line, '<!--Insert latest-->') !== false) {
            injectLatest();
        }
        if (strpos($line, '<!--Insert categories-->') !== false) {
            injectCategories();
        }
        if (strpos($line, '<!--Insert filters-->') !== false) {
            injectFilters();
        }
        if (strpos($line, '<!--Insert cards-->') !== false) {
            injectCards();
        }
    }
    fclose($outputFile);
    fclose($templateFile);
    function injectLatest() {
        global $outputFile, $latest;
        foreach ($latest as $item) {
            fwrite($outputFile, '<h5 class="newsitem">');
            fwrite($outputFile, explode(" ", $item->moderatedOn)[0] . ' | ');
            if ($item->action === "1") {
                fwrite($outputFile, 'Added: ');
            } else if ($item->action === "2") {
                fwrite($outputFile, 'Updated: ');
            }
            fwrite($outputFile, '<a href="' . $item->url . '" target="_blank">');
            fwrite($outputFile, $item->title . '</a>');
            fwrite($outputFile, "</h5>\n");
        }
    }
    function injectCategories() {
        global $outputFile, $latest;
        include_once '../includes/constants.php';
        $counter = 0;
        foreach (CATEGORIES as $category) {
            fwrite($outputFile, '<option value="' . $counter . '" class="selectitem">' . $category[0] . "</option>\n");
            $counter++;
        }
    }
    function injectFilters() {
        global $outputFile, $latest;
        include_once '../includes/constants.php';
        foreach (CATEGORIES as $category) {
            fwrite($outputFile, '<li class="nav-item"><a href="#" id="' . $category[1] . '" class="nav-link" data-filter=".' . $category[1] . '">' . $category[0] . "</a></li>\n");
        }
    }
    function injectCards() {
        global $entries;
        include_once '../includes/constants.php';
        $counter = 0;
        $cat = null;
        if (is_object($entries) || is_array($entries)) {
            foreach ($entries as $entry) {
                if ($cat !== $entry->category) {
                    $cat = $entry->category;
                    $counter = 0;
                } else {
                    $counter++;
                }
                if ($counter < CATEGORIES[$cat][2]) {
                    writeCard($entry, true);
                }
                writeCard($entry, false);
            }
        } else {
            echo "No json file found!<BR>";
        }
    }
    function writeCard($entry, $featured) {
        global $outputFile;
        if ($featured) {
            $catText = CATEGORIES[$entry->category][0];
            $catClass = 'featured';
        } else {
            $catText = '_';
            $catClass = CATEGORIES[$entry->category][1];
        }
        fwrite($outputFile, '<div item="card' . $entry->id . '" id="entry' . $entry->id . '" class="' . $catClass . ' item">' . "\n");
                fwrite($outputFile, '<div class="card">');
                    if (file_exists("../assets/pictures/sites/$entry->id.jpg")) {
                        $imgPath = "./assets/pictures/sites/$entry->id.jpg?" . filemtime("../assets/pictures/sites/$entry->id.jpg");
                    } else {
                        $imgPath = "../assets/pictures/sites/placeholder.jpg";
                    }
                    fwrite($outputFile, '<a href="' . $entry->url . '" target="_blank"><img class="card-img-top" src="' . $imgPath . '"></a>');
                    fwrite($outputFile, '<div class="card-body">');
                        fwrite($outputFile, '<h5 class="card-title text-center">' . $entry->title . '</h5>');
                        fwrite($outputFile, '<h6 class="card-subtitle mb-2 text-muted text-center">' . $catText . '</h6>');
                        fwrite($outputFile, '<p class="card-text">' . $entry->description . '</p>');
                    fwrite($outputFile, '</div><div class="card-footer">');
                        fwrite($outputFile, '<div class="footholder">');
                            fwrite($outputFile, '<a href="' . $entry->url . '" class="fas fa-globe" target="_blank" data-toggle="tooltip" data-placement="bottom" title="Visit website"></a>');
                            if ($entry->twitter) {
                                fwrite($outputFile, '<a href="' . $entry->twitter . '" target="_blank" class="fa fa-twitter"></a>');
                            } if ($entry->facebook) {
                                fwrite($outputFile, '<a href="' . $entry->facebook . '" target="_blank" class="fa fa-facebook"></a>');
                            }
                            fwrite($outputFile, '<span data-toggle="modal" data-entryid="' . $entry->id . '" data-entrycategory="' . $entry->category . '" data-target="#addModal">
                                <a href="#" class="fa fa-edit fa-lg float-right" data-toggle="tooltip" 
                                data-placement="bottom" title="Edit" onclick="return false;"></a></span>');
            fwrite($outputFile, '</div></div></div></div>');
    }
    function injectSections() {
        global $outputFile, $entries;
        $cat = -1;
        foreach ($entries as $entry) {
            if ($entry->category !== $cat) {
                fwrite($outputFile, sectionContent($entry->category) . "\n");
                $cat = $entry->category;
            }
            injectEntry($entry);
        }
        fwrite($outputFile, "</section>\n");
    }
    function injectEntry($entry) {
        global $outputFile;
        fwrite($outputFile, "<section id=\"entry$entry->id\">\n");
            if (file_exists("../images/$entry->id.png")) {
                $imgVersion = filemtime("../images/$entry->id.png");
            } else {
                $imgVersion = "";
            }
            fwrite($outputFile, "<a href=\"$entry->url\" target=\"_blank\" class=\"image\"><img src=\"images/$entry->id.png?" . $imgVersion . "\" data-position=\"center center\"/></a>\n");
            fwrite($outputFile, "<div class=\"content\">\n");
                fwrite($outputFile, "<div class=\"inner\">\n");
                    fwrite($outputFile, "<h2>$entry->title</h2>\n");
                    fwrite($outputFile, "<p>$entry->description</p>\n");
                    fwrite($outputFile, "<ul class=\"actions\">\n");
                        fwrite($outputFile, "<li><a href=\"$entry->url\" target=\"_blank\" class=\"button\">Visit</a></li>\n");
                        if ($entry->twitter) {
                            fwrite($outputFile, "<li><a href=\"$entry->twitter\" target=\"_blank\" class=\"icon fa-twitter\"><span class=\"label\">Twitter</span></a></li>\n");
                        } if ($entry->facebook) {
                            fwrite($outputFile, "<li><a href=\"$entry->facebook\" target=\"_blank\" class=\"icon fa-facebook\"><span class=\"label\">Facebook</span></a></li>\n");
                        }
                        fwrite($outputFile, "<li style=\"float:right\"><a style=\"cursor:pointer\" data-toggle=\"modal\" data-target=\"#modal\" data-entryid=\"$entry->id\" data-entrycategory=\"$entry->category\">Edit</a></li>");
                    fwrite($outputFile, "</ul>\n");
                fwrite($outputFile, "</div>\n");
            fwrite($outputFile, "</div>\n");
        fwrite($outputFile, "</section>\n");
    }
?>