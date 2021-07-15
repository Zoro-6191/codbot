CREATE TABLE IF NOT EXISTS `groups` (
  `id` INT(10) UNSIGNED NOT NULL,
  `name` VARCHAR(32) NOT NULL DEFAULT '',
  `keyword` VARCHAR(32) NOT NULL DEFAULT '',
  `level` INT(10) UNSIGNED NOT NULL DEFAULT '0',
  `time_edit` INT(10) UNSIGNED NOT NULL DEFAULT '0',
  `time_add` INT(10) UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyword` (`keyword`),
  KEY `level` (`level`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (128, 0, 'Super Admin', 'superadmin', UNIX_TIMESTAMP(), 100);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (64, 0, 'Senior Admin', 'senioradmin', UNIX_TIMESTAMP(), 80);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (32, 0, 'Full Admin', 'fulladmin', UNIX_TIMESTAMP(), 60);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (16, 0, 'Admin', 'admin', UNIX_TIMESTAMP(), 40);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (8, 0, 'Moderator', 'mod', UNIX_TIMESTAMP(), 20);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (2, 0, 'Regular', 'reg', UNIX_TIMESTAMP(), 2);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (1, 0, 'User', 'user', UNIX_TIMESTAMP(), 1);
INSERT INTO `groups` (`id`, `time_edit`, `name`, `keyword`, `time_add`, `level`) VALUES (0, 0, 'Guest', 'guest', UNIX_TIMESTAMP(), 0);