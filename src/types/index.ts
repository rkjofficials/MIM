export type VendorCategory = 
  | 'LSP' 
  | 'Cloud Provider' 
  | 'Hardware' 
  | 'SaaS & Licensing' 
  | 'ISP / Telecom' 
  | 'Maintenance' 
  | 'Security' 
  | 'Other';

export type SlaTier = 
  | '24/7 Priority 1' 
  | 'Business Hours (8x5)' 
  | 'Next Business Day' 
  | 'Mission Critical';

export interface ContactPhoneNumber {
  id: string;
  label: string;
  number: string;
}

export interface VendorContact {
  id: string;
  name: string;
  designation: string;
  emails: string[];
  phoneNumbers: ContactPhoneNumber[];
  avatarUrl?: string;
  isPrimary: boolean;
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  accountId: string;
  supportPortalUrl?: string;
  slaTier: SlaTier;
  notes?: string;
  contacts: VendorContact[];
  createdAt: string;
  updatedAt: string;
}

export type PropertyBrand = 
  | 'JW Marriott' 
  | 'The Ritz-Carlton' 
  | 'Marriott Marquis' 
  | 'Courtyard by Marriott' 
  | 'Sheraton' 
  | 'W Hotels' 
  | 'Other';

export interface Property {
  id: string;
  name: string; // e.g. "JW Marriott Hotel Downtown"
  code: string; // e.g. "JWM-01"
  brand: PropertyBrand;
  city: string;
  itContactName?: string;
  notes?: string;
}

export type ServerType = 'on-premises' | 'cloud' | 'hybrid';
export type ServerStatus = 'active' | 'maintenance' | 'offline' | 'decommissioned';
export type ServerRole = 
  | 'Gateway / LSP Router' 
  | 'Database' 
  | 'Application Server' 
  | 'DNS / Edge' 
  | 'Virtualization Host' 
  | 'Backup / Storage' 
  | 'Firewall';

export interface ServerSpecs {
  cpu: string;
  ram: string;
  storage: string;
}

export interface Server {
  id: string;
  propertyId: string; // Belongs strictly to this property
  propertyName?: string;
  name: string;
  type: ServerType;
  ipAddress: string;
  publicIp?: string;
  location: string; // e.g., 'Rack B-04 / Datacenter 1', 'MDF Server Room'
  role: ServerRole;
  os: string;
  specs: ServerSpecs;
  vendorId?: string;
  status: ServerStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

export type AssetCategory = 
  | 'Server Hardware' 
  | 'Network Router / Switch' 
  | 'LSP Circuit / Lease Line' 
  | 'Power / UPS' 
  | 'Storage / SAN' 
  | 'Peripheral';

export type AssetStatus = 'in-service' | 'in-repair' | 'spare' | 'retired';

export interface Asset {
  id: string;
  propertyId: string; // Strict property scope
  propertyName?: string;
  name: string;
  category: AssetCategory;
  assetTag: string;
  serialNumber: string;
  vendorId?: string;
  location: string;
  purchaseDate: string;
  warrantyExpiry: string;
  cost?: number;
  status: AssetStatus;
  notes?: string;
}

export type BillStatus = 'pending_approval' | 'approved' | 'paid' | 'overdue' | 'disputed';
export type BillCategory = 
  | 'LSP & Leased Line' 
  | 'Hardware Maintenance' 
  | 'Cloud Infrastructure' 
  | 'Software Licensing' 
  | 'Internet & Telecom' 
  | 'Security & Firewall' 
  | 'Other';

export interface Bill {
  id: string;
  billNumber: string; // e.g. "INV-RV-2026-881"
  vendorId: string;
  vendorName: string;
  propertyId: string; // The property this bill is charged to
  propertyName: string;
  amount: number;
  currency: string;
  billingCategory: BillCategory;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: BillStatus;
  poNumber?: string; // Purchase Order reference
  paymentReference?: string; // e.g. Wire Transfer ID
  paidDate?: string;
  notes?: string;
  submittedBy: string; // Name of submitting IT engineer
  submittedAt: string;
}

export type AlertType = 'license_renewal' | 'maintenance_due' | 'warranty_expiry' | 'contract_renewal';
export type AlertPriority = 'urgent' | 'warning' | 'normal';
export type AlertRecurrence = 'none' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
export type AlertStatus = 'active' | 'snoozed' | 'resolved';

export interface AlertItem {
  id: string;
  propertyId?: string; // Optional property link
  propertyName?: string;
  title: string;
  type: AlertType;
  relatedEntityId: string;
  relatedEntityType: 'vendor' | 'server' | 'asset' | 'bill';
  relatedEntityName: string;
  dueDate: string;
  recurrence: AlertRecurrence;
  status: AlertStatus;
  priority: AlertPriority;
  notes?: string;
  resolvedAt?: string;
  snoozedUntil?: string;
}

export interface AdminSettings {
  passwordHash: string; // SHA-256 hash or secure salt hash
  adminUsername: string;
  adminDisplayName: string;
  pinCode?: string; // Quick 4-digit PIN for Android convenience
  requireAuth: boolean;
  lastPasswordChangeDate?: string;
}

export interface AppDatabase {
  properties: Property[];
  vendors: Vendor[];
  servers: Server[];
  assets: Asset[];
  bills: Bill[];
  alerts: AlertItem[];
  adminSettings: AdminSettings;
  lastBackupDate?: string;
}
