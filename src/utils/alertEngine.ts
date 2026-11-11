import { AlertItem, AlertRecurrence, AppDatabase, Bill, Property } from '../types';

/**
 * Calculates calendar days between reference date and target date string (YYYY-MM-DD).
 * Negative indicates target is in the past (overdue).
 */
export function getDaysDifference(targetDateStr: string, fromDate: Date = new Date()): number {
  if (!targetDateStr) return 0;
  
  const [year, month, day] = targetDateStr.split('-').map(Number);
  if (!year || !month || !day) return 0;

  const targetTime = Date.UTC(year, month - 1, day);
  const fromTime = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetTime - fromTime) / msPerDay);
}

export type AlertUrgencyTier = 'overdue' | 'critical' | 'upcoming' | 'distant';

export interface AlertUrgencyResult {
  tier: AlertUrgencyTier;
  daysRemaining: number;
}

export function getAlertUrgency(dueDateStr: string, fromDate: Date = new Date()): AlertUrgencyResult {
  const daysRemaining = getDaysDifference(dueDateStr, fromDate);
  
  if (daysRemaining < 0) {
    return { tier: 'overdue', daysRemaining };
  }
  if (daysRemaining <= 7) {
    return { tier: 'critical', daysRemaining };
  }
  if (daysRemaining <= 30) {
    return { tier: 'upcoming', daysRemaining };
  }
  return { tier: 'distant', daysRemaining };
}

export function advanceRecurrenceDate(currentDateStr: string, recurrence: AlertRecurrence): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  if (!year || !month || !day || recurrence === 'none') {
    return currentDateStr;
  }

  const d = new Date(year, month - 1, day);

  switch (recurrence) {
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'biannual':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'annual':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

export function isValidIPv4(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Filters items by propertyId. If propertyId is 'all', returns all items.
 */
export function filterItemsByProperty<T extends { propertyId?: string }>(items: T[], propertyId: string | 'all'): T[] {
  if (!items) return [];
  if (propertyId === 'all') return items;
  return items.filter(item => item.propertyId === propertyId);
}

/**
 * Calculates financial bill totals.
 */
export function calculateBillMetrics(bills: Bill[], propertyId: string | 'all' = 'all') {
  const scoped = filterItemsByProperty(bills, propertyId);
  let totalPending = 0;
  let totalPaid = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  for (const b of scoped) {
    if (b.status === 'paid') {
      totalPaid += b.amount;
    } else {
      totalPending += b.amount;
      pendingCount++;
      const days = getDaysDifference(b.dueDate);
      if (days < 0 || b.status === 'overdue') {
        overdueCount++;
      }
    }
  }

  return {
    totalPending,
    totalPaid,
    pendingCount,
    overdueCount,
    totalCount: scoped.length
  };
}

/**
 * Fast client & Node compatible password hashing for offline verification.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const clean = plainText.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean + '-linearit-salt-2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple deterministic fallback for headless environments without subtle crypto
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash-${Math.abs(hash)}`;
}

export interface SearchMatch {
  type: 'vendor' | 'contact' | 'server' | 'asset' | 'alert' | 'bill' | 'property';
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
  item: any;
}

export function performGlobalSearch(db: AppDatabase, rawQuery: string): SearchMatch[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const results: SearchMatch[] = [];

  // Search Properties
  for (const prop of (db.properties || [])) {
    if (prop.name.toLowerCase().includes(query) || prop.code.toLowerCase().includes(query) || prop.city.toLowerCase().includes(query)) {
      results.push({
        type: 'property',
        id: prop.id,
        title: prop.name,
        subtitle: `${prop.city} • Code: ${prop.code}`,
        tag: prop.brand,
        item: prop
      });
    }
  }

  // Search Vendors
  for (const vendor of db.vendors) {
    const matchName = vendor.name.toLowerCase().includes(query);
    const matchCat = vendor.category.toLowerCase().includes(query);
    const matchAcc = vendor.accountId.toLowerCase().includes(query);

    if (matchName || matchCat || matchAcc) {
      results.push({
        type: 'vendor',
        id: vendor.id,
        title: vendor.name,
        subtitle: `${vendor.category} • ${vendor.accountId}`,
        tag: vendor.slaTier,
        item: vendor,
      });
    }

    for (const contact of vendor.contacts) {
      const matchContactName = contact.name.toLowerCase().includes(query);
      const matchDesig = contact.designation.toLowerCase().includes(query);
      const matchEmail = contact.emails.some(e => e.toLowerCase().includes(query));
      const matchPhone = contact.phoneNumbers.some(p => p.number.includes(query) || p.label.toLowerCase().includes(query));

      if (matchContactName || matchDesig || matchEmail || matchPhone) {
        results.push({
          type: 'contact',
          id: `${vendor.id}:${contact.id}`,
          title: contact.name,
          subtitle: `${contact.designation} at ${vendor.name}`,
          tag: contact.isPrimary ? 'Primary Contact' : undefined,
          item: { vendor, contact },
        });
      }
    }
  }

  // Search Bills
  for (const bill of (db.bills || [])) {
    const matchNum = bill.billNumber.toLowerCase().includes(query);
    const matchVendor = bill.vendorName.toLowerCase().includes(query);
    const matchProp = bill.propertyName.toLowerCase().includes(query);
    const matchPo = bill.poNumber && bill.poNumber.toLowerCase().includes(query);

    if (matchNum || matchVendor || matchProp || matchPo) {
      results.push({
        type: 'bill',
        id: bill.id,
        title: `${bill.billNumber} ($${bill.amount.toLocaleString()})`,
        subtitle: `Pay to ${bill.vendorName} • ${bill.propertyName}`,
        tag: bill.status.toUpperCase(),
        item: bill
      });
    }
  }

  // Search Servers
  for (const server of db.servers) {
    const matchName = server.name.toLowerCase().includes(query);
    const matchIp = server.ipAddress.includes(query) || (server.publicIp && server.publicIp.includes(query));
    const matchLoc = server.location.toLowerCase().includes(query);
    const matchRole = server.role.toLowerCase().includes(query);

    if (matchName || matchIp || matchLoc || matchRole) {
      results.push({
        type: 'server',
        id: server.id,
        title: server.name,
        subtitle: `${server.ipAddress} • ${server.location} (${server.type})`,
        tag: server.role,
        item: server,
      });
    }
  }

  // Search Assets
  for (const asset of db.assets) {
    const matchName = asset.name.toLowerCase().includes(query);
    const matchTag = asset.assetTag.toLowerCase().includes(query);
    const matchSerial = asset.serialNumber.toLowerCase().includes(query);

    if (matchName || matchTag || matchSerial) {
      results.push({
        type: 'asset',
        id: asset.id,
        title: asset.name,
        subtitle: `${asset.assetTag} • S/N: ${asset.serialNumber}`,
        tag: asset.category,
        item: asset,
      });
    }
  }

  // Search Alerts
  for (const alert of db.alerts) {
    const matchTitle = alert.title.toLowerCase().includes(query);
    const matchEntity = alert.relatedEntityName.toLowerCase().includes(query);

    if (matchTitle || matchEntity) {
      results.push({
        type: 'alert',
        id: alert.id,
        title: alert.title,
        subtitle: `Due ${alert.dueDate} • ${alert.relatedEntityName}`,
        tag: alert.priority.toUpperCase(),
        item: alert,
      });
    }
  }

  return results.slice(0, 30);
}
