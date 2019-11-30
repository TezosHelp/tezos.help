<?php
	session_start();
	if (isset($_GET["logout"])) {
		session_unset();
		session_destroy();
	}
	require_once 'restrict.php';
	?>
	<a href="index.php">Refresh</a> <a href="sort.php">Sort</a> <a href="entries.json" target="_blank">Json</a> <a href="index.php?logout">Logout</a><BR>
	    <?php
	include_once '../includes/queue.php';
	$queue = new ModQueue();
	$result = $queue->getQueue();
	echo '<BR>';
	if (sizeof($result) > 0) {
		echo '<table><thead><tr><td>action</td><td>title</td><td>View</td></thead><tbody>';
		 foreach ($result as $row) {
			if ($row["action"] != '1') {
				$entryId = '&entryId=' . $row["entryId"];
			} else {
				$entryId = '';
			}
			echo "<tr><td>" . $queue->actionToString($row["action"]) . "</td><td>" . $row["title"].
			"</td><td><a href=\"" . $queue->actionToString($row["action"]) . ".php?id=" .$row["id"] . $entryId . "\">open</a></td></tr>";
		 }
		 echo '</tbody></table>';
	} else {
		echo 'Empty queue';
	}
?>