CREATE TABLE `service_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recordId` int NOT NULL,
	`partName` varchar(255) NOT NULL,
	`partDescription` text,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) DEFAULT '0',
	`totalCost` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `service_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`qrCode` varchar(255) NOT NULL,
	`brand` enum('DeLonghi','Kenwood','Braun','NutriBullet','Other') NOT NULL,
	`modelName` varchar(255) NOT NULL,
	`serialNo` varchar(255),
	`useInPlace` varchar(255),
	`purchasePlace` enum('Myanmar','Overseas') NOT NULL DEFAULT 'Myanmar',
	`serviceDate` timestamp NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(50),
	`customerAddress` text,
	`inDate` timestamp,
	`outDate` timestamp,
	`coffeeCleaning` boolean NOT NULL DEFAULT false,
	`waterCleaning` boolean NOT NULL DEFAULT false,
	`descaling` boolean NOT NULL DEFAULT false,
	`milkCleaning` boolean NOT NULL DEFAULT false,
	`technicalIssues` text,
	`repairedBy` varchar(255),
	`serviceCharges` decimal(10,2),
	`totalCost` decimal(10,2),
	`notes` text,
	`technicianName` varchar(255),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_records_qrCode_unique` UNIQUE(`qrCode`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','team_member') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
