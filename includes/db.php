<?php
	class DB {
		public function __construct(){
			require_once 'constants.php';
			$this->conn = new mysqli(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB);
			if ($this->conn->connect_error) {
				die("Connection failed: " . $this->conn->connect_error);
			}
		}
		public function __destruct(){
			$this->conn->close();
		}
	}
?>