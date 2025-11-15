# Esquema do Banco de Dados (schema.sql)

Copie e cole os comandos abaixo no seu console SQL (por exemplo, no phpMyAdmin) para criar todas as tabelas necessárias para a aplicação.

```sql
-- Tabela para armazenar as informações principais de cada rifa.
-- O `id` pode ser um UUID gerado pela sua aplicação de backend.
CREATE TABLE `raffles` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `ticketPrice` decimal(10,2) NOT NULL,
  `isFinalized` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela para armazenar os lançamentos de vendas associados a cada rifa.
CREATE TABLE `sales` (
  `id` varchar(36) NOT NULL,
  `raffleId` varchar(36) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_raffleId_fk` (`raffleId`),
  CONSTRAINT `sales_raffleId_fk` FOREIGN KEY (`raffleId`) REFERENCES `raffles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela para armazenar os lançamentos de custos associados a cada rifa.
CREATE TABLE `costs` (
  `id` varchar(36) NOT NULL,
  `raffleId` varchar(36) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `date` date DEFAULT NULL,
  `isDonation` tinyint(1) DEFAULT 0,
  `isReimbursement` tinyint(1) DEFAULT 0,
  `reimbursedDate` date DEFAULT NULL,
  `reimbursementNotes` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `costs_raffleId_fk` (`raffleId`),
  CONSTRAINT `costs_raffleId_fk` FOREIGN KEY (`raffleId`) REFERENCES `raffles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Tabela para registrar o histórico de todas as ações realizadas na aplicação.
-- A coluna `raffleId` aqui não é uma chave estrangeira para evitar problemas
-- caso uma rifa seja deletada. O log deve permanecer.
CREATE TABLE `history_logs` (
  `id` varchar(36) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `actionType` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `raffleId` varchar(36) NOT NULL,
  `raffleTitle` varchar(255) NOT NULL,
  `entityId` varchar(36) DEFAULT NULL,
  `beforeState` json DEFAULT NULL,
  `afterState` json DEFAULT NULL,
  `undone` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

```
