CREATE USER 'metamorphosis'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON * . * TO 'metamorphosis'@'%';
FLUSH PRIVILEGES;

use `metamorphosis_test`;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=949 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
