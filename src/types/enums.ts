export enum EmailStatus {
  NO_EMAIL = 'NO_EMAIL',
  OPT_OUT = 'OPT_OUT',
  DELIVERABLE = 'DELIVERABLE',
}

export enum EnergyLabel {
  A_PLUS_PLUS_PLUS,
  A_PLUS_PLUS,
  A_PLUS,
  A,
  B,
  C,
  D,
  E,
  F,
  G,
}

export enum InvitationType {
  REGISTRATION = 'REGISTRATION',
  ANNUAL_REMINDER = 'ANNUAL_REMINDER',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum Category {
  INSULATION,
  LIGHTING,
  WATER,
  VENTILATION,
  OTHER,
}

export enum TenantStatus {
  NOT_INVITED = 'NOT_INVITED',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  INVITED = 'INVITED',
  REGISTERED = 'REGISTERED',
  LINK_SENT = 'LINK_SENT',
  DATA_PRESENT = 'DATA_PRESENT',
}
