import type { EnergyLabel, EmailStatus, InvitationStatus, InvitationType, Category, TenantStatus } from '@/types/enums'

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
  gasUsageM3: number
  electricityUsageKwh: number
  totalCostEuros: number
  sourceType: string
  submittedAt: string
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
  description: string
  priceEuros: number
  estimatedGasSavingM3: number
  estimatedElectricitySavingKwh: number
  category: Category
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
  regionId: number
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
  regionId: string
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
  street: String
  houseNumber: String
  houseNumberSuffix: String
  postcode: String
  // energyLabelBefore: EnergyLabel
  // energyLabelAfter: EnergyLabel
  tenantEmail: String
  fixRoundId?: number | null
}

export interface FixRoundRequest {
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
}
