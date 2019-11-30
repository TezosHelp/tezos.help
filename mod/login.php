<?php
    if ($_POST && isset($_POST["pwd"])) {
        $pwd = $_POST["pwd"];
        include_once '../includes/auth.php';
        $auth = new Auth();
        $token = $auth->createSession($pwd);
        if ($token) {
            session_start();
            $_SESSION["token"] = $token;
            header("Location: index.php");
        }
    } if ($_GET && isset($_GET["pwdGen"])) {
        echo 'Hash: ' . password_hash($_GET["pwdGen"], PASSWORD_DEFAULT);
    }
?>
<form action="" method="POST">
    <input type="password" size="20" name="pwd"><BR>
    <input type="submit" value="Authenticate">
</form>