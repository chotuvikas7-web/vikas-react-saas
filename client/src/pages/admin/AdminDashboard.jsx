import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { AdminCreateOrderModal } from './AdminCreateOrderModal.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const number = (value) => Number(value || 0);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      labels: { boxWidth: 10, boxHeight: 10, color: '#8493a5', font: { size: 12 } }
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(90, 96, 106, .72)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      displayColors: true
    }
  },
  scales: {
    x: { grid: { color: '#e7edf5' }, ticks: { color: '#8493a5' } },
    y: { beginAtZero: true, grid: { color: '#e7edf5' }, ticks: { color: '#8493a5' } }
  }
};

export function AdminDashboard() {
  const [data, setData] = useState({ metrics: {}, recentOrders: [], lowStock: [], chartData: {} });
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  const load = () => api('/admin/dashboard').then(setData).catch(console.error);
  useEffect(() => { load(); }, []);

  const stats = data.metrics || {};
  const chart = data.chartData || {};
  const cards = [
    ['Total Clients', stats.clients, 'bi-people'],
    ['Suppliers', stats.suppliers, 'bi-truck'],
    ['Total Products', stats.products, 'bi-cpu'],
    ['Total Sales', money(stats.sales), 'bi-currency-rupee'],
    ['Purchase Cost', money(stats.purchases), 'bi-bag-plus'],
    ['Expenses', money(stats.expenses), 'bi-wallet2'],
    ['Low Stock Items', stats.low_stock, 'bi-exclamation-triangle']
  ];
  const profitCards = [
    ['Today Sales', money(stats.today_sales), 'bi-receipt'],
    ['Today Purchase', money(stats.today_purchase), 'bi-bag'],
    ['Today Earning', money(stats.today_earning), 'bi-arrow-down-circle'],
    ['Today Expense', money(stats.today_expense), 'bi-arrow-up-circle'],
    ['Today Profit / Loss', money(number(stats.today_earning) - number(stats.today_expense)), 'bi-calculator'],
    ['Monthly Earning', money(stats.month_earning), 'bi-calendar-check'],
    ['Monthly Expense', money(stats.month_expense), 'bi-calendar-minus'],
    ['Monthly Profit / Loss', money(number(stats.month_earning) - number(stats.month_expense)), 'bi-activity'],
    ['Cash Balance', money(stats.cash_balance), 'bi-cash'],
    ['Bank Balance', money(stats.bank_balance), 'bi-bank'],
    ['Pending Client Payment', money(stats.pending_client), 'bi-hourglass-split'],
    ['Pending Supplier Payment', money(stats.pending_supplier), 'bi-clock-history']
  ];
  const trendData = {
    labels: chart.trendLabels || [],
    datasets: [
      { label: 'Sales', data: chart.salesTrend || [], borderColor: '#4a5cff', backgroundColor: '#4a5cff', tension: .35, pointRadius: 3 },
      { label: 'Purchase', data: chart.purchaseTrend || [], borderColor: '#7c3cff', backgroundColor: '#7c3cff', tension: .35, pointRadius: 3 },
      { label: 'Earning', data: chart.earningTrend || [], borderColor: '#61c454', backgroundColor: '#61c454', tension: .35, pointRadius: 3 },
      { label: 'Expense', data: chart.expenseTrend || [], borderColor: '#ff6548', backgroundColor: '#ff6548', tension: .35, pointRadius: 3 }
    ]
  };
  const profitEntries = Object.entries(chart.profitBreakdown || {});
  const profitData = {
    labels: profitEntries.map(([label]) => label),
    datasets: [{ data: profitEntries.map(([, value]) => value), backgroundColor: ['#4a5cff', '#ff6548', '#61c454', '#7c3cff'], borderWidth: 0 }]
  };
  const paymentData = {
    labels: chart.paymentModeLabels || [],
    datasets: [
      { label: 'Incoming', data: chart.paymentModeIncoming || [], backgroundColor: '#4a5cff', borderRadius: 4 },
      { label: 'Outgoing', data: chart.paymentModeOutgoing || [], backgroundColor: '#ff6548', borderRadius: 4 }
    ]
  };
  const productData = {
    labels: (chart.topProducts || []).map((row) => row.name),
    datasets: [{ label: 'Quantity', data: (chart.topProducts || []).map((row) => row.qty), backgroundColor: '#65b9e8', borderRadius: 4 }]
  };

  return (
    <>
      <div className="row g-3 mb-4">
        {cards.map(([label, value, icon]) => (
          <div className="col-md-6 col-xl" key={label}>
            <div className="metric-card h-100"><div className="d-flex justify-content-between align-items-center"><div><p className="text-muted mb-1">{label}</p><h3 className="mb-0">{value ?? 0}</h3></div><div className="icon"><i className={`bi ${icon}`} /></div></div></div>
          </div>
        ))}
      </div>
      <div className="row g-3 mb-4">
        {profitCards.map(([label, value, icon]) => (
          <div className="col-md-6 col-xl-3" key={label}>
            <div className="metric-card h-100"><div className="d-flex justify-content-between align-items-center"><div><p className="text-muted mb-1">{label}</p><h4 className="mb-0">{value}</h4></div><div className="icon"><i className={`bi ${icon}`} /></div></div></div>
          </div>
        ))}
      </div>
      <div className="row g-4 mb-4">
        <div className="col-xl-8">
          <div className="table-panel dashboard-chart-card">
            <h2 className="h5 mb-1">Sales, Purchase, Earning & Expense</h2>
            <p className="text-muted mb-3">Last 7 days business movement</p>
            <div className="admin-chart-frame"><Line data={trendData} options={baseOptions} /></div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="table-panel dashboard-chart-card">
            <h2 className="h5 mb-1">Profit Mix</h2>
            <p className="text-muted mb-3">Monthly income and cost composition</p>
            <div className="admin-chart-frame admin-chart-frame-doughnut"><Doughnut data={profitData} options={{ ...baseOptions, cutout: '62%', scales: {}, plugins: { ...baseOptions.plugins, legend: { position: 'bottom', labels: baseOptions.plugins.legend.labels } } }} /></div>
          </div>
        </div>
        <div className="col-xl-6">
          <div className="table-panel dashboard-chart-card">
            <h2 className="h5 mb-1">Payment Mode</h2>
            <p className="text-muted mb-3">Incoming vs outgoing transactions</p>
            <div className="admin-chart-frame"><Bar data={paymentData} options={baseOptions} /></div>
          </div>
        </div>
        <div className="col-xl-6">
          <div className="table-panel dashboard-chart-card">
            <h2 className="h5 mb-1">Top Selling Products</h2>
            <p className="text-muted mb-3">Quantity sold by product</p>
            <div className="admin-chart-frame"><Bar data={productData} options={{ ...baseOptions, indexAxis: 'y', plugins: { ...baseOptions.plugins, legend: { display: false } } }} /></div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="table-panel p-3">
            <div className="d-flex justify-content-between mb-3"><h2 className="h5 mb-0">Recent Orders</h2><button className="btn btn-sm btn-primary" type="button" onClick={() => setCreateOrderOpen(true)}>Create Order</button></div>
            <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Invoice</th><th>Client</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td>{order.invoice_no}</td><td>{order.client_name}</td><td>{money(order.grand_total)}</td><td><span className="badge text-bg-warning">{order.payment_status}</span></td><td>{order.order_date}</td></tr>)}</tbody></table></div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="table-panel p-3">
            <h2 className="h5 mb-3">Low Stock</h2>
            {data.lowStock.map((product) => <div className="d-flex justify-content-between border-bottom py-2" key={product.id}><span>{product.name}</span><strong>{product.stock_quantity}</strong></div>)}
            {!data.lowStock.length && <p className="text-muted mb-0">No low stock products.</p>}
          </div>
        </div>
      </div>
      <AdminCreateOrderModal open={createOrderOpen} onClose={() => setCreateOrderOpen(false)} onCreated={load} />
    </>
  );
}
