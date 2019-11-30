<?php
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
        echo "<a href=\"javascript:history.back()\"><- Back</a>";
    }
    require 'restrict.php';
    define("IMG_PATH", "/assets/pictures/sites/");
    if (isset($_POST) && isset($_POST["imgSubmit"])) {
        $dir = $_SERVER['DOCUMENT_ROOT'] . IMG_PATH;
        $fileName = $_POST["entryId"] . '.jpg';
        $filePath = $dir . $fileName;
        $fileExtension = strtolower(pathinfo(basename($_FILES["img"]["name"]), PATHINFO_EXTENSION));
        $imgSize = getimagesize($_FILES["img"]["tmp_name"]);
        if ($fileExtension !== 'jpg') {
            echo "Not a jpg image!";
        } else if ($imgSize[0] !== 800 || $imgSize[1] !== 400) {
            echo "Image must be of resolution: 800x400";
        } else if (move_uploaded_file($_FILES["img"]["tmp_name"], $filePath)) {
            echo "Image ". basename( $fileName). " uploaded!";
            echo "<BR><img src=\".." . IMG_PATH . $fileName . "\">";
            include_once './updateJsonFile.php';
            exit();
        } else {
            echo "Failed to upload image";
        }
    } else if (isset($entryId) && !file_exists($_SERVER['DOCUMENT_ROOT'] . IMG_PATH . $entryId . ".jpg")) {
        copy($_SERVER['DOCUMENT_ROOT'] . IMG_PATH . "placeholder.jpg", $_SERVER['DOCUMENT_ROOT'] . IMG_PATH . $entryId . ".jpg");
    }
    if (isset($_GET["entryId"])) {
        $entryId = $_GET["entryId"];
    } else if (isset($_POST["entryId"])) {
        $entryId = $_POST["entryId"];
    }
?>
<html>
    <body>
        <?php 
            if ($_GET && isset($_GET["url"])) {
                echo "<BR>" . $_GET["url"];
            } else if ($entryId) {
                echo "<BR><img src=\".." . IMG_PATH . $entryId . ".jpg?" . rand() . "\">";
            }
        ?>
        <form action="add.php" method="post" enctype="multipart/form-data">
            <BR><label for="file">Image:</label>
            <input type="hidden" name="entryId" value="<?php
            if (isset($entryId)) {
                echo $entryId;
            } else {
                echo "\">Unknown Id";
                exit();
            }
             ?>">
            <input type="file" name="img" id="img"><BR>
            <input type="submit" value="Upload" name="imgSubmit">
        </form>
    </body>
</html>