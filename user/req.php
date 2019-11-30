<?php
	include_once '../includes/queue.php';
	if( $_POST && isset($_POST["title"]) && $_POST["title"] && isset($_POST["description"]) && isset($_POST["category"]) && $_POST["category"] !== "-1" && 
		$_POST["category"] !== "" && isset($_POST["url"]) && $_POST["url"] && isset($_POST['twitter']) && isset($_POST['facebook']) && isset($_POST["token"])) {
	    
		// Verify captcha
		if ($_SERVER['SERVER_NAME'] !== 'localhost') {
			require_once '../includes/constants.php';
			$token = $_POST["token"];
			$target = "https://www.google.com/recaptcha/api/siteverify";
			$data = array('secret' => CAPTCHA_SECRET, 'response' => $token);
			$options = array(
				'http' => array(
					'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
					'method'  => 'POST',
					'content' => http_build_query($data)
				)
			);
			$context  = stream_context_create($options);
			$result = file_get_contents($target, false, $context);
			if (!$result) {
				echo "Error while verifying the captcha!";
				exit();
			}
			$result = json_decode($result);
			if (!$result->success) {
				echo $result->success;
				echo " Invalid captcha";
				exit();
			} else if ($result->hostname !== "tezos.help" && $result->hostname !== "www.tezos.help") {
				echo "Invalid hostname: " . $result->hostname;
				exit();
			}
		}
	    // Add to queue
		$queue = new Queue();
		if (isset($_POST["entryId"]) && $_POST["entryId"] != '') {
			$entryId = (int) $_POST["entryId"];
			$action = 2;
		} else {
			$entryId = NULL;
			$action = 1;
		}
        $queue->add($action, $entryId, $_POST["title"], $_POST["description"], $_POST["category"], $_POST["url"], $_POST['twitter'], $_POST['facebook']);
        echo "Thank you for contributing!";
	} else if ( $_GET && isset($_GET["tg"] )) {
        require_once 'telegram.php';
		$tg = new Telegram();
		$head = $tg->getHead();
        echo json_encode($head);
    } else {
		if (!isset($_POST["title"]) || !$_POST["title"]) {
			echo "Missing title!";
		} else if (!isset($_POST["url"]) || !$_POST["url"]) {
			echo "Missing url!";
		} else if (!isset($_POST["description"])) {
			echo "Missing description!";
		} else if (!isset($_POST["category"])) {
			echo "Missing category!";
		} else if ($_POST["category"] === "-1") {
			echo "No category selected!";
		} else if ($_POST["category"] === "") {
			echo "No category selected!";
		} else if (!isset($_POST["twitter"])) {
			echo "Missing twitter!";
		} else if (!isset($_POST["facebook"])) {
			echo "Missing facebook!";
		} else if (!isset($_POST["entryId"])) {
			echo "Missing entryId!";
		} else if (!isset($_POST["token"])) {
		    echo "Missing captcha";
		} else {
			echo "Missing parameters!";
		}
        exit();
    }
?>