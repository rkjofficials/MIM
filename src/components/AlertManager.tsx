import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Clock, 
  Plus, 
  Bell, 
  Trash2, 
  Calendar, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { AlertItem, AppDatabase } from '../types';
import { getAlertUrgency, advanceRecurrenceDate } from '../utils/alertEngine';
import { dbService } from '../utils/storage';

interface AlertManagerProps {
  db: AppDatabase;
  onNewAlert: () => void;
  onEditAlert: (alert: AlertItem) => void;
  onSelectVendorById?: (vendorId: string) => void;
}

export const AlertManager: React.FC<AlertManagerProps> = ({
  db,
  onNewAlert,
  onEditAlert,
  onSelectVendorById,
}) => {
  const [viewFilter, setViewFilter] = useState<'active' | 'resolved'>('active');
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationStatus(perm);
      if (perm === 'granted') {
        new Notification('LinearIT Automated Alerts', {
          body: 'Offline automated alerts and license renewal monitors are active on this device.',
        });
      }
    } catch (e) {
      console.warn('Notification permission error', e);
    }
  };

  const handleResolveAndAdvance = (alert: AlertItem) => {
    if (alert.recurrence !== 'none') {
      dbService.resolveAlert(alert.id, true);
    } else {
      dbService.resolveAlert(alert.id, false);
    }
  };

  const handleSnooze = (alert: AlertItem) => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const nextDate = d.toISOString().split('T')[0];

    dbService.saveAlert({
      ...alert,
      dueDate: nextDate,
      status: 'active'
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this alert schedule?')) {
      dbService.deleteAlert(id);
    }
  };

  // Filter alerts
  const displayAlerts = db.alerts.filter(a => {
    if (viewFilter === 'active') return a.status === 'active';
    return a.status === 'resolved';
  });

  // Group active alerts into Urgency categories
  const overdueOrCritical = displayAlerts.filter(a => {
    const u = getAlertUrgency(a.dueDate);
    return u.tier === 'overdue' || u.tier === 'critical';
  });

  const upcomingAlerts = displayAlerts.filter(a => {
    const u = getAlertUrgency(a.dueDate);
    return u.tier === 'upcoming' || u.tier === 'distant';
  });

  const getAlertBadge = (dueDate: string) => {
    const urgency = getAlertUrgency(dueDate);
    if (urgency.tier === 'overdue') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/70 text-rose-300 border border-rose-700/50 font-semibold">
          {Math.abs(urgency.daysRemaining)}d OVERDUE
        </span>
      );
    }
    if (urgency.tier === 'critical') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/70 text-amber-300 border border-amber-700/50 font-semibold">
          {urgency.daysRemaining === 0 ? 'DUE TODAY' : `IN ${urgency.daysRemaining} DAYS`}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#18202d] text-slate-300">
        IN {urgency.daysRemaining} DAYS
      </span>
    );
  };

  const renderAlertCard = (alert: AlertItem) => {
    return (
      <div
        key={alert.id}
        className="rounded-xl bg-[#121620] border border-[#1f2636] p-4 text-xs space-y-3 shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {alert.status === 'active' && getAlertBadge(alert.dueDate)}
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-[#192230] text-indigo-300">
                {alert.type.replace('_', ' ')}
              </span>
              {alert.recurrence !== 'none' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1a221d] text-emerald-300 flex items-center gap-1">
                  <RotateCw className="w-2.5 h-2.5" />
                  {alert.recurrence}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-white tracking-tight pt-1">
              {alert.title}
            </h3>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                Target:
              </span>
              <span className="text-slate-300 font-medium">
                {alert.relatedEntityName}
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                ({alert.relatedEntityType})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEditAlert(alert)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1f2636] cursor-pointer"
              title="Edit alert"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(alert.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2636] cursor-pointer"
              title="Delete alert"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {alert.notes && (
          <div className="p-2.5 rounded-lg bg-[#0c0f16] border border-[#1a212e] text-[11px] text-slate-300">
            {alert.notes}
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-[#1a212e] text-[11px]">
          <span className="font-mono text-slate-400">
            Due: {alert.dueDate}
          </span>

          {alert.status === 'active' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSnooze(alert)}
                className="px-2 py-1 rounded bg-[#18202d] hover:bg-[#202b3d] text-slate-300 font-medium cursor-pointer"
                title="Postpone 7 days"
              >
                Snooze 7d
              </button>
              <button
                type="button"
                onClick={() => handleResolveAndAdvance(alert)}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 cursor-pointer shadow"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {alert.recurrence !== 'none' ? `Done (+${alert.recurrence})` : 'Resolve'}
                </span>
              </button>
            </div>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Active vs Resolved filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#121620] border border-[#1f2636]">
          <button
            type="button"
            onClick={() => setViewFilter('active')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
              viewFilter === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Schedules ({db.alerts.filter(a => a.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('resolved')}
            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
              viewFilter === 'resolved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved History ({db.alerts.filter(a => a.status === 'resolved').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== 'granted' && typeof Notification !== 'undefined' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#202b3d] text-slate-300 text-xs font-medium border border-[#263347] cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Device Alerts</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewAlert}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shrink-0 cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Alert</span>
          </button>
        </div>
      </div>

      {/* List content */}
      {viewFilter === 'active' ? (
        <div className="space-y-6">
          {/* Overdue / Critical Section */}
          {overdueOrCritical.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Critical & Overdue Actions ({overdueOrCritical.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overdueOrCritical.map(renderAlertCard)}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Upcoming Renewals & Maintenance ({upcomingAlerts.length})
            </h3>
            {upcomingAlerts.length === 0 && overdueOrCritical.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
                No active schedules or alerts. All contracts and hardware maintenance are up to date!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingAlerts.map(renderAlertCard)}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayAlerts.length === 0 ? (
            <div className="col-span-2 p-12 text-center rounded-xl bg-[#12161f] border border-[#1e2533] text-slate-400 text-xs">
              No resolved alert history yet.
            </div>
          ) : (
            displayAlerts.map(renderAlertCard)
          )}
        </div>
      )}
    </div>
  );
};
