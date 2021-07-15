CREATE TABLE IF NOT EXISTS `xlr_bodyparts` (
  `id` TINYINT(3) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(25) NOT NULL DEFAULT '',
  `kills` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT '0',
  `teamkills` SMALLINT(5) UNSIGNED NOT NULL DEFAULT '0',
  `suicides` SMALLINT(5) UNSIGNED NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;