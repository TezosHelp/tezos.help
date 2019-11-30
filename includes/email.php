<?php
    class Email {
        private function notify(string $subject, string $message) {
            $to_email = 'info@tezos.help';
            $headers = 'From: user@tezos.help';
            @mail($to_email,$subject,$message,$headers);
        }
        public function addRequest(string $title) {
            $subject = $this->sanitize($title);
            $message = "A user have request to add $subject as a new entry on tezos.help\n" . 
                'https://tezos.help/mod';
            $this->notify($subject, $message);
        }
        public function editRequest(string $title) {
            $subject = $this->sanitize($title);
            $message = "A user have request to edit the entry $subject on tezos.help\n" . 
                    'https://tezos.help/mod';
            $this->notify($subject, $message);
        }
        private function sanitize(string $text) {
            return filter_var($text, FILTER_SANITIZE_STRING);
        }
    }
?>