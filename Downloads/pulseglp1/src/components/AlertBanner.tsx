import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { WarningIcon } from './WarningIcon';

interface Alert {
  id: number;
  type: string;
  message: string;
  drug?: string;
  fired_at: number;
}

function timeAgo(ms: number) {
  const d = Date.now() - ms;
  const h = Math.floor(d / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const isHigh = (type: string) => type === 'risk-spike' || type === 'critical-insight';

export function AlertBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const fetchAlerts = useCallback(() => {
    fetch('/api/alerts')
      .then(r => r.ok ? r.json() : [])
      .then((data: Alert[]) => setAlerts(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const ack = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    fetch(`/api/alerts/${id}/ack`, { method: 'POST' }).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[80] pointer-events-none">
      <div className="max-w-container-max mx-auto px-margin pt-2 space-y-2">
        {alerts.slice(0, 3).map(alert => (
          <div
            key={alert.id}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded analytical-border bg-surface-container-high shadow-lg"
            style={{ borderColor: isHigh(alert.type) ? 'var(--color-error)' : 'var(--color-primary)' }}
          >
            <WarningIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isHigh(alert.type) ? 'text-error' : 'text-primary'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-on-surface">{alert.message}</p>
              <span className="text-[10px] text-on-surface-variant">{timeAgo(alert.fired_at)}</span>
            </div>
            <button
              onClick={e => ack(alert.id, e)}
              className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {alerts.length > 3 && (
          <div className="text-center text-[10px] text-on-surface-variant pointer-events-auto">
            +{alerts.length - 3} more alerts
          </div>
        )}
      </div>
    </div>
  );
}
