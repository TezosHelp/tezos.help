<?php
    require_once '../../includes/constants.php';
    if (!isset($_POST['token']) || $_POST['token'] !== UPDATE_BAKERS_TOKEN) {
        echo '*';
        exit();
    }
    $json = file_get_contents("bakers.json");
    $currentBakers = json_decode($json);
    if (isset($_POST['data']) && $_POST['data']) {
        $newBakers = json_decode($_POST['data']);
    } else {
        exit();
    }
    foreach ($newBakers as $newBaker) {
        $key = array_search($newBaker->pkh, array_column($currentBakers, 'pkh'));
        if ($key) {
            $currentBakers[$key]->name = $newBaker->name;
            if (isset($newBaker->logo)) {
                $currentBakers[$key]->logo = $newBaker->logo;
            }
            echo "<BR>Update: ";
        } else {
            array_push($currentBakers, $newBaker);
            echo "<BR>Add: ";
        }
        print_r($newBaker);
        if (isset($newBaker->logo)) {
            $subFix = substr($newBaker->logo, -4, 4);
            if ($subFix == ".png" || $subFix == ".jpg") {
                copy($newBaker->logo, "../../assets/pictures/bakers/" . $newBaker->pkh . $subFix);
            }
        }
    }
    // Update json file
    $jsonNew = json_encode($currentBakers, JSON_PRETTY_PRINT);
    $file = fopen('bakers.json', 'w');
    fwrite($file, $jsonNew);
    fclose($file);

    $file2 = fopen('bakers.js', 'w');
    fwrite($file2, "const mapOfPublicBakers = \n");
    fwrite($file2, $jsonNew);
    fwrite($file2, ";");
    fclose($file2);
?>