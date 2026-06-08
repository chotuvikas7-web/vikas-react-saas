import { useEffect, useState } from 'react';
import {
  Bar,
  Doughnut,
  Line
} from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement
} from 'chart.js';
import { api } from '../../api.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const grid = { color: '#eef2f7', drawBorder: false };
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { grid }, y: { grid, beginAtZero: true } }
};

const moneyishDate = (value) => String(value || '').slice(0, 10) || '-';

function StatusBadge({ status }) {
  const value = String(status || 'active').toLowerCase();
  const tone = ['active', 'paid', 'success', 'approved', 'resolved'].includes(value)
    ? 'success'
    : ['trial', 'pending', 'queued', 'running', 'review'].includes(value)
      ? 'warning'
      : ['suspended', 'rejected', 'failed', 'blocked', 'cancelled', 'expired'].includes(value)
        ? 'danger'
        : 'secondary';
  return <span className={`badge text-bg-${tone}`}>{value}</span>;
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="super-panel">
      <div className="super-panel-head"><h2>{title}</h2><span>{subtitle}</span></div>
      {children}
    </div>
  );
}

function ActivityTable({ rows, referenceKey, statusKey }) {
  return (
    <div className="table-responsive">
      <table className="table align-middle" data-no-datatable="true">
        <thead><tr><th>Company</th><th>Reference</th><th>Status / Date</th><th>Created</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${referenceKey}-${row.id || index}`}>
              <td>{row.company_name || 'Platform'}</td>
              <td>{row[referenceKey] || '-'}</td>
              <td>{row[statusKey] || '-'}</td>
              <td>{moneyishDate(row.created_at)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="4" className="text-center text-muted py-3">No records yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function SuperDashboard() {
  const [data, setData] = useState({ cards: [], chartData: {}, recentTenants: [], recentPayments: [], recentTickets: [], expiringSubscriptions: [], failedPayments: [] });

  useEffect(() => {
    api('/super-admin/dashboard').then(setData).catch(console.error);
  }, []);

  const chartData = data.chartData || {};
  const labels = chartData.revenueLabels || [];
  const planLabels = chartData.planLabels?.length ? chartData.planLabels : ['Free', 'Starter', 'Business', 'Enterprise'];

  return (
    <>
      <div className="super-kpi-grid">
        {(data.cards || []).map(([label, value, icon, tone]) => (
          <div className="super-kpi-card" key={label}>
            <div className={`super-kpi-icon is-${tone}`}><i className={`bi ${icon}`} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="row g-3 mt-1">
        <div className="col-xl-8">
          <Panel title="Revenue Chart" subtitle="Monthly platform revenue">
            <div style={{ height: 260 }}>
              <Line data={{ labels, datasets: [{ label: 'Revenue', data: chartData.revenue || [], borderColor: '#465dff', backgroundColor: 'rgba(70,93,255,.12)', tension: 0.35, fill: true }] }} options={chartOptions} />
            </div>
          </Panel>
        </div>
        <div className="col-xl-4">
          <Panel title="Subscription Breakdown" subtitle="Plan distribution">
            <div style={{ height: 260 }}>
              <Doughnut data={{ labels: planLabels, datasets: [{ data: chartData.planCounts?.length ? chartData.planCounts : [0, 0, 0, 0], backgroundColor: ['#465dff', '#12b76a', '#f79009', '#783bff'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </Panel>
        </div>
        <div className="col-xl-6"><Panel title="Company Growth" subtitle="Tenant acquisition"><div style={{ height: 220 }}><Bar data={{ labels, datasets: [{ label: 'Companies', data: chartData.companyGrowth || [], backgroundColor: '#465dff', borderRadius: 5 }] }} options={chartOptions} /></div></Panel></div>
        <div className="col-xl-6"><Panel title="User Growth" subtitle="Users across all tenants"><div style={{ height: 220 }}><Line data={{ labels, datasets: [{ label: 'Users', data: chartData.userGrowth || [], borderColor: '#12b76a', backgroundColor: 'rgba(18,183,106,.12)', tension: 0.35, fill: true }] }} options={chartOptions} /></div></Panel></div>
        <div className="col-xl-6"><Panel title="Support Ticket Status" subtitle="Open, pending and resolved tickets"><div style={{ height: 220 }}><Bar data={{ labels: chartData.supportLabels || [], datasets: [{ label: 'Tickets', data: chartData.supportCounts || [], backgroundColor: ['#465dff', '#f79009', '#12b76a', '#667085'], borderRadius: 5 }] }} options={chartOptions} /></div></Panel></div>
        <div className="col-xl-6"><Panel title="Churn Rate" subtitle="Monthly customer churn trend"><div style={{ height: 220 }}><Line data={{ labels, datasets: [{ label: 'Churn %', data: chartData.churn || [], borderColor: '#f04438', backgroundColor: 'rgba(240,68,56,.1)', tension: 0.35, fill: true }] }} options={chartOptions} /></div></Panel></div>
      </div>

      <div className="super-panel mt-3">
        <div className="super-panel-head d-flex justify-content-between align-items-center">
          <div><h2>Recent Companies</h2><span>Latest tenant accounts</span></div>
          <a className="btn btn-primary btn-sm" href="/super-admin/modules/company-details">Add Company</a>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Company</th><th>Slug</th><th>Database</th><th>Owner</th><th>Status</th><th className="text-end">Action</th></tr></thead>
            <tbody>
              {(data.recentTenants || []).map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.company_name}</td>
                  <td><code>{tenant.slug}</code></td>
                  <td><code>{tenant.database_name}</code></td>
                  <td>{tenant.owner_email}</td>
                  <td><StatusBadge status={tenant.status} /></td>
                  <td className="text-end"><a className="btn btn-sm btn-outline-primary" target="_blank" rel="noreferrer" href={`/admin/login?tenant=${encodeURIComponent(tenant.slug || '')}`}>Login as Admin</a></td>
                </tr>
              ))}
              {!data.recentTenants?.length && <tr><td colSpan="6" className="text-center text-muted py-4">No companies yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row g-3 mt-1">
        {[
          ['Recent Payments', data.recentPayments || [], 'invoice_no', 'payment_status'],
          ['Recent Support Tickets', data.recentTickets || [], 'subject', 'status'],
          ['Expiring Subscriptions', data.expiringSubscriptions || [], 'company_name', 'renews_at'],
          ['Failed Payments', data.failedPayments || [], 'invoice_no', 'payment_status']
        ].map(([title, rows, referenceKey, statusKey]) => (
          <div className="col-xl-6" key={title}>
            <Panel title={title} subtitle="Latest platform activity"><ActivityTable rows={rows} referenceKey={referenceKey} statusKey={statusKey} /></Panel>
          </div>
        ))}
        <div className="col-xl-6"><Panel title="Recent Login Activity" subtitle="Admin and tenant login signals"><div className="super-chart-placeholder"><i className="bi bi-clock-history" /><span>Login logs are available under Security & Compliance.</span></div></Panel></div>
        <div className="col-xl-6"><Panel title="System Alerts" subtitle="Infrastructure and maintenance status"><div className="super-chart-placeholder"><i className="bi bi-exclamation-triangle" /><span>No critical alerts. Queue, cron and backup monitors are in Maintenance.</span></div></Panel></div>
      </div>
    </>
  );
}
