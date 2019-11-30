<?php
    require 'restrict.php';
    // entries.json
    require_once '../includes/entries.php';
    $entries = new Entries();
    $result = $entries->getJsonObject();
    $json = json_encode($result, JSON_PRETTY_PRINT);
    if ( $json === false ) {
        if (json_last_error_msg() === 'json_encode fail: Malformed UTF-8 characters, possibly incorrectly encoded') {
            $json = json_encode(utf8ize($result), JSON_PRETTY_PRINT);
        } else {
            echo "json_encode fail: " . json_last_error_msg();
        }
    }
    $file = fopen('entries.json', 'w');
    fwrite($file, $json);
    fclose($file);
    // latest.json
    require_once '../includes/queue.php';
    $queue = new ModQueue();
    $result2 = $queue->latestChanges(20);
    $latest = [];
    require_once '../includes/entries.php';
    $entries = new Entries();
    define("LATEST_COUNT", 3);
    foreach ($result2 as $item) {
        if (count($latest) < LATEST_COUNT) {
            $ans = $entries->linkExist($item->url);
            if ($ans) {
                $latest[] = $item;
            }
        }
    }
    $json2 = json_encode($latest, JSON_PRETTY_PRINT);
    $file2 = fopen('latestChanges.json', 'w');
    fwrite($file2, $json2);
    fclose($file2);
    require_once 'json2html.php';
    function utf8ize( $mixed ) {
        if (is_array($mixed)) {
            foreach ($mixed as $key => $value) {
                $mixed[$key] = utf8ize($value);
            }
        } elseif (is_string($mixed)) {
            return mb_convert_encoding($mixed, "UTF-8", "UTF-8");
        }
        return $mixed;
    }
?>