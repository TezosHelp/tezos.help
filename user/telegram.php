<?php
    define("TG_DEPTH", 3);
    define("UPDATE_FREQUENCY", 600);

    $tg = new Telegram();
    $tg->updateCounter();
    class Telegram {
        public function __construct() {
			require_once '../includes/db.php';
			$this->db = new DB();
		}
        public function getHead() {
            $sql = "SELECT counter,timestamp FROM telegram WHERE id=1";
            $result = $this->db->conn->query($sql);
            return $result->fetch_assoc();
        }
        private function setCounter($counter) {
            $sql = "UPDATE telegram SET counter=$counter, timestamp=NOW() WHERE id=1";
            $this->db->conn->query($sql);
        }
        public function updateCounter() {
            if ($this->isTimeToCheck()) {
                $counter = $this->getHead()["counter"];
                $highestId = 0;
                for ($m = 0; $m <= TG_DEPTH; $m++) {
                    if ($this->usedCounter($counter + $m)) {
                        $highestId = $counter + $m;
                    }
                }
                if ($highestId === 0) {
                    for ($m = 1; $m < TG_DEPTH * 2; $m++) {
                        if ($this->usedCounter($counter - $m)) {
                            $highestId = $counter - $m;
                            break;
                        }
                    }
                }
                $this->setCounter($highestId);
            }
        }
        public function isTimeToCheck() {
            $sql = "SELECT TIMESTAMPDIFF(SECOND, timestamp, NOW()) s FROM telegram WHERE id=1";
            $result = $this->db->conn->query($sql);
            $secondsPassed = $result->fetch_assoc()["s"];
            return ($secondsPassed > UPDATE_FREQUENCY);
        }
        private function usedCounter($id) {
            $tags = get_meta_tags("https://t.me/TezosAnnouncements/$id");
            if (strpos($tags["twitter:description"], "https://twitter.com/tezosbulletin") === false) {
                return true;
            }
            return false;
        }
    }
?>