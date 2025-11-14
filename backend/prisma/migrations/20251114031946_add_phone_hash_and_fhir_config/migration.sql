-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "phoneHash" TEXT;

-- CreateTable
CREATE TABLE "fhir_integration_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL,
    "authConfig" JSONB NOT NULL,
    "syncDirection" TEXT NOT NULL DEFAULT 'pull',
    "syncFrequency" TEXT NOT NULL DEFAULT 'daily',
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "initialDelay" INTEGER NOT NULL DEFAULT 1000,
    "maxDelay" INTEGER NOT NULL DEFAULT 30000,
    "backoffMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 2.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fhir_integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fhir_integration_configs_tenantId_key" ON "fhir_integration_configs"("tenantId");

-- CreateIndex
CREATE INDEX "patients_phoneHash_idx" ON "patients"("phoneHash");

-- AddForeignKey
ALTER TABLE "fhir_integration_configs" ADD CONSTRAINT "fhir_integration_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
