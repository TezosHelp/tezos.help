<?php
if (isset($_GET['target']) && $_GET['target']) {
    $target = base64_decode($_GET['target']);
    $json = @file_get_contents($target);
    if ($json) {
        $obj = json_decode($json);
        if ($obj && isset($obj->branding)) {
            if (isset($obj->branding->logo256) && $obj->branding->logo256) {
                echo $obj->branding->logo256;
            } else if (isset($obj->branding->logo1024) && $obj->branding->logo1024) {
                echo $obj->branding->logo1024;
            }
        }
    }
}
?>