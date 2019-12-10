<?php
    if (isset($_GET['path']) && $_GET['path']) {
        $path = base64_decode($_GET['path']);
        $json = @file_get_contents($path);
        echo $json;
    } else {
        echo "[]";
    }
?>