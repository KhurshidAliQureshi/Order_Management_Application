DROP TABLE IF EXISTS `fis_assignment_5`.`warehousestock`;
DROP TABLE IF EXISTS `fis_assignment_5`.`purchaseorder`;
DROP TABLE IF EXISTS  `fis_assignment_5`.`productionorder`;
DROP TABLE IF EXISTS  `fis_assignment_5`.`customerorder`;
DROP TABLE IF EXISTS  `fis_assignment_5`.`accounts`;
DROP TABLE IF EXISTS  `fis_assignment_5`.`phones`;

CREATE TABLE IF NOT EXISTS accounts
(
	userName varChar(20),
	password varChar(20),
	telephone int(10),
	address text,
	primary key(userName)
);

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES ('Ali','asd',465853853,'8 C 50'),('Ateeb','fgh',465853859,'8 C 51'),('Umer','jkl',465853860,'8 C 52');
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;


CREATE TABLE IF NOT EXISTS phones (
	phoneName varChar(10),
	keyboard text,
	screen text,
	frame text,
    phoneCost double,
	primary key (phoneName)
);

SET FOREIGN_KEY_CHECKS=0;
LOCK TABLES `phones` WRITE;
/*!40000 ALTER TABLE `phones` DISABLE KEYS */;
INSERT INTO `phones` VALUES ('phoneA','kbd1','screen3','frame2',100),('phoneB','kbd1','screen3','frame1',200),('phoneC','kbd3','screen2','frame1',300);
/*!40000 ALTER TABLE `phones` ENABLE KEYS */;
UNLOCK TABLES;

	
CREATE TABLE IF NOT EXISTS customerorder (
	id varchar(36),
    userName varchar(20),
    phoneName varchar(10),
	foreign key (userName) references accounts(userName),
	foreign key (phoneName) references phones(phoneName),
	quantity int,
	expectedDeliveryDate date,
	totalCost double,
	orderStatus text,
    primary key(id)
);

LOCK TABLES `customerorder` WRITE;
/*!40000 ALTER TABLE `customerorder` DISABLE KEYS */;
INSERT INTO `customerorder` (id, userName, phoneName, quantity, totalCost, orderStatus) 
VALUES ('0325eea3-d965-4a99-8a53-ba5bbc3f9ba6','Ali','phoneB',10,2000,'pending'),('078f1fd0-cc70-4bad-88cf-218fa95c97ae','Umer','phoneB',10,2000,'pending'),('116a302b-1cf8-497b-9a6e-b0ca7b1a6fef','Ali','phoneB',17,3400,'pending'),('22b103a9-2756-46cb-addc-b0217939cbf4','Ali','phoneA',18,1800,'pending'),('3bb71c80-c8cd-41d0-849c-2585e73ac747','Ali','phoneA',18,1800,'pending'),('45b84395-db4e-46c9-b4a3-1311f20f5312','Ali','phoneA',18,1800,'pending'),('489cbb5c-9e02-4adb-b82e-dd71e86dde64','Ateeb','phoneA',19,1900,'sent to production'),('4aca718e-2f45-455f-aa37-1aa39e3cc1bc','Umer','phoneA',7,700,'pending'),('4c4e7d6d-fc23-4403-9e58-8c0c4b337c18','Ateeb','phoneA',7,700,'pending'),('544ef291-3e42-4beb-9754-306715dab5ba','Ali','phoneA',10,1000,'pending'),('57cd6f91-42e2-4027-b2e1-76822dbac4e8','Ali','phoneA',18,1800,'pending'),('5bd2f6c4-649b-4143-abe0-e6436907d95d','Umer','phoneC',5,1500,'pending'),('7ba4222b-3817-48cb-aecc-dc78202b2a7d','Ateeb','phoneB',8,1600,'pending'),('835a941f-3f57-47d5-8d3d-f4189dd6f477','Ali','phoneA',18,1800,'pending'),('a5f8fbef-8bac-412f-b719-a79d29b67faa','Ali','phoneA',18,1800,'pending'),('b06e7bd0-6c84-4d3c-9905-1a5b9ba5a30f','Ali','phoneA',19,1900,'sent to prodcution'),('b3e274e6-2e67-4a7b-a243-927ea20cbe17','Ali','phoneC',5,1500,'pending'),('b7760967-e54e-40ba-8c7a-e5f0a0786d1c','Umer','phoneC',19,5700,'sent to production'),('bbad9072-5f0e-44cc-872b-7d69e6da3e13','Ali','phoneA',18,1800,'pending'),('cf04db1f-381f-4210-aed1-4ba63d2459de','Ali','phoneA',19,1900,'pending'),('fbbae386-0882-464f-85cb-94496b20d737','Umer','phoneA',8,800,'pending');
/*!40000 ALTER TABLE `customerorder` ENABLE KEYS */;
UNLOCK TABLES;


