import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getDaysDifference, 
  getAlertUrgency, 
  advanceRecurrenceDate, 
  isValidIPv4, 
  isValidEmail, 
  sanitizePhoneNumber, 
  performGlobalSearch,
  filterItemsByProperty,
  calculateBillMetrics,
  hashPassword
} from './alertEngine';
import { AppDatabase } from '../types';

test('getDaysDifference calculates accurate days', () => {
  const ref = new Date(2026, 10, 11); // 2026-11-11
  assert.equal(getDaysDifference('2026-11-11', ref), 0);
  assert.equal(getDaysDifference('2026-11-15', ref), 4);
  assert.equal(getDaysDifference('2026-11-01', ref), -10);
});

test('getAlertUrgency categorizes overdue, critical, upcoming, and distant', () => {
  const ref = new Date(2026, 10, 11);
  
  // Overdue: past date
  const overdue = getAlertUrgency('2026-11-05', ref);
  assert.equal(overdue.tier, 'overdue');
  assert.equal(overdue.daysRemaining, -6);

  // Critical: 0 to 7 days
  const critical = getAlertUrgency('2026-11-14', ref);
  assert.equal(critical.tier, 'critical');
  assert.equal(critical.daysRemaining, 3);

  // Upcoming: 8 to 30 days
  const upcoming = getAlertUrgency('2026-11-30', ref);
  assert.equal(upcoming.tier, 'upcoming');
  assert.equal(upcoming.daysRemaining, 19);

  // Distant: > 30 days
  const distant = getAlertUrgency('2027-02-01', ref);
  assert.equal(distant.tier, 'distant');
  assert.ok(distant.daysRemaining > 30);
});

test('advanceRecurrenceDate properly jumps calendar intervals', () => {
  assert.equal(advanceRecurrenceDate('2026-05-10', 'none'), '2026-05-10');
  assert.equal(advanceRecurrenceDate('2026-01-15', 'monthly'), '2026-02-15');
  assert.equal(advanceRecurrenceDate('2026-01-15', 'quarterly'), '2026-04-15');
  assert.equal(advanceRecurrenceDate('2026-01-15', 'biannual'), '2026-07-15');
  assert.equal(advanceRecurrenceDate('2026-01-15', 'annual'), '2027-01-15');
});

test('validation helpers work reliably', () => {
  assert.equal(isValidIPv4('192.168.1.1'), true);
  assert.equal(isValidIPv4('10.0.0.254'), true);
  assert.equal(isValidIPv4('256.0.0.1'), false);
  assert.equal(isValidIPv4('10.0.1'), false);
  assert.equal(isValidIPv4('abc.def.ghi.jkl'), false);

  assert.equal(isValidEmail('noc@reivernet.com'), true);
  assert.equal(isValidEmail('support@cloud.co.uk'), true);
  assert.equal(isValidEmail('invalid-email'), false);

  assert.equal(sanitizePhoneNumber('+1 (800) 555-0199'), '+18005550199');
  assert.equal(sanitizePhoneNumber('020-7946-0920'), '02079460920');
});

