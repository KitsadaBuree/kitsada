-- MySQL dump 10.13  Distrib 8.0.44, for Linux (aarch64)
--
-- Host: localhost    Database: restaurant_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `restaurant_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `restaurant_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `restaurant_db`;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `idx_categories_name` (`name`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_categories_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'อาหารจานเดียว',NULL,0,1,'2025-10-04 13:31:54','2025-10-04 13:31:54'),(2,'อาหารจานหลัก',NULL,0,1,'2025-10-04 13:31:54','2025-10-04 13:31:54'),(3,'ผัก',NULL,0,1,'2025-10-04 13:31:54','2025-10-04 13:31:54'),(4,'เครื่องดื่ม',NULL,0,1,'2025-10-04 13:31:54','2025-10-04 13:31:54'),(9,'เครื่องเคียง',NULL,0,1,'2025-10-13 20:27:12','2025-10-13 20:27:12');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_code` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','suspended','left') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `avatar_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `emergency_contact` varchar(120) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  CONSTRAINT `fk_emp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,1,'ST0001','2025-10-05','active',NULL,NULL,'ผู้จัดการร้าน','2025-10-06 02:34:04'),(2,2,'ST0002','2025-09-20','active',NULL,NULL,'เชฟครัวร้อน','2025-10-06 02:34:04');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `qty` int NOT NULL,
  `status` enum('queued','doing','done','ready','served','canceled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'queued',
  `line_total` decimal(10,2) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_general_ci DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (117,94,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'ขอไม้่เผ็ด','2025-10-12 04:52:48'),(118,94,27,'คะน้าผัดน้ำมันหอย',40.00,1,'done',40.00,'','2025-10-12 04:52:51'),(119,95,28,'เห็ดผัดรวมน้ำมันหอย',35.00,2,'done',70.00,'','2025-10-12 05:04:05'),(120,96,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'','2025-10-12 05:13:22'),(121,97,26,'ผัดผักบุ้งไฟแดง',45.00,1,'done',45.00,'','2025-10-12 05:07:23'),(122,98,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'ไม่เอาบล็อคโคลี่','2025-10-13 08:35:03'),(123,99,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'','2025-10-13 09:01:45'),(124,100,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'','2025-10-13 09:47:18'),(125,101,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'','2025-10-13 11:21:45'),(126,102,28,'เห็ดผัดรวมน้ำมันหอย',35.00,1,'done',35.00,'','2025-10-17 10:24:40'),(127,103,32,'กระเพราหมูกรอบ',50.00,1,'done',50.00,'ไม่ใส่ใบกระเพรา','2025-10-13 16:54:18'),(128,104,32,'กระเพราหมูกรอบ',50.00,1,'done',50.00,'','2025-10-13 18:08:47'),(129,105,36,'ข้าวผัด1',45.00,2,'done',90.00,'ไม่เอาผัก','2025-10-14 02:27:12'),(130,105,34,'ข้าวคลุกกระปิ',65.00,1,'done',65.00,'','2025-10-14 02:28:22'),(131,106,36,'ข้าวผัด1',45.00,1,'done',45.00,'','2025-10-17 10:24:36'),(132,107,34,'ข้าวคลุกกระปิ',65.00,2,'done',130.00,'','2025-10-17 10:24:47'),(133,108,36,'ข้าวผัด1',45.00,2,'done',90.00,'','2025-10-14 02:55:12'),(134,109,36,'ข้าวผัด1',45.00,1,'done',45.00,'','2025-10-17 10:24:33'),(135,109,34,'ข้าวคลุกกระปิ',65.00,3,'done',195.00,'','2025-10-17 10:24:33'),(136,110,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-18 15:09:36'),(137,111,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-19 15:43:21'),(138,112,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-20 08:17:24'),(139,113,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-20 08:23:45'),(140,114,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-20 08:38:59'),(141,114,34,'ข้าวคลุกกระปิ',65.00,1,'done',65.00,'','2025-10-20 08:38:59'),(142,114,32,'กระเพราหมูกรอบ',50.00,1,'done',50.00,'','2025-10-20 08:38:59'),(143,115,36,'ข้าวผัด',40.00,1,'done',40.00,'','2025-10-20 11:00:33'),(148,115,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-20 11:00:33'),(149,115,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,2,'done',90.00,'','2025-10-20 11:00:33'),(150,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 11:30:58'),(151,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:05:48'),(152,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:06:34'),(153,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:33:57'),(154,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:41:16'),(155,116,36,'ข้าวผัด',40.00,1,'queued',40.00,'','2025-10-20 16:43:57'),(156,116,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:47:54'),(157,117,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:48:40'),(158,118,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 16:50:38'),(159,118,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 17:19:14'),(160,119,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 17:20:05'),(161,119,36,'ข้าวผัด',40.00,1,'queued',40.00,'','2025-10-20 17:22:20'),(162,119,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-20 17:28:42'),(163,120,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-21 18:41:23'),(164,120,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-21 18:41:23'),(165,121,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-21 18:41:28'),(166,122,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-21 18:41:20'),(167,123,34,'ข้าวคลุกกระปิ',65.00,1,'done',65.00,'','2025-10-21 18:40:31'),(168,123,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-21 18:40:43'),(169,124,36,'ข้าวผัด',40.00,2,'done',80.00,'','2025-10-23 07:59:29'),(170,124,34,'ข้าวคลุกกระปิ',65.00,2,'done',130.00,'','2025-10-23 07:59:29'),(171,124,32,'กระเพราหมูกรอบ',50.00,2,'done',100.00,'','2025-10-23 07:59:30'),(172,125,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-23 08:13:19'),(173,126,34,'ข้าวคลุกกระปิ',65.00,3,'queued',195.00,'','2025-10-23 08:18:19'),(174,126,36,'ข้าวผัด',40.00,2,'queued',80.00,'','2025-10-23 08:18:19'),(175,126,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'queued',45.00,'','2025-10-23 08:18:19'),(176,126,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'queued',45.00,'','2025-10-23 08:18:19'),(177,126,32,'กระเพราหมูกรอบ',50.00,15,'queued',750.00,'','2025-10-23 08:18:53'),(178,126,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,2,'queued',90.00,'','2025-10-23 08:19:13'),(179,127,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-23 14:10:55'),(180,127,36,'ข้าวผัด',40.00,1,'done',40.00,'','2025-10-23 14:26:33'),(181,127,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-23 14:26:32'),(182,127,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-23 14:28:08'),(183,128,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-25 16:19:15'),(184,128,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-25 16:19:15'),(185,129,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-25 16:57:21'),(186,129,36,'ข้าวผัด',40.00,1,'done',40.00,'','2025-10-25 16:57:21'),(187,130,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-25 16:59:42'),(188,131,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-28 15:17:40'),(189,131,29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,1,'done',45.00,'','2025-10-28 15:17:41'),(190,132,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-28 15:20:46'),(191,133,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-10-28 15:21:40'),(192,134,37,'ก๋วยเตี๋ยวเรือ',45.00,2,'done',90.00,'','2025-10-29 06:12:25'),(193,134,34,'ข้าวคลุกกระปิ',65.00,1,'done',65.00,'','2025-10-29 06:12:28'),(194,134,40,'ข้าวผัดกุ้ง',45.00,2,'done',90.00,'','2025-10-29 06:14:11'),(195,135,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-11-01 11:19:50'),(196,135,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-01 11:19:50'),(197,136,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-01 11:34:57'),(198,136,36,'ข้าวผัดธรรมดา',40.00,1,'done',40.00,'','2025-11-01 11:34:58'),(199,137,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 10:56:03'),(200,138,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 11:23:57'),(201,138,37,'ก๋วยเตี๋ยวเรือ',45.00,1,'done',45.00,'','2025-11-03 11:24:03'),(202,139,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 11:29:22'),(203,140,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 11:34:35'),(204,141,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 11:59:07'),(205,142,40,'ข้าวผัดกุ้ง',45.00,1,'done',45.00,'','2025-11-03 11:59:04');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int DEFAULT NULL,
  `order_code` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `table_no` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `items_count` int NOT NULL DEFAULT '0',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `service_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `service_charge` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `points_awarded` tinyint(1) NOT NULL DEFAULT '0',
  `note` text COLLATE utf8mb4_general_ci,
  `status` enum('pending','cooking','ready','served','cancelled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `payment_status` enum('UNPAID','CHECKING','PAID') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'UNPAID',
  `payment_method` enum('QR','CASH') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `opened_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `idx_orders_table_id` (`table_id`),
  KEY `idx_orders_opened_at` (`opened_at`),
  KEY `idx_orders_closed_at` (`closed_at`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  KEY `idx_orders_paystatus` (`payment_status`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_table_paid_closed` (`table_no`,`payment_status`,`closed_at`,`id`),
  CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (94,NULL,'O20251012-8427','1',NULL,2,85.00,2.00,1.70,0.00,86.70,0,'','ready','PAID','QR',NULL,'2025-10-12 04:50:31','2025-10-12 04:50:31','2025-10-12 04:56:20'),(95,NULL,'O20251012-8239','1',NULL,1,70.00,2.00,1.40,0.00,71.40,1,'','ready','PAID','CASH',NULL,'2025-10-12 05:00:48','2025-10-12 05:00:48','2025-10-12 05:12:28'),(96,NULL,'O20251012-4642','1',NULL,1,45.00,2.00,0.90,0.00,45.90,0,'','ready','PAID','CASH',NULL,'2025-10-12 05:05:32','2025-10-12 05:05:32','2025-10-12 05:13:45'),(97,NULL,'O20251012-8107','1',NULL,1,45.00,2.00,0.90,7.00,38.90,1,' [P_USED_DONE]','ready','PAID','CASH',NULL,'2025-10-12 05:07:16','2025-10-12 05:07:16','2025-10-12 05:12:22'),(98,NULL,'O20251013-1391','1',NULL,1,45.00,2.00,0.90,0.00,45.90,0,'','ready','PAID','CASH',NULL,'2025-10-13 08:27:50','2025-10-13 08:27:50','2025-10-13 11:09:35'),(99,NULL,'O20251013-9641','1',14,1,45.00,2.00,0.90,0.00,45.90,1,'','ready','PAID','CASH',NULL,'2025-10-13 08:52:10','2025-10-13 08:52:10','2025-10-13 11:09:27'),(100,NULL,'O20251013-2159','1',14,1,45.00,2.00,0.90,0.00,45.90,1,'','ready','PAID','CASH',NULL,'2025-10-13 09:46:55','2025-10-13 09:46:55','2025-10-13 10:40:22'),(101,NULL,'O20251013-8390','1',14,1,45.00,2.00,0.90,0.00,45.90,1,'','ready','PAID','CASH',NULL,'2025-10-13 11:17:44','2025-10-13 11:17:44','2025-10-14 02:05:50'),(102,NULL,'O20251013-6624','1',NULL,1,35.00,2.00,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-13 14:00:16','2025-10-13 14:00:16','2025-10-20 11:28:49'),(103,NULL,'O20251013-1440','2',NULL,1,50.00,2.00,1.00,0.00,51.00,0,'','ready','PAID','CASH',NULL,'2025-10-13 16:50:21','2025-10-13 16:50:21','2025-10-14 02:05:36'),(104,NULL,'O20251013-8081','2',NULL,1,50.00,2.00,1.00,0.00,51.00,1,'','ready','PAID','CASH',NULL,'2025-10-13 18:07:01','2025-10-13 18:07:01','2025-10-14 02:05:26'),(105,NULL,'O20251014-3952','2',NULL,2,155.00,2.50,3.88,0.00,158.88,0,'','ready','PAID','QR',NULL,'2025-10-14 02:21:25','2025-10-14 02:21:25','2025-10-14 02:42:56'),(106,NULL,'O20251014-1858','2',NULL,1,45.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-14 02:50:55','2025-10-14 02:50:55','2025-10-20 11:25:23'),(107,NULL,'O20251014-4923','2',1,1,130.00,2.50,3.25,0.00,133.25,1,'','ready','PAID','CASH',NULL,'2025-10-14 02:51:07','2025-10-14 02:51:07','2025-10-18 17:36:39'),(108,NULL,'O20251014-7021','3',NULL,1,90.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-14 02:51:39','2025-10-14 02:51:39','2025-10-20 11:29:34'),(109,NULL,'O20251014-8855','3',NULL,2,240.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-14 02:52:32','2025-10-14 02:52:32','2025-10-20 11:28:56'),(110,NULL,'O20251018-9855','3',NULL,1,45.00,2.50,1.13,0.00,46.13,0,'','ready','PAID','CASH',NULL,'2025-10-18 15:08:51','2025-10-18 15:08:51','2025-10-18 15:10:59'),(111,NULL,'O20251019-4449','4',NULL,1,45.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-19 15:42:51','2025-10-19 15:42:51','2025-10-20 11:28:43'),(112,NULL,'O20251020-6980','2',NULL,1,45.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-20 07:35:13','2025-10-20 07:35:13','2025-10-20 11:25:17'),(113,NULL,'O20251020-3286','2',NULL,1,45.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-20 08:17:33','2025-10-20 08:17:33','2025-10-20 11:25:12'),(114,NULL,'O20251020-6696','2',NULL,3,160.00,2.50,0.00,0.00,0.00,0,'','ready','PAID','CASH',NULL,'2025-10-20 08:37:39','2025-10-20 08:37:39','2025-10-20 11:25:05'),(115,NULL,'O20251020-5602','2',NULL,3,175.00,2.50,4.38,0.00,179.38,0,'','ready','PAID','CASH',NULL,'2025-10-20 10:33:46','2025-10-20 10:33:46','2025-10-20 11:24:58'),(116,NULL,'O20251020-4633','2',NULL,7,310.00,2.50,7.75,0.00,317.75,0,'','pending','PAID','CASH',NULL,'2025-10-20 11:30:58','2025-10-20 11:30:58','2025-10-20 16:48:11'),(117,NULL,'O20251020-6570','2',NULL,1,45.00,2.50,1.13,0.00,46.13,0,'','pending','PAID','CASH',NULL,'2025-10-20 16:48:40','2025-10-20 16:48:40','2025-10-20 16:49:40'),(118,NULL,'O20251020-5726','2',NULL,2,90.00,2.50,2.25,0.00,46.13,0,'','pending','PAID','CASH',NULL,'2025-10-20 16:50:38','2025-10-20 16:50:38','2025-10-20 17:19:30'),(119,NULL,'O20251020-6914','2',NULL,3,130.00,2.50,3.25,0.00,133.25,0,'','pending','PAID','CASH',NULL,'2025-10-20 17:20:05','2025-10-20 17:20:05','2025-10-20 17:31:48'),(120,NULL,'O20251020-1897','2',NULL,2,90.00,2.50,2.25,0.00,92.25,0,'','ready','PAID','CASH',NULL,'2025-10-20 17:32:16','2025-10-20 17:32:16','2025-10-23 14:30:13'),(121,NULL,'O20251020-7468','2',NULL,1,45.00,2.50,1.13,0.00,46.13,0,'','ready','PAID','CASH',NULL,'2025-10-20 17:52:18','2025-10-20 17:52:18','2025-10-23 14:30:06'),(122,NULL,'O20251020-4839','2',5,1,45.00,2.50,1.13,1.00,45.13,1,' [P_USED_DONE]','ready','PAID','CASH',NULL,'2025-10-20 17:55:06','2025-10-20 17:55:06','2025-10-23 14:30:00'),(123,NULL,'O20251020-1142','2',5,2,110.00,2.50,2.75,0.00,112.75,1,'','ready','PAID','CASH',NULL,'2025-10-20 17:55:43','2025-10-20 17:55:43','2025-10-23 14:29:52'),(124,NULL,'O20251023-3619','1',NULL,3,310.00,2.50,7.75,0.00,317.75,0,'','ready','PAID','CASH',NULL,'2025-10-23 07:56:29','2025-10-23 07:56:29','2025-10-23 14:29:43'),(125,NULL,'O20251023-5947','6',21,1,45.00,100.00,45.00,10.00,80.00,1,' [P_USED_DONE]','ready','PAID','CASH',NULL,'2025-10-23 08:09:25','2025-10-23 08:09:25','2025-10-23 08:14:13'),(126,NULL,'O20251023-6963','6',21,6,1205.00,100.00,1205.00,0.08,2409.92,1,'','pending','PAID','QR',NULL,'2025-10-23 08:18:19','2025-10-23 08:18:19','2025-10-23 08:20:47'),(127,NULL,'O20251023-8139','1',NULL,4,175.00,100.00,175.00,0.00,350.00,0,'','ready','PAID','QR',NULL,'2025-10-23 14:09:04','2025-10-23 14:09:04','2025-10-23 14:29:22'),(128,NULL,'O20251023-1132','1',NULL,2,90.00,100.00,90.00,0.00,180.00,0,'','ready','PAID','CASH',NULL,'2025-10-23 14:28:23','2025-10-23 14:28:23','2025-10-25 16:33:54'),(129,NULL,'O20251025-3409','1',NULL,2,85.00,100.00,85.00,0.00,170.00,0,'','ready','PAID','CASH',NULL,'2025-10-25 16:37:06','2025-10-25 16:37:06','2025-10-28 15:13:41'),(130,NULL,'O20251025-4931','1',NULL,1,45.00,50.00,22.50,0.00,67.50,0,'','ready','PAID','QR',NULL,'2025-10-25 16:58:14','2025-10-25 16:58:14','2025-10-28 15:13:35'),(131,NULL,'O20251028-8424','2',5,2,90.00,50.00,45.00,0.00,135.00,1,'','ready','PAID','CASH',NULL,'2025-10-28 15:16:41','2025-10-28 15:16:41','2025-10-28 15:19:17'),(132,NULL,'O20251028-5520','2',5,1,45.00,7.50,3.38,0.00,48.38,1,'','ready','PAID','CASH',NULL,'2025-10-28 15:20:38','2025-10-28 15:20:38','2025-10-28 15:22:29'),(133,NULL,'O20251028-9380','2',5,1,45.00,7.50,3.38,0.00,48.38,1,'','ready','PAID','CASH',NULL,'2025-10-28 15:21:29','2025-10-28 15:21:29','2025-10-28 15:22:23'),(134,NULL,'O20251029-5746','1',NULL,3,245.00,3.50,8.58,0.00,253.58,0,'','ready','PAID','CASH',NULL,'2025-10-29 06:11:45','2025-10-29 06:11:45','2025-10-29 06:15:25'),(135,NULL,'O20251101-8725','1',NULL,2,90.00,3.50,3.15,0.00,93.15,0,'','ready','PAID','CASH',NULL,'2025-11-01 11:19:25','2025-11-01 11:19:25','2025-11-01 11:24:51'),(136,NULL,'O20251101-8342','1',NULL,2,85.00,3.50,2.98,0.00,87.98,0,'','ready','CHECKING',NULL,NULL,'2025-11-01 11:34:01','2025-11-01 11:34:01',NULL),(137,NULL,'O20251101-5805','1',NULL,1,45.00,3.50,1.58,0.00,46.58,0,'','ready','CHECKING',NULL,NULL,'2025-11-01 11:35:50','2025-11-01 11:35:50',NULL),(138,NULL,'O20251103-9995','1',NULL,2,90.00,3.50,3.15,0.00,93.15,0,'','ready','CHECKING',NULL,NULL,'2025-11-03 11:14:59','2025-11-03 11:14:59',NULL),(139,NULL,'O20251103-6379','1',NULL,1,45.00,3.50,1.58,0.00,46.58,0,'','ready','CHECKING',NULL,NULL,'2025-11-03 11:28:54','2025-11-03 11:28:54',NULL),(140,NULL,'O20251103-4096','1',NULL,1,45.00,3.50,1.58,0.00,46.58,0,'','ready','CHECKING',NULL,NULL,'2025-11-03 11:33:32','2025-11-03 11:33:32',NULL),(141,NULL,'O20251103-3121','1',NULL,1,45.00,3.50,1.58,0.00,46.58,0,'','ready','UNPAID',NULL,NULL,'2025-11-03 11:45:12','2025-11-03 11:45:12',NULL),(142,NULL,'O20251103-1352','2',NULL,1,45.00,3.50,1.58,0.00,46.58,0,'','ready','CHECKING',NULL,NULL,'2025-11-03 11:53:07','2025-11-03 11:53:07',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_codes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `uid` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `code` varchar(12) COLLATE utf8mb4_general_ci NOT NULL,
  `channel` enum('email','phone') COLLATE utf8mb4_general_ci NOT NULL,
  `dest` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `reset_token` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`),
  KEY `idx_token` (`reset_token`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
INSERT INTO `otp_codes` VALUES (1,'923a619bf0d7316997eceb0a62113bfd',14,'903475','email','kitsada.buree@gmail.com',0,1,'2025-10-11 13:18:16',NULL,'2025-10-11 21:57:55','2025-10-11 20:13:16'),(2,'5ab08ff2fb25f277c2de5e26d5299c96',14,'587639','email','kitsada.buree@gmail.com',0,1,'2025-10-11 13:34:57',NULL,'2025-10-11 21:57:55','2025-10-11 20:29:57'),(3,'7221e00badc27833bf3c2c908824828e',14,'170532','email','kitsada.buree@gmail.com',0,1,'2025-10-11 13:36:24',NULL,'2025-10-11 21:57:55','2025-10-11 20:31:24'),(4,'aa35a23d3cc4cc8a40be3c8d7105f79c',14,'603133','email','kitsada.buree@gmail.com',0,1,'2025-10-11 13:46:14',NULL,'2025-10-11 21:57:55','2025-10-11 20:41:14'),(5,'f5eb2ba7967328b63f16b84e1774688d',14,'828499','email','kitsada.buree@gmail.com',0,1,'2025-10-11 14:04:51',NULL,'2025-10-11 21:57:55','2025-10-11 20:59:51'),(6,'80df64a9913ff48d2d1021ba05ef3a9e',14,'987056','email','kitsada.buree@gmail.com',0,1,'2025-10-11 14:10:04',NULL,'2025-10-11 21:57:55','2025-10-11 21:05:04'),(7,'16312c671b075eecdf262bbb6ed6e38a',10,'568890','email','test@gmail.com',0,0,'2025-10-11 14:11:15',NULL,NULL,'2025-10-11 21:06:15'),(8,'29d61dba57fb303261c1a898c103af81',14,'611578','email','kitsada.buree@gmail.com',0,1,'2025-10-11 14:11:45',NULL,'2025-10-11 21:57:55','2025-10-11 21:06:45'),(9,'b5b43bba408b95780172d52f262f6a9f',14,'562907','email','kitsada.buree@gmail.com',0,1,'2025-10-11 14:17:31',NULL,'2025-10-11 21:57:55','2025-10-11 21:12:31'),(10,'2e97a1c3dc8e2f358d5ffe598fd6de59',14,'131401','email','kitsada.buree@gmail.com',0,1,'2025-10-11 14:25:15',NULL,'2025-10-11 21:57:55','2025-10-11 21:20:15'),(11,'cdf25bc3aa75a8dde7aa9959a8d56fc2',10,'133527','email','test@gmail.com',0,0,'2025-10-11 14:29:13',NULL,NULL,'2025-10-11 21:24:13'),(12,'49093672fb000d6dbd175527ed2ab34f',14,'470753','email','kitsada.buree@gmail.com',0,1,'2025-10-11 21:35:07',NULL,'2025-10-10 21:42:13','2025-10-11 21:30:07'),(13,'ee26a61a5bc35d4d3a5b7e9d0aad258c',14,'862157','email','kitsada.buree@gmail.com',0,1,'2025-10-11 22:02:55',NULL,'2025-10-11 22:04:03','2025-10-11 21:57:55'),(14,'b0770d88c95245d5f446b24d0939df63',14,'339322','email','kitsada.buree@gmail.com',0,1,'2025-10-11 22:09:03',NULL,'2025-10-11 22:11:43','2025-10-11 22:04:03'),(15,'69c958ea3b03c87195765e96c24dd469',14,'195141','email','kitsada.buree@gmail.com',0,1,'2025-10-11 22:16:43',NULL,'2025-10-10 22:12:36','2025-10-11 22:11:43'),(16,'adb870bb5040141bddb271bd7d7b4083',15,'417271','email','summer.buree@gmail.com',0,1,'2025-10-11 22:48:12','005b7b8fbc1d78294066cf2daf15ffafbea5e46d39c8d128','2025-10-11 22:58:58','2025-10-11 22:43:12'),(17,'7ee21f2a94c81d20096bb2085a56d7af',14,'156584','email','kitsada.buree@gmail.com',0,1,'2025-10-12 12:14:00',NULL,'2025-10-11 12:09:55','2025-10-12 12:09:00'),(18,'254c4e271a672c4bc2b2143029e8b89d',14,'778780','email','kitsada.buree@gmail.com',0,1,'2025-10-13 16:27:15',NULL,'2025-10-13 16:25:10','2025-10-13 16:22:15'),(19,'d0615e1fd2ddac4cd93578543c178307',14,'671044','email','kitsada.buree@gmail.com',0,1,'2025-10-13 16:30:10','b01771dacab52213a38ec9eb30b8ae1c57b603e4ad8bf3eb','2025-10-13 16:40:29','2025-10-13 16:25:10'),(20,'66a6ebaf504a8f8ce9d5b7ccc2247beb',14,'627158','email','kitsada.buree@gmail.com',0,1,'2025-10-14 00:49:06',NULL,'2025-10-14 00:45:22','2025-10-14 00:44:06'),(21,'bfc87abadcc8110aa67198564ab5c041',14,'549862','email','kitsada.buree@gmail.com',0,1,'2025-10-14 00:50:22','35b78782b609dd98c10699db7dec2bfedb699cc9efcf91fd','2025-10-14 01:00:47','2025-10-14 00:45:22'),(22,'f920e9597e047eb9d991450da0da51ac',14,'608470','email','kitsada.buree@gmail.com',0,1,'2025-10-14 00:52:26','c252984602c4d82491e2150ae95d990152a69514ed81ab06','2025-10-14 01:02:51','2025-10-14 00:47:26'),(23,'0e50e8f5faf1565802b46a4312a7c56d',22,'355247','email','summer.buree@gmail.com',1,1,'2025-11-03 14:08:12',NULL,'2025-11-02 14:04:02','2025-11-03 14:03:12');
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!50001 DROP VIEW IF EXISTS `product_categories`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `product_categories` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `slug`,
 1 AS `sort_order`,
 1 AS `is_active`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `imageUrl` varchar(255) COLLATE utf8mb4_general_ci DEFAULT '',
  `category_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `name_norm` varchar(255) COLLATE utf8mb4_general_ci GENERATED ALWAYS AS (lower(trim(`name`))) STORED,
  `category_norm` int GENERATED ALWAYS AS (ifnull(`category_id`,-(1))) STORED,
  `image_url` varchar(255) COLLATE utf8mb4_general_ci GENERATED ALWAYS AS (`imageUrl`) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_name_cat` (`name_norm`,`category_norm`),
  KEY `idx_products_category_id` (`category_id`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_name_norm` (`name_norm`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `name`, `price`, `imageUrl`, `category_id`, `created_at`, `cost`) VALUES (26,'ผัดผักบุ้งไฟแดง',45.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760244031/xfctrvplsmurof7vphg4.jpg',3,'2025-10-12 04:40:34',0.00),(27,'คะน้าผัดน้ำมันหอย',40.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760244065/dmxaw1jnhdz34rggrg6u.jpg',3,'2025-10-12 04:41:07',0.00),(28,'เห็ดผัดรวมน้ำมันหอย',35.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760244098/ueeuvyqg2a9nlmxnpv6v.webp',3,'2025-10-12 04:41:56',0.00),(29,'บร็อคโคลี่ผัดกระเทียมใส่หมู',45.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760244138/qasc4u4vqoobsayshwr9.webp',3,'2025-10-12 04:43:21',0.00),(32,'กระเพราหมูกรอบ',50.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760351400/mkz69bqybubs0fdqtclj.webp',1,'2025-10-13 10:30:02',0.00),(34,'ข้าวคลุกกระปิ',65.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760387338/sp6qlxss7tzeruppuxq0.webp',9,'2025-10-13 20:30:32',0.00),(36,'ข้าวผัดธรรมดา',40.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760408283/njbvxi1tag6gpmeedxia.webp',1,'2025-10-14 02:18:05',0.00),(37,'ก๋วยเตี๋ยวเรือ',45.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1760800033/gghoobuuwduurixuu9l4.webp',1,'2025-10-18 15:07:16',0.00),(40,'ข้าวผัดกุ้ง',45.00,'https://res.cloudinary.com/dqunjp3dj/image/upload/v1761715487/qnao9iwdflmsodkdchnp.jpg',1,'2025-10-29 05:25:20',0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `products_compat`
--

DROP TABLE IF EXISTS `products_compat`;
/*!50001 DROP VIEW IF EXISTS `products_compat`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `products_compat` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `price`,
 1 AS `image_url`,
 1 AS `category_id`,
 1 AS `created_at`,
 1 AS `cost`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL DEFAULT '1',
  `service_rate` decimal(5,2) NOT NULL DEFAULT '10.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,3.50);
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` char(8) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uniq_tables_name` (`name`),
  UNIQUE KEY `uniq_tables_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (9,'T000001','1',1,'2025-10-13 11:10:07'),(10,'T000002','2',1,'2025-10-13 11:10:07'),(11,'T000003','3',1,'2025-10-13 11:10:07'),(12,'T000004','4',1,'2025-10-13 11:10:07'),(13,'T000005','5',1,'2025-10-13 11:10:07'),(14,'T000006','6',1,'2025-10-13 11:10:07');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `role` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'member',
  `points` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'กฤษฎา บุรีขันธ์','admin@gmail.com','0000000000','$2b$10$kAKrTnoxFyNptpUSFki9Pe/z8ePYs1AlCBIRf7/VpyqgtpZ.9lXZi','manager',13,'2025-10-06 02:34:04'),(2,'สมชาย ครัวร้อน','kitchen@gmail.com','0891112222','$2b$10$McZoAz0gua9EPs8jAkxdKegPAKbkeWm8raBxbIpDr.GbqMcdU.Idq','kitchen',0,'2025-10-06 02:34:04'),(5,'มณี ลูกค้าใจY2k','member@gmail.com','0212224236','$2b$10$HFeMpxvmWfpLZlyL51ZWmez2KzpfHveyT9VnP4AYwDPZV0/GC55ta','member',45,'2025-10-06 02:34:04'),(14,'kitsada bureekhan','kitsada.buree@gmail.com','0998970078','$2b$10$vHdppPD1GIAtjqF1DyfYfes.CMy6YPubwO.eigILxfluoBIa99mpq','member',836,'2025-10-11 13:08:23'),(20,'kitchen2','kitchen2@gmail.com','0923453232','$2b$10$ttwHyqzQOzafe8nDPT6C/On3e2lUMp3e3yhwmgSbPQp4gP6JTG3te','kitchen',0,'2025-10-14 02:24:29'),(21,'อนุชา ศรีคมรา','test1234@ku.th','0987651234','$2b$10$2394Hs/sDxmV8mMyEzfPz.n9ru6XYAi2Fy9b6KLeGoGth6iyFhWUK','member',248,'2025-10-23 08:09:06'),(22,'testtest testtest','summer.buree@gmail.com','0002002020','$2b$10$DpnG344TOYdNjJuuuL05IOJmWjTuKcpaKgIe3npgGlG08/wYB8o.W','member',0,'2025-11-03 14:02:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'restaurant_db'
--

--
-- Dumping routines for database 'restaurant_db'
--

--
-- Current Database: `restaurant_db`
--

USE `restaurant_db`;

--
-- Final view structure for view `product_categories`
--

/*!50001 DROP VIEW IF EXISTS `product_categories`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `product_categories` AS select `categories`.`id` AS `id`,`categories`.`name` AS `name`,`categories`.`slug` AS `slug`,`categories`.`sort_order` AS `sort_order`,`categories`.`is_active` AS `is_active`,`categories`.`created_at` AS `created_at`,`categories`.`updated_at` AS `updated_at` from `categories` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `products_compat`
--

/*!50001 DROP VIEW IF EXISTS `products_compat`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `products_compat` AS select `products`.`id` AS `id`,`products`.`name` AS `name`,`products`.`price` AS `price`,`products`.`imageUrl` AS `image_url`,`products`.`category_id` AS `category_id`,`products`.`created_at` AS `created_at`,`products`.`cost` AS `cost` from `products` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-03 14:58:51
