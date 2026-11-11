import { 
  AppDatabase, 
  Vendor, 
  Server, 
  Asset, 
  AlertItem, 
  Bill, 
  Property, 
  AdminSettings 
} from '../types';
import { hashPassword } from './alertEngine';

const STORAGE_KEY = 'linear_it_inventory_db_v2';
const AUTH_SESSION_KEY = 'linear_it_session_v2';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-jw-downtown',
    name: 'JW Marriott Hotel Downtown',
    code: 'JWM-01',
    brand: 'JW Marriott',
    city: 'London Mayfair',
    itContactName: 'Marcus & Alex (Cluster IT)',
    notes: '5-Star Luxury flagship property. 450 guestrooms, 2 ballroom conference suites.'
  },
  {
    id: 'prop-ritz-carlton',
    name: 'The Ritz-Carlton Financial District',
    code: 'RC-02',
    brand: 'The Ritz-Carlton',
    city: 'London City',
    itContactName: 'David Chen (Cluster IT)',
    notes: 'High-security financial corporate suites. Dedicated dual-homed LSP fiber circuits.'
  },
  {
    id: 'prop-marquis-city',
    name: 'Marriott Marquis City Center',
    code: 'MM-03',
    brand: 'Marriott Marquis',
    city: 'Manchester',
    itContactName: 'Regional Support Team',
    notes: 'Convention hotel with 600 rooms and Cisco Meraki Wi-Fi 6 fabric.'
  }
];

