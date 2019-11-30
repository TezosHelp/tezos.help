<?php
    class Entries {
        public function __construct() {
            require_once 'db.php';
			$this->db = new DB();
        }
        public function add(string $title, string $description, int $category, string $url, string $twitter, string $facebook) {
            $weight = $this->categorySize($category);
            $stmt = $this->db->conn->prepare("INSERT INTO entries (title, description, category, url, twitter, facebook, weight ) VALUES (?, ?, ?, ?, ?, ?, ?)");
			mysqli_stmt_bind_param($stmt, 'ssisssi', $title, $description, $category, $url, $twitter, $facebook, $weight);
			$stmt->execute();
            $stmt->close();
            return $this->getEntryByWeight($weight, $category)["id"];
        }
        public function edit(int $id, string $title, string $description, int $category, string $url, string $twitter, string $facebook) {
            $entry = $this->getEntryById($id);
            $currWeight = $entry["weight"];
            $maxWeight = $this->categorySize($entry["category"]) - 1;
            if ($category == $entry["category"]) {
                $weight = $entry["weight"];
            } else {
                while (++$currWeight <= $maxWeight) {
                    $entry = $this->getEntryByWeight($currWeight, $entry["category"]);
                    $this->setWeight($entry["id"], $currWeight - 1);
                }
                $weight = $this->categorySize($category);
            }
            $stmt = $this->db->conn->prepare("UPDATE entries SET title=?, description=?, category=?, url=?, twitter=?, facebook=?, weight=? WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'ssisssii', $title, $description, $category, $url, $twitter, $facebook, $weight, $id);
			$stmt->execute();
			$stmt->close();
        }
        public function delete(int $id) {
            $entry = $this->getEntryById($id);
            $currWeight = $entry["weight"];
            $maxWeight = $this->categorySize($entry["category"]) - 1;
            $stmt = $this->db->conn->prepare("DELETE FROM entries WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'i', $id);
			$stmt->execute();
            $stmt->close();
            while (++$currWeight <= $maxWeight) {
                $entry = $this->getEntryByWeight($currWeight, $entry["category"]);
                $this->setWeight($entry["id"], $currWeight - 1);
            }
        }
        private function categorySize(int $category) {
            $stmt = $this->db->conn->prepare("SELECT COUNT(id) FROM entries WHERE category=?");
            mysqli_stmt_bind_param($stmt, 'i', $category);
            $stmt->execute();
            $stmt->store_result();
            $stmt->bind_result($count);
            $stmt->fetch();
			return $count;
        }
        public function getJsonObject() {
            $sql = "SELECT id,category,title,description,url,twitter,facebook FROM entries ORDER BY category, weight";
            $result = $this->db->conn->query($sql);
            $entries = [];
            while ($row = $result->fetch_object()) {
                array_push($entries, $row);
            }
            return $entries;
        }
        public function getEntries(int $category) {
            $stmt = $this->db->conn->prepare("SELECT id,title FROM entries WHERE category=? ORDER BY weight");
            mysqli_stmt_bind_param($stmt, 'i', $category);
            $stmt->execute();
            $result = $stmt->get_result();
            $obj = [];
            while ($row = $result->fetch_assoc()) {
                $obj[] = $row;
            }
            return $obj;
        }
        public function moveUp(int $id) {
            $entryX = $this->getEntryById($id);
            if ($entryX["weight"] != 0) {
                $entryY = $this->getEntryByWeight($entryX["weight"] - 1, $entryX["category"]);
                $this->setWeight($entryX["id"], $entryY["weight"]);
                $this->setWeight($entryY["id"], $entryX["weight"]);
            }
        }
        public function moveDown(int $id) {
            $entryX = $this->getEntryById($id);
            $maxWeight = $this->categorySize($entryX["category"]) - 1;
            if ($entryX["weight"] < $maxWeight) {
                $entryY = $this->getEntryByWeight($entryX["weight"] + 1, $entryX["category"]);
                $this->setWeight($entryX["id"], $entryY["weight"]);
                $this->setWeight($entryY["id"], $entryX["weight"]);
            }
        }
        private function setWeight(int $id, int $weight) {
            $stmt = $this->db->conn->prepare("UPDATE entries SET weight=? WHERE id=?");
			mysqli_stmt_bind_param($stmt, 'ii', $weight, $id);
			$stmt->execute();
			$stmt->close();
        }
        public function getEntryByWeight(int $weight, int $category) {
            $stmt = $this->db->conn->prepare("SELECT * FROM entries WHERE weight=? AND category=?");
            mysqli_stmt_bind_param($stmt, 'ii', $weight, $category);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_assoc();
        }
        public function getEntryById(int $id) {
            $stmt = $this->db->conn->prepare("SELECT * FROM entries WHERE id=?");
            mysqli_stmt_bind_param($stmt, 'i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_assoc();
        }
        public function linkExist(string $url) {
            $stmt = $this->db->conn->prepare("SELECT COUNT(id) FROM entries WHERE url=?");
            mysqli_stmt_bind_param($stmt, 's', $url);
            $stmt->execute();
            $stmt->store_result();
            $stmt->bind_result($count);
            $stmt->fetch();
            return ($count > 0);
        }
    }
?>