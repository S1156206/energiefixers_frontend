import type { EnergyLabel, EmailStatus, InvitationStatus, InvitationType, TenantStatus } from '@/types/enums'

export interface FixRound {
  id: number
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  current: boolean
  propertyCount: number
}

export interface InstalledMaterial {
  materialId: number
  materialName: string
  quantity: number
}

export interface EnergyReading {
  id: number
  propertyId: number
  periodStart: string
  periodEnd: string
  gasUsageM3: number | null
  electricityUsageKwh: number | null
  totalCostEuros: number | null
  sourceType: 'ANNUAL_BILL_MANUAL' | 'STAFF_ENTRY'
  submittedAt: string
}

export interface TenantSavingsResponse {
  firstVisitDate: string
  hasMeasuredData: boolean
  // Estimates — always present
  estimatedAnnualGasSavingsM3: number
  estimatedAnnualElectricitySavingsKwh: number
  estimatedTotalGasSavedToDateM3: number
  estimatedTotalElectricitySavedToDateKwh: number
  // Measured — null when hasMeasuredData is false
  annualGasSavingsM3: number | null
  annualElectricitySavingsKwh: number | null
  annualCostSavingsEuros: number | null
  totalGasSavedToDateM3: number | null
  totalElectricitySavedToDateKwh: number | null
  totalCostSavedToDateEuros: number | null
}

export interface EnergyReadingForm {
  periodStart: string
  periodEnd: string
  gasUsageM3: number | null
  electricityUsageKwh: number | null
  totalCostEuros: number | null
}

export interface FixVisit {
  id: number
  propertyId: number
  visitDate: string
  notes: string
  totalMaterialCost: number
  installedMaterials: InstalledMaterial[]
}

export interface MyFixVisit {
  id: number
  visitDate: string
  notes: string
  totalMaterialCost: number
  installedMaterials: InstalledMaterial[]
}

export interface FixVisitRequest {
  visitDate: string
  notes: string
  totalMaterialCost: number
  installedMaterials: InstalledMaterial[]
}

export interface Material {
  id: number
  name: string
  description: string | null
  priceEuros: number
  estimatedGasSavingM3: number | null
  estimatedElectricitySavingKwh: number | null
  category: string
}

export interface InvitationSummary {
  id: number
  type: InvitationType
  status: InvitationStatus
  recipientEmail: string
  sentAt: string
  expiresAt: string
  acceptedAt: string
  nextMailAvailableAt: string
}

export interface SubmissionRequestSummary {
  id: number
  recipientEmail: string
  createdAt: string
  expiresAt: string
  submittedAt: string
  nextMailAvailableAt: string
}

export interface MyProperty {
  id: number
  street: string
  houseNumber: string
  houseNumberSuffix: string | null
  postcode: string
  energyLabelBefore: string
  energyLabelAfter: string | null
  fixVisits: MyFixVisit[]
}

export interface Property {
  id: number
  street: string
  houseNumber: string
  houseNumberSuffix: string
  postcode: string
  energyLabelBefore: EnergyLabel
  energyLabelAfter: EnergyLabel | null
  regionId: number | null
  tenantEmail: string
  emailStatus: EmailStatus
  fixRoundId: number | null
  fixRoundName: string | null
  invitations: InvitationSummary[]
  submissionRequests: SubmissionRequestSummary[]
  fixVisits: FixVisit[]
}

export interface PropertySummary {
  id: number
  street: string
  houseNumber: string
  houseNumberSuffix: string | null
  postcode: string
  regionId: string | null
  tenantEmail: string
  emailStatus: EmailStatus
  tenantStatus: TenantStatus
  fixRoundId: number | null
  fixRoundName: string | null
}

export interface Region {
  id: number
  name: String
  postcodePrefixes: string[]
}

export interface PropertyRequest {
  street: string
  houseNumber: string
  houseNumberSuffix: string | null
  postcode: string
  tenantEmail: string | null
  fixRoundId?: number | null
}

export interface FixRoundRequest {
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
}

export interface MaterialRequest {
  name: string
  description: string | null
  priceEuros: number
  estimatedGasSavingM3: number | null
  estimatedElectricitySavingKwh: number | null
  category: string
}

export interface SubmissionMaterial {
  name: string
  category: string
  quantity: number
  totalEstimatedGasSavingM3: number
  totalEstimatedElectricitySavingKwh: number
}

export interface SubmissionInfo {
  address: string
  visitDate: string
  materials: SubmissionMaterial[]
}

export interface SubmissionFormData {
  gasUsageM3: number | null
  electricityUsageKwh: number | null
  totalCostEuros: number | null
  periodStart: string
  periodEnd: string
}

export interface SubmissionResult {
  invitationToken: string | null
}