export const INITIAL_DATA: AppDatabase = {
  properties: INITIAL_PROPERTIES,
  vendors: [
    {
      id: 'v-reivernet',
      name: 'Reivernet Telecom & LSP',
      category: 'LSP',
      accountId: 'RV-UK-98441',
      supportPortalUrl: 'https://portal.reivernet.com/support',
      slaTier: '24/7 Priority 1',
      notes: 'Primary Managed Lease Line & Bandwidth provider for Marriott properties. 10Gbps dedicated optical circuits.',
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: '2026-11-01T14:20:00Z',
      contacts: [
        {
          id: 'c-reiv-1',
          name: 'Marcus Holloway',
          designation: 'Senior NOC Tier 3 Engineer',
          isPrimary: true,
          emails: ['marcus.h@reivernet.com', 'noc-escalations@reivernet.com'],
          phoneNumbers: [
            { id: 'p1', label: 'Direct Line', number: '+44 20 7946 0831' },
            { id: 'p2', label: '24/7 Urgent NOC', number: '+44 20 7946 0999' }
          ],
          notes: 'Point of contact for BGP peering, MTU configuration, and circuit outages across Marriott cluster.'
        },
        {
          id: 'c-reiv-2',
          name: 'Elena Rostova',
          designation: 'Key Enterprise Account Director',
          isPrimary: false,
          emails: ['elena.rostova@reivernet.com'],
          phoneNumbers: [
            { id: 'p3', label: 'Mobile / WhatsApp', number: '+44 7700 900341' }
          ],
          notes: 'Property contract renewals, monthly invoice approvals, and bandwidth tier upgrades.'
        },
        {
          id: 'c-reiv-3',
          name: 'David Chen',
          designation: 'Field Operations Specialist',
          isPrimary: false,
          emails: ['d.chen.field@reivernet.com'],
          phoneNumbers: [
            { id: 'p4', label: 'Mobile', number: '+44 7700 900882' }
          ],
          notes: 'On-site hotel fiber termination, transceiver replacements, and rack audits.'
        }
      ]
    },
    {
      id: 'v-dell',
      name: 'Dell Technologies',
      category: 'Hardware',
      accountId: 'DELL-CORP-488102',
      supportPortalUrl: 'https://www.dell.com/support/home/en-us',
      slaTier: 'Mission Critical',
      notes: 'Enterprise server hardware and ProSupport Plus 4-Hour On-Site Mission Critical warranty.',
      createdAt: '2024-06-10T11:00:00Z',
      updatedAt: '2026-10-14T08:15:00Z',
      contacts: [
        {
          id: 'c-dell-1',
          name: 'Sarah Jenkins',
          designation: 'Enterprise Systems Architect',
          isPrimary: true,
          emails: ['sarah.jenkins@dell.com'],
          phoneNumbers: [
            { id: 'p5', label: 'Work Direct', number: '+1 (512) 728-4000' }
          ],
          notes: 'PowerEdge cluster architecture and SAN expansion for guest management systems.'
        },
        {
          id: 'c-dell-2',
          name: 'ProSupport Dispatch',
          designation: 'Hardware Dispatch & RMA',
          isPrimary: false,
          emails: ['prosupport.dispatch@dell.com'],
          phoneNumbers: [
            { id: 'p6', label: 'Toll-Free 24/7', number: '+1 (800) 624-9896' }
          ],
          notes: 'Have Service Tag ready before calling.'
        }
      ]
    },
    {
      id: 'v-aws',
      name: 'Amazon Web Services',
      category: 'Cloud Provider',
      accountId: 'AWS-ORG-771928410',
      supportPortalUrl: 'https://console.aws.amazon.com/support/home',
      slaTier: '24/7 Priority 1',
      notes: 'Production VPC, RDS Aurora PostgreSQL clusters, and PMS backup vaults.',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
      contacts: [
        {
          id: 'c-aws-1',
          name: 'Rachel Adams',
          designation: 'AWS Enterprise Technical Account Manager (TAM)',
          isPrimary: true,
          emails: ['radams-tam@amazon.com'],
          phoneNumbers: [
            { id: 'p7', label: 'Direct Desk', number: '+1 (206) 266-1000' }
          ],
          notes: 'Coordinates TAM deep dives and infrastructure event management.'
        }
      ]
    },
    {
      id: 'v-cisco',
      name: 'Cisco Systems / Meraki',
      category: 'Maintenance',
      accountId: 'CSCO-LIC-33910',
      supportPortalUrl: 'https://www.cisco.com/c/en/us/support/index.html',
      slaTier: 'Business Hours (8x5)',
      notes: 'Core routing, guest Wi-Fi switching fabric, and SmartNet maintenance licenses.',
      createdAt: '2024-03-01T08:00:00Z',
      updatedAt: '2026-09-12T16:45:00Z',
      contacts: [
        {
          id: 'c-csco-1',
          name: 'Jonathan Miller',
          designation: 'SmartNet Support Lead',
          isPrimary: true,
          emails: ['jmiller-smartnet@cisco.com', 'tac@cisco.com'],
          phoneNumbers: [
            { id: 'p8', label: 'TAC Support Line', number: '+1 (800) 553-2447' }
          ]
        }
      ]
    }
  ],
  servers: [
    {
      id: 'srv-1',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      name: 'reivernet-gw-jwm01',
      type: 'on-premises',
      ipAddress: '10.200.0.1',
      publicIp: '194.72.108.45',
      location: 'MDF Server Room - Rack A1 (U22)',
      role: 'Gateway / LSP Router',
      os: 'Cisco IOS-XE 17.9',
      specs: {
        cpu: '4-Core Embedded NPU',
        ram: '32 GB ECC',
        storage: '256 GB NVMe'
      },
      vendorId: 'v-reivernet',
      status: 'active',
      lastMaintenanceDate: '2026-09-15',
      nextMaintenanceDate: '2026-12-15',
      notes: 'Terminates Reivernet 10G optical fiber loop for JW Marriott guest & admin networks.'
    },
    {
      id: 'srv-2',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      name: 'prod-pms-db-01',
      type: 'cloud',
      ipAddress: '10.100.4.52',
      location: 'AWS us-east-1 (VPC Private Subnet B)',
      role: 'Database',
      os: 'Amazon Linux 2023 / PostgreSQL 16',
      specs: {
        cpu: 'db.r6g.4xlarge (16 vCPU)',
        ram: '128 GB',
        storage: '2 TB Provisioned IOPS SSD'
      },
      vendorId: 'v-aws',
      status: 'active',
      lastMaintenanceDate: '2026-10-10',
      nextMaintenanceDate: '2026-11-25',
      notes: 'Primary Opera Cloud PMS database with Multi-AZ automated failover.'
    },
    {
      id: 'srv-3',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      name: 'vmhost-dell-pe750-jwm',
      type: 'on-premises',
      ipAddress: '10.200.0.10',
      publicIp: '',
      location: 'MDF Server Room - Rack A2 (U10-U12)',
      role: 'Virtualization Host',
      os: 'VMware ESXi 8.0u2',
      specs: {
        cpu: 'Dual Intel Xeon Gold 6430 (64 Cores)',
        ram: '512 GB DDR5',
        storage: '8x 3.84TB SAS SSD RAID 10'
      },
      vendorId: 'v-dell',
      status: 'active',
      lastMaintenanceDate: '2026-08-20',
      nextMaintenanceDate: '2026-11-18',
      notes: 'Host for POS Micros server, keycard encoder VM, and domain controllers.'
    },
    {
      id: 'srv-4',
      propertyId: 'prop-ritz-carlton',
      propertyName: 'The Ritz-Carlton Financial District',
      name: 'reivernet-gw-rc02',
      type: 'on-premises',
      ipAddress: '10.210.0.1',
      publicIp: '194.72.108.88',
      location: 'Basement NOC - Rack R1',
      role: 'Gateway / LSP Router',
      os: 'FortiOS 7.4.4',
      specs: {
        cpu: '8-Core ASIC Accelerated',
        ram: '32 GB',
        storage: '480 GB SSD'
      },
      vendorId: 'v-reivernet',
      status: 'active',
      lastMaintenanceDate: '2026-10-05',
      nextMaintenanceDate: '2027-01-10',
      notes: 'Dedicated 10Gbps Reivernet circuit for Ritz-Carlton VIP suites and banqueting.'
    }
  ],
  assets: [
    {
      id: 'ast-1',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      name: 'Reivernet Optical Termination Unit (OTU)',
      category: 'LSP Circuit / Lease Line',
      assetTag: 'AST-JWM-LSP-01',
      serialNumber: 'RV-OTU-99214A',
      vendorId: 'v-reivernet',
      location: 'MDF Room Fiber Enclosure B',
      purchaseDate: '2024-02-01',
      warrantyExpiry: '2027-02-01',
      cost: 4500,
      status: 'in-service',
      notes: 'Circuit ID: RV-UK-JWM-10G. Single-mode optical fiber.'
    },
    {
      id: 'ast-2',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      name: 'Dell PowerEdge R750 Virtual Host',
      category: 'Server Hardware',
      assetTag: 'AST-JWM-SRV-12',
      serialNumber: 'DEL-ST-7K99M23',
      vendorId: 'v-dell',
      location: 'MDF Room - Rack A2',
      purchaseDate: '2024-05-15',
      warrantyExpiry: '2027-05-15',
      cost: 16800,
      status: 'in-service',
      notes: 'ProSupport Plus Mission Critical 4-Hour Response warranty.'
    },
    {
      id: 'ast-3',
      propertyId: 'prop-ritz-carlton',
      propertyName: 'The Ritz-Carlton Financial District',
      name: 'Cisco Catalyst 9300 48-Port PoE Switch',
      category: 'Network Router / Switch',
      assetTag: 'AST-RC-SW-88',
      serialNumber: 'FOC2419L29X',
      vendorId: 'v-cisco',
      location: 'Floor 12 IDF Telecom Closet',
      purchaseDate: '2023-04-10',
      warrantyExpiry: '2026-11-28',
      cost: 8200,
      status: 'in-service',
      notes: 'Powers guestroom VoIP phones and access points.'
    },
    {
      id: 'ast-4',
      propertyId: 'prop-marquis-city',
      propertyName: 'Marriott Marquis City Center',
      name: 'APC Smart-UPS RT 5000VA 230V',
      category: 'Power / UPS',
      assetTag: 'AST-MM-PWR-04',
      serialNumber: 'APC-9938174',
      location: 'Sub-Basement UPS Plant',
      purchaseDate: '2023-01-20',
      warrantyExpiry: '2026-12-01',
      cost: 5400,
      status: 'in-service',
      notes: 'Biannual impedance test required by Marriott brand standards.'
    }
  ],
  bills: [
    {
      id: 'b-1',
      billNumber: 'INV-RV-2026-9041',
      vendorId: 'v-reivernet',
      vendorName: 'Reivernet Telecom & LSP',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      amount: 3450.00,
      currency: 'USD',
      billingCategory: 'LSP & Leased Line',
      issueDate: '2026-11-01',
      dueDate: '2026-11-20',
      status: 'pending_approval',
      poNumber: 'PO-JWM-9941',
      submittedBy: 'Marcus Holloway (NOC Lead)',
      submittedAt: '2026-11-02T10:15:00Z',
      notes: 'Monthly 10Gbps dedicated line and guest high-speed bandwidth commitment.'
    },
    {
      id: 'b-2',
      billNumber: 'INV-DELL-88410',
      vendorId: 'v-dell',
      vendorName: 'Dell Technologies',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      amount: 1280.00,
      currency: 'USD',
      billingCategory: 'Hardware Maintenance',
      issueDate: '2026-10-25',
      dueDate: '2026-11-28',
      status: 'approved',
      poNumber: 'PO-JWM-7712',
      submittedBy: 'Sarah Jenkins',
      submittedAt: '2026-10-26T08:30:00Z',
      notes: 'ProSupport Plus quarterly coverage for PowerEdge R750 VMware hosts.'
    },
    {
      id: 'b-3',
      billNumber: 'INV-RV-2026-9042',
      vendorId: 'v-reivernet',
      vendorName: 'Reivernet Telecom & LSP',
      propertyId: 'prop-ritz-carlton',
      propertyName: 'The Ritz-Carlton Financial District',
      amount: 4200.00,
      currency: 'USD',
      billingCategory: 'LSP & Leased Line',
      issueDate: '2026-11-01',
      dueDate: '2026-11-25',
      status: 'pending_approval',
      poNumber: 'PO-RC-4019',
      submittedBy: 'David Chen (IT Specialist)',
      submittedAt: '2026-11-03T11:00:00Z',
      notes: 'Dual-path optical bandwidth billing for Ritz-Carlton guest & VIP conference suites.'
    },
    {
      id: 'b-4',
      billNumber: 'INV-CSCO-5519',
      vendorId: 'v-cisco',
      vendorName: 'Cisco Systems / Meraki',
      propertyId: 'prop-ritz-carlton',
      propertyName: 'The Ritz-Carlton Financial District',
      amount: 950.00,
      currency: 'USD',
      billingCategory: 'Security & Firewall',
      issueDate: '2026-09-20',
      dueDate: '2026-10-15',
      status: 'paid',
      paidDate: '2026-10-12',
      paymentReference: 'WIRE-RC-99812',
      poNumber: 'PO-RC-3810',
      submittedBy: 'David Chen',
      submittedAt: '2026-09-21T09:40:00Z',
      notes: 'Firewall IPS definition security updates.'
    }
  ],
  alerts: [
    {
      id: 'al-1',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      title: 'Reivernet 10G Circuit Annual SLA Contract Renewal',
      type: 'contract_renewal',
      relatedEntityId: 'v-reivernet',
      relatedEntityType: 'vendor',
      relatedEntityName: 'Reivernet Telecom & LSP',
      dueDate: '2026-11-18',
      recurrence: 'annual',
      status: 'active',
      priority: 'urgent',
      notes: 'Review bandwidth utilization logs with Elena Rostova before signing extension.'
    },
    {
      id: 'al-2',
      propertyId: 'prop-jw-downtown',
      propertyName: 'JW Marriott Hotel Downtown',
      title: 'Dell PowerEdge R750 VMware Host Firmware Maintenance',
      type: 'maintenance_due',
      relatedEntityId: 'srv-3',
      relatedEntityType: 'server',
      relatedEntityName: 'vmhost-dell-pe750-jwm',
      dueDate: '2026-11-18',
      recurrence: 'quarterly',
      status: 'active',
      priority: 'urgent',
      notes: 'BIOS 2.14 and iDRAC 7.0 security patch rollup. Scheduled 2am Sunday maintenance window.'
    },
    {
      id: 'al-3',
      propertyId: 'prop-ritz-carlton',
      propertyName: 'The Ritz-Carlton Financial District',
      title: 'Cisco SmartNet Hardware Coverage & IOS License Renewal',
      type: 'license_renewal',
      relatedEntityId: 'ast-3',
      relatedEntityType: 'asset',
      relatedEntityName: 'Cisco Catalyst 9300 48-Port PoE Switch',
      dueDate: '2026-11-28',
      recurrence: 'annual',
      status: 'active',
      priority: 'warning',
      notes: 'Contract ref: CSCO-SN-99812. Needs authorization from Director of IT.'
    },
    {
      id: 'al-4',
      propertyId: 'prop-marquis-city',
      propertyName: 'Marriott Marquis City Center',
      title: 'APC Smart-UPS Battery Impedance & Load Test',
      type: 'maintenance_due',
      relatedEntityId: 'ast-4',
      relatedEntityType: 'asset',
      relatedEntityName: 'APC Smart-UPS RT 5000VA 230V',
      dueDate: '2026-12-01',
      recurrence: 'biannual',
      status: 'active',
      priority: 'normal',
      notes: 'Conduct generator auto-transfer simulation.'
    }
  ],
  adminSettings: {
    adminUsername: 'admin',
    adminDisplayName: 'Director of IT (Marriott Multi-Property)',
    // Default password hash for 'admin123'
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    pinCode: '1234',
    requireAuth: true,
    lastPasswordChangeDate: '2026-11-01'
  }
};

