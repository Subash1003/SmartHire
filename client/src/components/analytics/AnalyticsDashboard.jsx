import { useCallback, useEffect, useState } from 'react';
import PageLoading from '../ui/PageLoading';
import PageError from '../ui/PageError';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { analyticsApi } from '../../api/analyticsApi';
import { STATUS_LABELS } from '../../validators/applicationStatus';
import KpiCard from './KpiCard';

const PRIMARY = '#5e6ad2';
const PRIMARY_HOVER = '#4c56c2';
const FUNNEL_SHADES = ['#c7cbf5', '#a3a9ee', '#7d84e4', '#5e6ad2', '#4c56c2'];
const GRID_COLOR = '#e2e8f0';
const AXIS_COLOR = '#64748b';
const LABEL_COLOR = '#0f172a';

function ChartCard({ title, children, empty }) {
  return (
    <div className="card chart-card">
      <h2 className="chart-card__title">{title}</h2>
      {empty ? <p className="chart-card__empty">Not enough data yet.</p> : children}
    </div>
  );
}

// One shared tooltip renderer so every chart's hover card looks like the
// rest of the app (rounded, bordered, shadowed) instead of Recharts' plain
// default box.
function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip__label">{label}</div>}
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ backgroundColor: entry.color || entry.fill }} />
          <span>{entry.name}</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

// Long job titles would otherwise overflow or force the axis wider than the
// card — truncate the tick label and keep the full title in a native <title>
// tag (hover), on top of the full name already showing in the bar tooltip.
function TruncatedTick({ x, y, payload }) {
  const value = payload.value ?? '';
  const text = value.length > 20 ? `${value.slice(0, 19)}…` : value;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill={AXIS_COLOR}>
      {text}
      {text !== value && <title>{value}</title>}
    </text>
  );
}

export default function AnalyticsDashboard() {
  const [state, setState] = useState({ status: 'loading', overview: null, applications: null, funnel: null, interviews: null });
  const [hoveredPipeline, setHoveredPipeline] = useState(null);
  const [hoveredJob, setHoveredJob] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const [overviewRes, applicationsRes, funnelRes, interviewsRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getApplications(),
        analyticsApi.getHiringFunnel(),
        analyticsApi.getInterviews(),
      ]);
      setState({
        status: 'success',
        overview: overviewRes.data.data,
        applications: applicationsRes.data.data,
        funnel: funnelRes.data.data.funnel,
        interviews: interviewsRes.data.data,
      });
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.status === 'loading') {
    return <PageLoading label="Loading analytics..." />;
  }

  if (state.status === 'error') {
    return <PageError message="Unable to load analytics." onRetry={load} />;
  }

  const { overview, applications, funnel, interviews } = state;
  const pipeline = applications.pipeline.map((p) => ({ ...p, label: STATUS_LABELS[p.status] || p.status }));

  return (
    <div className="analytics">
      <div className="kpi-grid">
        <KpiCard label="Total jobs" value={overview.totalJobs} />
        <KpiCard label="Active jobs" value={overview.activeJobs} />
        <KpiCard label="Total applications" value={overview.totalApplications} />
        <KpiCard label="Shortlisted" value={overview.shortlisted} />
        <KpiCard label="Interviews" value={overview.interviews} />
        <KpiCard label="Selected" value={overview.selected} />
        <KpiCard
          label="Avg. time to hire"
          value={overview.averageTimeToHireDays !== null ? `${overview.averageTimeToHireDays}d` : '—'}
          hint={overview.averageTimeToHireDays === null ? 'No hires yet' : undefined}
        />
      </div>

      <div className="chart-grid">
        <ChartCard title="Applications over time" empty={applications.trend.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={applications.trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name="Applications"
                stroke={PRIMARY}
                strokeWidth={2.5}
                fill="url(#analyticsTrendFill)"
                dot={{ r: 3, strokeWidth: 2, stroke: PRIMARY, fill: '#fff' }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Candidate pipeline" empty={pipeline.length === 0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipeline} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-muted)' }} />
              <Bar
                dataKey="count"
                name="Applications"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                onMouseEnter={(_, index) => setHoveredPipeline(index)}
                onMouseLeave={() => setHoveredPipeline(null)}
              >
                {pipeline.map((entry, index) => (
                  <Cell key={entry.status} fill={index === hoveredPipeline ? PRIMARY_HOVER : PRIMARY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Applications by job" empty={applications.byJob.length === 0}>
          <ResponsiveContainer width="100%" height={Math.max(200, applications.byJob.length * 44)}>
            <BarChart data={applications.byJob} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" width={150} tick={<TruncatedTick />} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-muted)' }} />
              <Bar
                dataKey="count"
                name="Applications"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                onMouseEnter={(_, index) => setHoveredJob(index)}
                onMouseLeave={() => setHoveredJob(null)}
              >
                {applications.byJob.map((entry, index) => (
                  <Cell key={entry.jobId} fill={index === hoveredJob ? PRIMARY_HOVER : PRIMARY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hiring funnel" empty={funnel.every((f) => f.count === 0)}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 0 }} barCategoryGap="24%">
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 12, fill: AXIS_COLOR }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-surface-muted)' }} />
              <Bar dataKey="count" name="Candidates" radius={[0, 6, 6, 0]} maxBarSize={32}>
                {funnel.map((entry, index) => (
                  <Cell key={entry.stage} fill={FUNNEL_SHADES[index % FUNNEL_SHADES.length]} />
                ))}
                <LabelList dataKey="count" position="right" style={{ fill: LABEL_COLOR, fontSize: 12, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Interview analytics">
        <div className="kpi-grid">
          <KpiCard label="Scheduled" value={interviews.scheduled} />
          <KpiCard label="Completed" value={interviews.completed} />
          <KpiCard label="Pending evaluations" value={interviews.pendingEvaluations} />
          <KpiCard
            label="Avg. interview score"
            value={interviews.averageInterviewScore !== null ? `${interviews.averageInterviewScore}/10` : '—'}
            hint={interviews.averageInterviewScore === null ? 'No evaluations yet' : undefined}
          />
        </div>
      </ChartCard>
    </div>
  );
}
