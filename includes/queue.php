<?php
	class Queue {
		public function __construct() {
			require_once 'db.php';
			$this->db = new DB();
		}
		public function add(int $action, $entryId, string $title, string $description, int $category, string $url, string $twitter, string $facebook) {
			$stmt = $this->db->conn->prepare("INSERT INTO queue (action, entryId, title, description, category, url, twitter, facebook) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
			$action = filter_var($action, FILTER_SANITIZE_NUMBER_INT);
			$entryId = filter_var($entryId, FILTER_SANITIZE_NUMBER_INT);
			$title = filter_var($title, FILTER_SANITIZE_STRING);
			$description = filter_var($description, FILTER_SANITIZE_STRING);
			$category = filter_var($category, FILTER_SANITIZE_NUMBER_INT);
			$url = filter_var($url, FILTER_SANITIZE_URL);
			$twitter = filter_var($twitter, FILTER_SANITIZE_URL);
			$facebook = filter_var($facebook, FILTER_SANITIZE_URL);
			mysqli_stmt_bind_param($stmt, 'iississs', $action, $entryId, $title, $description, $category, $url, $twitter, $facebook);
			$stmt->execute();
			$stmt->close();
			include_once 'email.php';
			$email = new Email();
			if ($action == 1) {
				$email->addRequest($title);
			} else if ($action == 2) {
				$email->editRequest($title);
			}
		}
	}
	class ModQueue extends Queue {
		public function __construct() {
			require_once 'db.php';
			$this->db = new DB();
		}
		public function getQueue() {
			$sql = "SELECT id,action,entryId,title FROM queue WHERE accepted IS NULL";
			$result = $this->db->conn->query($sql);
			$queue = [];
            while ($row = $result->fetch_assoc()) {
                $queue[] = $row;
            }
			return $queue;
		}
		public function getQueueItem(int $id) {
			$stmt = $this->db->conn->prepare("SELECT * from queue WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'i', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			$row = $result->fetch_assoc();
			$stmt->close();
			return $row;
		}
		public function latestChanges(int $n = 10) {
			$sql = "SELECT action,title,url,moderatedOn FROM queue WHERE accepted = 1 ORDER BY moderatedOn DESC LIMIT $n";
			$result = $this->db->conn->query($sql);
			$queue = [];
            while ($row = $result->fetch_object()) {
                $queue[] = $row;
            }
			return $queue;
		}
		public function isUnhandled(int $id) {
			$stmt = $this->db->conn->prepare("SELECT accepted from queue WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'i', $id);
			$stmt->execute();
			$result = $stmt->get_result();
			$row = $result->fetch_assoc();
			$stmt->close();
			if ($row["accepted"] === NULL) {
				return true;
			}
			return false;
		}
		public function actionToString(int $action) {
			switch ($action) {
				case 0:
					return 'delete';
					break;
				case 1:
					return 'add';
					break;
				case 2:
					return 'modify';
					break;
				default:
					return 'index';
			}
		}
		public function acceptEntry(int $id) {
			$this->handledEntry($id, true);
			echo "Entry $id accepted!";
		}
		public function rejectEntry(int $id) {
			$this->handledEntry($id, false);
			echo "Entry $id rejected!";
		}
		private function handledEntry(int $id, bool $accepted) {
			$stmt = $this->db->conn->prepare("UPDATE queue SET accepted=? WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'ii', $accepted, $id);
			$stmt->execute();
			$stmt->close();
		}
	}
?>