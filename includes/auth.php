<?php
    class Auth {
		public function __construct() {
			require_once 'db.php';
			$this->db = new DB();
        }
        public function createSession(string $pwd) {
            $id = $this->getId("klas");
            if ($this->validPwd($id, $pwd)) {
                return $this->setToken($id);
            }
        }
        public function validToken(string $token) {
            $stmt = $this->db->conn->prepare("SELECT COUNT(id) FROM mods WHERE token=?");
            mysqli_stmt_bind_param($stmt, 's', $token);
            $stmt->execute();
            $stmt->store_result();
            $stmt->bind_result($count);
            $stmt->fetch();
			return $count;
        }
        private function validPwd(int $id, string $pwd) {
            $stmt = $this->db->conn->prepare("SELECT hash from mods WHERE id=?");
            mysqli_stmt_bind_param($stmt, 'i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            $hash = $row["hash"];
            if (password_verify($pwd, $hash)) {
                return true;
            }
            return false;
        }
        private function getId(string $usr) {
            $stmt = $this->db->conn->prepare("SELECT id from mods WHERE user=?");
            mysqli_stmt_bind_param($stmt, 'i', $usr);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            return $row["id"];
        }
        private function setToken(int $id) {
            $token = bin2hex(random_bytes(32));
            $stmt = $this->db->conn->prepare("UPDATE mods SET token=? WHERE id=?");
            mysqli_stmt_bind_param($stmt, 'si', $token, $id);
            $stmt->execute();
            $stmt->close();
            return $token;
        }
    }
?>