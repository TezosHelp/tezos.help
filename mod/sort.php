<?php
    session_start();
    require 'restrict.php';
    require_once '../includes/entries.php';
    $entries = new Entries();
    if ($_GET && isset($_GET["category"])) {
        if (isset($_GET["id"])) {
            if (isset($_GET["up"])) {
                $entries->moveUp((int) $_GET["id"]);
                include 'updateJsonFile.php';
            } else if (isset($_GET["down"])) {
                $entries->moveDown((int) $_GET["id"]);
                include 'updateJsonFile.php';
            } else if (isset($_GET["delete"])) {
                $entries->delete((int) $_GET["id"]);
                include 'updateJsonFile.php';
            }
        }
    } else {
        $_GET["category"] = "0";
    }
    $category = (int) $_GET["category"];
    require_once '../includes/entries.php';
    $entries = new Entries();
    $result = $entries->getEntries($category);
?>
<html>
    <body>
        <a href="index.php"><-- Back</a><BR>
        <p>
            <label for="category">Category</label>
            <select name="category" id="category" onchange="location = 'sort.php?category=' + this.value">
            <?php
                        include_once '../includes/constants.php';
                        $counter = 0;
                        foreach (CATEGORIES as $cat) {
                            $sel = '';
                            if ($category == $counter) {
                                $sel = ' selected';
                            }
                            echo '<option value="' . $counter . '"' . $sel . '>' . $cat[0] . '</option>';
                            $counter++;
                        }
                    ?>
            </select>
        </p>
        <table>
            <thead>
                <tr>
                    <td>Title</td><td>Move</td><td>Image</td><td>Delete</td>
                </tr>
            </thead>
            <tbody>
            <?php
                if (sizeof($result)) {
                    foreach ($result as $row) {
                        echo "<tr><td>" . $row["title"] . "</td><td>
                            <a href=\"sort.php?category=$category&id=" . $row["id"] . "&down\">&#x25BC;</a>
                            <a href=\"sort.php?category=$category&id=" . $row["id"] . "&up\">&#x25B2;</a>
                            </td><td>
                            <a href=\"imgUpload.php?entryId=" . $row["id"] . "\">edit</a>
                            </td><td>
                            <a href=\"sort.php?category=$category&id=" . $row["id"] . "&delete\" onclick=\"return confirm('Are your sure you want to delete this entry?')\">X</a>
                            </td></tr>";
                    }
                }
            ?>
            </tbody>
        </table>
    </body>
</html>