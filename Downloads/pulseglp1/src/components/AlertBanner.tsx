import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Zap, TrendingUp } from 'lucide-react';

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

const ALERT_META: Record<string, { Icon: React.FC<{ className?: string }>; border: string; bg: string; iconClass: string }> = {
  'risk-spike':      { Icon: AlertTriangle, border: 'border-error/40',   bg: 'bg-error/8',    iconClass: 'text-error' },
  'critical-insight':{ Icon: Zap,           border: 'border-primary/40', bg: 'bg-primary/8',  iconClass: 'text-primary' },
  'volume-spike':    { Icon: TrendingUp,     border: 'border-tertiary/40',bg: 'bg-tertiary/8', iconClass: 'text-tertiary' },
};
const DEFAULT_META = { Icon: AlertTriangle, border: 'border-outline-variant', bg: 'bg-surface-container-high', iconClass: 'text-on-surface-variant' };

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

  const dismiss = (id: number) => {
    fetch(`/api/alerts/${id}/ack`, { method: 'POST' }).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
      {alerts.slice(0, 4).map(alert => {
        const meta = ALERT_META[alert.type] || DEFAULT_META;
        const { Icon } = meta;
        return (
          <div
            key={alert.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg analytical-border shadow-xl ${meta.border} ${meta.bg}`}
            style={{ backdropFilter: 'none', background: 'var(--color-surface)' }}
          >
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.iconClass}`} />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-on-surface leading-snug">{alert.message}</p>
              <span className="text-[10px] text-on-surface-variant">{timeAgo(alert.fired_at)}</span>
            </div>
            <button
              onClick={() => dismiss(alert.id)}
              className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors mt-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      {alerts.length > 4 && (
        <div className="pointer-events-auto text-center text-[10px] text-on-surface-variant bg-surface rounded-lg px-3 py-1.5 analytical-border">
          +{alerts.length - 4} more alerts
        </div>
      )}
    </div>
  );
}
