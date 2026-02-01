/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '$2a$10$rZ8vHG.xqJOWQqJLT8KZ7OXvZ3fYNQKZ8ZZK8ZZK8ZZK8ZZK8ZZK8u';

-- Remove o default após adicionar a coluna
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