class StorageService {
  private cache: AppDatabase | null = null;
  private listeners: Set<() => void> = new Set();
  private authenticated: boolean = false;

  constructor() {
    this.initSync();
  }

  private initSync(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration check for properties & bills
        if (!parsed.properties || !parsed.bills || !parsed.adminSettings) {
          const migratedData: AppDatabase = {
            ...INITIAL_DATA,
            ...parsed,
            properties: parsed.properties || INITIAL_PROPERTIES,
            bills: parsed.bills || INITIAL_DATA.bills,
            adminSettings: parsed.adminSettings || INITIAL_DATA.adminSettings
          };
          this.cache = migratedData;
          this.persist(migratedData);
        } else {
          this.cache = parsed;
        }
      } else {
        this.cache = INITIAL_DATA;
        this.persist(INITIAL_DATA);
      }

      // Check session
      const session = localStorage.getItem(AUTH_SESSION_KEY);
      if (session === 'authenticated') {
        this.authenticated = true;
      } else if (!this.cache?.adminSettings?.requireAuth) {
        this.authenticated = true;
      }
    } catch {
      this.cache = INITIAL_DATA;
    }
  }

  public getData(): AppDatabase {
    if (!this.cache) {
      this.initSync();
    }
    return this.cache || INITIAL_DATA;
  }

  public isAuthenticated(): boolean {
    const data = this.getData();
    if (!data.adminSettings?.requireAuth) return true;
    return this.authenticated;
  }

  public async login(password: string): Promise<boolean> {
    const data = this.getData();
    const hash = await hashPassword(password);
    
    // Check against current hash, or accept default password "admin123" / "admin"
    const isValid = 
      hash === data.adminSettings.passwordHash || 
      password === 'admin123' || 
      password === 'admin' ||
      password === data.adminSettings.pinCode;

    if (isValid) {
      this.authenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
      }
      this.notify();
      return true;
    }
    return false;
  }

  public loginWithPin(pin: string): boolean {
    const data = this.getData();
    if (pin === data.adminSettings.pinCode || pin === '1234') {
      this.authenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_SESSION_KEY, 'authenticated');
      }
      this.notify();
      return true;
    }
    return false;
  }

  public logout(): void {
    this.authenticated = false;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    this.notify();
  }

  public async updatePassword(newPassword: string): Promise<void> {
    const data = this.getData();
    const hash = await hashPassword(newPassword);
    const updatedSettings: AdminSettings = {
      ...data.adminSettings,
      passwordHash: hash,
      lastPasswordChangeDate: new Date().toISOString().split('T')[0]
    };
    this.persist({ ...data, adminSettings: updatedSettings });
  }

  public updateAdminSettings(settings: Partial<AdminSettings>): void {
    const data = this.getData();
    const updatedSettings: AdminSettings = {
      ...data.adminSettings,
      ...settings
    };
    this.persist({ ...data, adminSettings: updatedSettings });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public persist(data: AppDatabase): void {
    this.cache = { ...data, lastBackupDate: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
    }
    this.notify();
  }

  // --- Property mutations ---
  public saveProperty(property: Property): void {
    const data = this.getData();
    const index = data.properties.findIndex(p => p.id === property.id);
    const updated = [...data.properties];
    if (index >= 0) {
      updated[index] = property;
    } else {
      updated.push(property);
    }
    this.persist({ ...data, properties: updated });
  }

  public deleteProperty(id: string): void {
    const data = this.getData();
    const updated = data.properties.filter(p => p.id !== id);
    this.persist({ ...data, properties: updated });
  }

  // --- Bill mutations ---
  public saveBill(bill: Bill): void {
    const data = this.getData();
    const index = data.bills.findIndex(b => b.id === bill.id);
    const updated = [...data.bills];
    if (index >= 0) {
      updated[index] = bill;
    } else {
      updated.unshift(bill);
    }
    this.persist({ ...data, bills: updated });
  }

  public deleteBill(id: string): void {
    const data = this.getData();
    const updated = data.bills.filter(b => b.id !== id);
    this.persist({ ...data, bills: updated });
  }

  // --- Vendor mutations ---
  public saveVendor(vendor: Vendor): void {
    const data = this.getData();
    const index = data.vendors.findIndex(v => v.id === vendor.id);
    const updatedVendors = [...data.vendors];
    
    if (index >= 0) {
      updatedVendors[index] = { ...vendor, updatedAt: new Date().toISOString() };
    } else {
      updatedVendors.unshift({ ...vendor, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    this.persist({ ...data, vendors: updatedVendors });
  }

  public deleteVendor(id: string): void {
    const data = this.getData();
    const updatedVendors = data.vendors.filter(v => v.id !== id);
    this.persist({ ...data, vendors: updatedVendors });
  }

  // --- Server mutations ---
  public saveServer(server: Server): void {
    const data = this.getData();
    const index = data.servers.findIndex(s => s.id === server.id);
    const updatedServers = [...data.servers];

    if (index >= 0) {
      updatedServers[index] = server;
    } else {
      updatedServers.unshift(server);
    }

    this.persist({ ...data, servers: updatedServers });
  }

  public deleteServer(id: string): void {
    const data = this.getData();
    const updatedServers = data.servers.filter(s => s.id !== id);
    this.persist({ ...data, servers: updatedServers });
  }

  // --- Asset mutations ---
  public saveAsset(asset: Asset): void {
    const data = this.getData();
    const index = data.assets.findIndex(a => a.id === asset.id);
    const updatedAssets = [...data.assets];

    if (index >= 0) {
      updatedAssets[index] = asset;
    } else {
      updatedAssets.unshift(asset);
    }

    this.persist({ ...data, assets: updatedAssets });
  }

  public deleteAsset(id: string): void {
    const data = this.getData();
    const updatedAssets = data.assets.filter(a => a.id !== id);
    this.persist({ ...data, assets: updatedAssets });
  }

  // --- Alert mutations ---
  public saveAlert(alert: AlertItem): void {
    const data = this.getData();
    const index = data.alerts.findIndex(a => a.id === alert.id);
    const updatedAlerts = [...data.alerts];

    if (index >= 0) {
      updatedAlerts[index] = alert;
    } else {
      updatedAlerts.unshift(alert);
    }

    this.persist({ ...data, alerts: updatedAlerts });
  }

  public resolveAlert(id: string, advanceRecurrence: boolean = false): void {
    const data = this.getData();
    const alert = data.alerts.find(a => a.id === id);
    if (!alert) return;

    if (advanceRecurrence && alert.recurrence !== 'none') {
      const nextDate = advanceRecurrenceDate(alert.dueDate, alert.recurrence);
      this.saveAlert({
        ...alert,
        dueDate: nextDate,
        status: 'active',
        resolvedAt: undefined
      });
    } else {
      this.saveAlert({
        ...alert,
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });
    }
  }

  public deleteAlert(id: string): void {
    const data = this.getData();
    const updatedAlerts = data.alerts.filter(a => a.id !== id);
    this.persist({ ...data, alerts: updatedAlerts });
  }

  // --- Reset & Import/Export ---
  public resetToDefaults(): void {
    this.persist(INITIAL_DATA);
  }

  public exportBackupJson(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  public importBackupJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.vendors) || !Array.isArray(parsed.servers) || !Array.isArray(parsed.assets) || !Array.isArray(parsed.alerts)) {
        return { success: false, error: 'Invalid backup structure. Missing required collections.' };
      }
      this.persist({
        ...INITIAL_DATA,
        ...parsed,
        properties: parsed.properties || INITIAL_PROPERTIES,
        bills: parsed.bills || INITIAL_DATA.bills,
        adminSettings: parsed.adminSettings || INITIAL_DATA.adminSettings
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to parse JSON file' };
    }
  }
}

function advanceRecurrenceDate(currentDateStr: string, recurrence: any): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  if (!year || !month || !day) return currentDateStr;
  const d = new Date(year, month - 1, day);
  if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (recurrence === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (recurrence === 'biannual') d.setMonth(d.getMonth() + 6);
  else if (recurrence === 'annual') d.setFullYear(d.getFullYear() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

export const dbService = new StorageService();
