/*
  Warnings:

  - You are about to drop the column `phoneHash` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the `fhir_integration_configs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "PatientStatus" ADD VALUE 'PALLIATIVE_CARE';

-- DropForeignKey
ALTER TABLE "fhir_integration_configs" DROP CONSTRAINT "fhir_integration_configs_tenantId_fkey";

-- DropIndex
DROP INDEX "patients_tenantId_phoneHash_idx";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "phoneHash";

-- DropTable
DROP TABLE "fhir_integration_configs";
