<?php
    session_start();
    require 'restrict.php';
    echo '<a href="index.php"><- Home</a><BR><BR>';
    if($_GET) {
		if (count($_GET) == 1 && isset($_GET["id"])) {
            include_once '../includes/queue.php';
            $queue = new ModQueue();
            $item = $queue->getQueueItem($_GET["id"]);
        } else if (isset($_GET["submit"]) && $_GET["submit"]) {
            include_once '../includes/queue.php';
            $queue = new ModQueue();
            $submit = $_GET["submit"];
            if ($submit == 'Accept') {
                require_once '../includes/entries.php';
                $entries = new Entries();
                if ($queue->isUnhandled((int) $_GET["id"])) {
                    $entryId = $entries->add($_GET["title"], $_GET["description"], (int) $_GET["category"], $_GET["url"], $_GET["twitter"], $_GET["facebook"]);
                    $queue->acceptEntry($_GET["id"]);
                    include 'updateJsonFile.php';
                    include 'imgUpload.php';
                } else {
                    echo "Failed to add entry. Alredy submitted?";
                }
            } else if ($submit == 'Reject') {
                $queue->rejectEntry($_GET["id"]);
            } else {
                echo 'Invalid submit parameter';
            }
            exit();
        } else {
            echo 'Invalid parameters';
            exit();
        }
	} else if (isset($_POST) && isset($_POST["imgSubmit"])) {
        include 'imgUpload.php';
        exit();
    } else {
        echo 'No parameters';
        exit();
    }
?>
<html>
    <body>
        <h1>Add entry</h1>
        <form action="add.php" method="get">
            <input type="hidden" name="id" value="<?php echo $item["id"]; ?>">
            <p>
                <label for="title">Title (*)</label>
                <input name="title" id="title" type="text" value="<?php echo $item["title"]; ?>" required/>
            </p><p>
            <label for="url">Url (*)</label>
                <input name="url" id="url" type="text" value="<?php echo $item["url"]; ?>"/>
            </p><p>
                <label for="description">Description</label>
                <textarea name="description" id="description" rows="4"><?php echo $item["description"]; ?></textarea>
            </p><p>
                <label for="category">Category</label>
                <select name="category" id="category">
                <?php
                        include_once '../includes/constants.php';
                        $counter = 0;
                        foreach (CATEGORIES as $category) {
                            $sel = '';
                            if ($item["category"] == $counter) {
                                $sel = ' selected';
                            }
                            echo '<option value="' . $counter . '"' . $sel . '>' . $category[0] . '</option>';
                            $counter++;
                        }
                    ?>
                </select>
            </p><p>
				<label for="twitter">Twitter</label>
				<input name="twitter" id="twitter" type="text" value="<?php echo $item["twitter"]; ?>"/>
			</p><p>
				<label for="facebook">Facebook</label>
				<input name="facebook" id="facebook" type="text" value="<?php echo $item["facebook"]; ?>"/>
			</p><p>
                <input type="submit" name="submit" value="Accept"/><input name="submit" type="submit" value="Reject"/>
            </p>
        </form>
    </body>
</html>