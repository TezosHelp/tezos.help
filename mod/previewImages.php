<html>
    <body>
        <?php
            $data = file_get_contents("entries.json");
            $entries = json_decode($data);
            foreach ($entries as $entry) {
                echo "<div style=\"border-style:solid;float:left;clear:none\">";
                echo $entry->category . " : " . $entry->id . "<BR>";
                echo $entry->title . "<BR>";
                echo "<img src=\"../images/" . $entry->id . ".png\">";
                echo "</div>";
            }
        ?>
    </body>
</html>