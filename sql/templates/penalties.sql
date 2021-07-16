CREATE TABLE IF NOT EXISTS penalties (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` enum('Ban','TempBan','Kick','Warning','Notice'),
    `client_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    `admin_id` INT(10) UNSIGNED NOT NULL DEFAULT '0',
    `duration` INT(10) UNSIGNED,
    `inactive` TINYINT(3) UNSIGNED,
    `keyword` VARCHAR(16) NOT NULL DEFAULT '',
    `reason` VARCHAR(255) NOT NULL DEFAULT '',
    `data` VARCHAR(255),
    `time_add` INT(10) UNSIGNED,
    `time_edit` INT(10) UNSIGNED,
    `time_expire` INT(11),
    PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;