CREATE TABLE IF NOT EXISTS productionorder (
	id varchar(36),
	customerOrder varchar(36),
    foreign key (customerOrder) references customerorder(id),
	productionStatus text,
    primary key(id)
);

LOCK TABLES `productionorder` WRITE;
/*!40000 ALTER TABLE `productionorder` DISABLE KEYS */;
INSERT INTO `productionorder` VALUES ('0325eea3-d965-4a99-8a53-ba5bbc3f9ba7','0325eea3-d965-4a99-8a53-ba5bbc3f9ba6','processing'),('0325eea3-d965-4a99-8a53-ba5bbc3f9ba9','0325eea3-d965-4a99-8a53-ba5bbc3f9ba6','processing'),('195da56e-034c-4cf9-92d7-6170818d10ad','b06e7bd0-6c84-4d3c-9905-1a5b9ba5a30f','processing'),('3ee05c0c-06ff-47eb-ab1f-2cb5151f1638','b7760967-e54e-40ba-8c7a-e5f0a0786d1c','processing'),('d371958d-0ffe-4644-b7df-1ac9335d0d7b','489cbb5c-9e02-4adb-b82e-dd71e86dde64','processing'),('db50e12d-ea0d-4d21-9b4e-3ede617a68e5','cf04db1f-381f-4210-aed1-4ba63d2459de','processing');
/*!40000 ALTER TABLE `productionorder` ENABLE KEYS */;
UNLOCK TABLES;


CREATE TABLE IF NOT EXISTS purchaseorder (
	id varchar(36),
	productionOrder varchar(36),
    foreign key (productionOrder) references productionorder(id),
	materialName text,
	quantity int,
	POStatus text,
	supplier text,
	primary key(id)
);

LOCK TABLES `purchaseorder` WRITE;
/*!40000 ALTER TABLE `purchaseorder` DISABLE KEYS */;
INSERT INTO `purchaseorder` VALUES ('b5e0f529-33ff-49c6-aa71-8ecf87e0deef','195da56e-034c-4cf9-92d7-6170818d10ad','kbd3',4,'completed','kbd3 supplier'),('fa8e22b9-c249-41c1-8502-9806aaef1ade','195da56e-034c-4cf9-92d7-6170818d10ad','kbd2',6,'completed','kbd2 supplier');
/*!40000 ALTER TABLE `purchaseorder` ENABLE KEYS */;
UNLOCK TABLES;


CREATE TABLE IF NOT EXISTS warehousestock (    
    materialName varchar(10),
	currentStock int,
    primary key(materialName)
);

LOCK TABLES `warehousestock` WRITE;
/*!40000 ALTER TABLE `warehousestock` DISABLE KEYS */;
INSERT INTO `warehousestock` VALUES ('frame1',10),('frame2',10),('frame3',10),('kbd1',10),('kbd2',16),('kbd3',26),('screen1',10),('screen2',10),('screen3',10);
/*!40000 ALTER TABLE `warehousestock` ENABLE KEYS */;
UNLOCK TABLES;


create table mastertable(
	id int not null auto_increment,
	masterId varChar(50),
    productId varChar(50),
    step text,
    primary key(id)
);
create table controltable(
	id int not null auto_increment,
	controlId varChar(50),
    masterId varChar(50),
    productId varChar(50),
    step text,    
    primary key(id)
)