test('performGlobalSearch matches entities across vendors, contacts, servers, assets, and alerts', () => {
  const mockDb: AppDatabase = {
    vendors: [
      {
        id: 'v1',
        name: 'Reivernet Telecom LSP',
        category: 'LSP',
        accountId: 'RV-9041',
        slaTier: '24/7 Priority 1',
        contacts: [
          {
            id: 'c1',
            name: 'Alistair Vance',
            designation: 'Senior NOC Lead',
            emails: ['alistair@reivernet.com'],
            phoneNumbers: [{ id: 'p1', label: '24x7 NOC', number: '+44 20 7946 0192' }],
            isPrimary: true
          }
        ],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      }
    ],
    servers: [
      {
        id: 's1',
        propertyId: 'prop-1',
        name: 'reivernet-peering-edge',
        type: 'on-premises',
        ipAddress: '192.168.10.1',
        location: 'Datacenter Rack 3',
        role: 'Gateway / LSP Router',
        os: 'Cisco IOS-XE',
        specs: { cpu: '4 Core', ram: '16GB', storage: '256GB SSD' },
        status: 'active'
      }
    ],
    assets: [
      {
        id: 'a1',
        propertyId: 'prop-1',
        name: 'Fiber Termination Panel',
        category: 'LSP Circuit / Lease Line',
        assetTag: 'AST-LSP-001',
        serialNumber: 'SN-998822',
        location: 'MDF Room',
        purchaseDate: '2025-01-01',
        warrantyExpiry: '2027-01-01',
        status: 'in-service'
      }
    ],
    alerts: [
      {
        id: 'al1',
        title: 'Reivernet Circuit SLA Renewal',
        type: 'contract_renewal',
        relatedEntityId: 'v1',
        relatedEntityType: 'vendor',
        relatedEntityName: 'Reivernet Telecom LSP',
        dueDate: '2026-11-20',
        recurrence: 'annual',
        status: 'active',
        priority: 'urgent'
      }
    ],
    properties: [
      { id: 'prop-1', name: 'JW Marriott Hotel', code: 'JWM', brand: 'JW Marriott', city: 'San Francisco' }
    ],
    bills: [],
    adminSettings: {
      passwordHash: 'dummy',
      adminUsername: 'admin',
      adminDisplayName: 'IT Director',
      pinCode: '1234',
      requireAuth: false
    }
  };

  // Search by LSP vendor name
  const vendorResults = performGlobalSearch(mockDb, 'reivernet');
  assert.ok(vendorResults.length >= 3); // Should match vendor, contact, server, and alert!
  
  // Search by designation
  const contactResults = performGlobalSearch(mockDb, 'NOC Lead');
  assert.equal(contactResults.length, 1);
  assert.equal(contactResults[0].title, 'Alistair Vance');

  // Search by IP
  const serverResults = performGlobalSearch(mockDb, '192.168.10.1');
  assert.equal(serverResults.length, 1);
  assert.equal(serverResults[0].title, 'reivernet-peering-edge');

  // Search by asset tag
  const assetResults = performGlobalSearch(mockDb, 'AST-LSP');
  assert.equal(assetResults.length, 1);
  assert.equal(assetResults[0].title, 'Fiber Termination Panel');
});

test('filterItemsByProperty isolates assets and servers strictly by hotel property', () => {
  const assets = [
    { id: 'a1', propertyId: 'prop-jw', name: 'JW Core Switch' },
    { id: 'a2', propertyId: 'prop-jw', name: 'JW Server Host' },
    { id: 'a3', propertyId: 'prop-ritz', name: 'Ritz Optical Term' },
  ];

  // Scoped to JW Marriott
  const jwAssets = filterItemsByProperty(assets, 'prop-jw');
  assert.equal(jwAssets.length, 2);
  assert.ok(jwAssets.every(a => a.propertyId === 'prop-jw'));

  // Scoped to Ritz-Carlton
  const ritzAssets = filterItemsByProperty(assets, 'prop-ritz');
  assert.equal(ritzAssets.length, 1);
  assert.equal(ritzAssets[0].name, 'Ritz Optical Term');

  // All properties view
  const allAssets = filterItemsByProperty(assets, 'all');
  assert.equal(allAssets.length, 3);
});

test('calculateBillMetrics accurately aggregates pending and paid amounts per property', () => {
  const bills: any[] = [
    {
      id: 'b1',
      propertyId: 'prop-jw',
      amount: 4500,
      status: 'pending_approval',
      dueDate: '2026-11-20'
    },
    {
      id: 'b2',
      propertyId: 'prop-jw',
      amount: 1200,
      status: 'paid',
      dueDate: '2026-10-01'
    },
    {
      id: 'b3',
      propertyId: 'prop-ritz',
      amount: 3200,
      status: 'pending_approval',
      dueDate: '2026-11-25'
    }
  ];

  const jwMetrics = calculateBillMetrics(bills, 'prop-jw');
  assert.equal(jwMetrics.totalPending, 4500);
  assert.equal(jwMetrics.totalPaid, 1200);
  assert.equal(jwMetrics.totalCount, 2);

  const allMetrics = calculateBillMetrics(bills, 'all');
  assert.equal(allMetrics.totalPending, 7700);
  assert.equal(allMetrics.totalPaid, 1200);
  assert.equal(allMetrics.totalCount, 3);
});

test('hashPassword produces non-empty secure hash and matches consistently', async () => {
  const hash1 = await hashPassword('LinearIT@2026');
  const hash2 = await hashPassword('LinearIT@2026');
  const hashDiff = await hashPassword('WrongPassword');

  assert.ok(hash1.length > 5);
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hashDiff);
});

