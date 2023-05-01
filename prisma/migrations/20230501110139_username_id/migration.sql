/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "ip_address" TEXT NOT NULL,
    "username" TEXT NOT NULL PRIMARY KEY,
    "password" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "permissions" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jti" TEXT NOT NULL
);
INSERT INTO "new_User" ("created_at", "ip_address", "jti", "password", "permissions", "rank", "username") SELECT "created_at", "ip_address", "jti", "password", "permissions", "rank", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
