<?php
    include_once '../includes/auth.php';
	$auth = new Auth();
	if (isset($_SESSION['token'])) {
        if (!$auth->validToken($_SESSION['token'])) {
            echo 'Invalid token!';
            exit();
        }
	} else {
		header("Location: login.php");
		exit();
    }
?>