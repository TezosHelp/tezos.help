<?php
    session_start();
    require 'restrict.php';
    if($_GET) {
		if (count($_GET) == 2 && isset($_GET["id"]) && isset($_GET["entryId"])) {
            include_once '../includes/queue.php';
            $queue = new ModQueue();
            $item = $queue->getQueueItem($_GET["id"]);
            include_once '../includes/entries.php';
            $entries = new Entries();
            $entry = $entries->getEntryById((int) $_GET["entryId"]);
        } else if (isset($_GET["submit"]) && $_GET["submit"]) {
            include_once '../includes/queue.php';
            $queue = new ModQueue();
            $submit = $_GET["submit"];
            if ($submit == 'Accept' && isset($_GET["entryId"])) {
                echo '<a href="index.php"><- Back</a><BR><BR>';
                require_once '../includes/entries.php';
                $entries = new Entries();
                $entries->edit((int) $_GET["entryId"], $_GET["title"], $_GET["description"], (int) $_GET["category"], $_GET["url"], $_GET["twitter"], $_GET["facebook"]);
                $queue->acceptEntry((int) $_GET["id"]);
                include 'updateJsonFile.php';
            } else if ($submit == 'Reject') {
                echo '<a href="index.php"><- Back</a><BR><BR>';
                $queue->rejectEntry((int) $_GET["id"]);
            } else {
                echo 'Invalid submit parameter';
                exit();
            }
            exit();
        } else {
            echo 'Invalid parameters';
            exit();
        }
	} else {
        echo 'No parameters';
        exit();
    }
    function compOut(string $a) {
        global $entry, $item;
        $b = $entry["$a"];
        $c = $item["$a"];
        if ($c !== $b) {
            echo '*';
        }
    }
?>
<html>
    <body>
        <a href="index.php"><- Back</a>
        <h1>Edit entry</h1>
        <div>
        <div style="display: inline-block">
        <form action="modify.php" method="get">
        <input type="hidden" name="id" value="<?php echo $item["id"]; ?>">
            <input type="hidden" name="entryId" value="<?php echo $item["entryId"]; ?>">
            <p>
                <label for="title">Title (*)</label>
                <input name="title" id="title" type="text" value="<?php echo $item["title"]; ?>" required/>
            </p><p>
            <label for="url">Url (*)</label>
                <input name="url" id="url" type="text" value="<?php echo $item["url"]; ?>"/>
            </p><p>
                <label for="description"></label>
                <textarea name="description" id="description" rows="6" cols="40"><?php echo $item["description"]; ?></textarea>
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
        </div>
        <div style="display: inline-block; vertical-align: top">
        <form action="modify.php" method="get">
            <p>
                <input name="title" id="title" type="text" value="<?php echo $entry["title"]; ?>" disabled required/><?php compOut("title"); ?>
            </p><p>
                <input name="url" id="url" type="text" value="<?php echo $entry["url"]; ?>" disabled/><?php compOut("url"); ?>
            </p><p>
            <textarea name="description" id="description"  rows="6" cols="40" disabled><?php echo $entry["description"]; ?></textarea><?php compOut("description"); ?>
            </p><p>
                <select name="category" id="category" disabled>
                <?php
                        include_once '../includes/constants.php';
                        $counter = 0;
                        foreach (CATEGORIES as $category) {
                            $sel = '';
                            if ($entry["category"] == $counter) {
                                $sel = ' selected';
                            }
                            echo '<option value="' . $counter . '"' . $sel . '>' . $category[0] . '</option>';
                            $counter++;
                        }
                    ?>
                </select><?php compOut("category"); ?>
            </p><p>
				<input name="twitter" id="twitter" type="text" value="<?php echo $entry["twitter"]; ?>" disabled/><?php compOut("twitter"); ?>
			</p><p>
				<input name="facebook" id="facebook" type="text" value="<?php echo $entry["facebook"]; ?>" disabled/><?php compOut("facebook"); ?>
			</p>
        </form>
        </div>
        </div>
    </body>
</html>