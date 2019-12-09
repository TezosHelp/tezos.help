<?php
    // A template for constants.php
    define("MYSQL_HOST", "");
    define("MYSQL_DB", "");
    define("MYSQL_USER", "");
    define("MYSQL_PASSWORD", "");
    define("CAPTCHA_SECRET", "");
    define("UPDATE_BAKERS_TOKEN", "");
    define("CATEGORIES", array( // Category name, variable name, # of featured cards
        array('Organisations', 'organisations', 4),
        array('Community', 'community', 3),
        array('Block explorers', 'blockexplorers', 3),
        array('Wallets', 'wallets', 3),
        array('Projects', 'projects', 2),
        array('Delegation', 'delegation', 3),
        array('Learning', 'learning', 3),
        array('Libraries', 'libraries', 3),
        array('Dev tools', 'devtools', 3),
        array('Other', 'other', 1),
    ));
?>