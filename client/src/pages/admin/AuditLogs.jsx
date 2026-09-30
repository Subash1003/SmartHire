import { useCallback, useEffect, useState } from 'react';
import { auditLogsApi } from '../../api/auditLogsApi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import FloatingSelect from '../../components/ui/FloatingSelect';
import FloatingInput from '../../components/ui/FloatingInput';
import PageError from '../../components/ui/PageError';
import { AUDIT_ACTION_LABELS, RESOURCE_TYPE_LABELS } from '../../validators/auditLogAction';

const ACTION_OPTIONS = [{ value: '', label: 'All actions' }, ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))];
const RESOURCE_TYPE_OPTIONS = [{ value: '', label: 'All resource types' }, ...Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => ({ value, label }))];

function formatValue(value) {
  if (!value) return null;
  return Object.entries(value)
    .map(([key, val]) => `${key}: ${val}`)
    .join(', ');
}

export default function AuditLogs() {
  const [state, setState] = useState({ status: 'loading', logs: [], pagination: null });
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await auditLogsApi.list({
        page,
        limit: 20,
        action: action || undefined,
        resourceType: resourceType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setState({ status: 'success', logs: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', logs: [], pagination: null });
    }
  }, [page, action, resourceType, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: 'createdAt',
      header: 'Time',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => row.actorId?.name || 'Unknown',
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => AUDIT_ACTION_LABELS[row.action] || row.action,
    },
    {
      key: 'resourceType',
      header: 'Resource',
      render: (row) => RESOURCE_TYPE_LABELS[row.resourceType] || row.resourceType,
    },
    {
      key: 'change',
      header: 'Change',
      render: (row) => (
        <span className="audit-log__value">
          {row.previousValue && <span>{formatValue(row.previousValue)} &rarr; </span>}
          {formatValue(row.newValue)}
        </span>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">Audit logs</h1>

      <div className="filter-row">
        <div className="filter-field">
          <FloatingSelect
            id="actionFilter"
            label="Action"
            labelBg="muted"
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            options={ACTION_OPTIONS}
          />
        </div>
        <div className="filter-field">
          <FloatingSelect
            id="resourceTypeFilter"
            label="Resource type"
            labelBg="muted"
            value={resourceType}
            onChange={(e) => {
              setPage(1);
              setResourceType(e.target.value);
            }}
            options={RESOURCE_TYPE_OPTIONS}
          />
        </div>
        <div className="filter-field">
          <FloatingInput
            id="dateFrom"
            label="From"
            type="date"
            labelBg="muted"
            value={dateFrom}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
          />
        </div>
        <div className="filter-field">
          <FloatingInput
            id="dateTo"
            label="To"
            type="date"
            labelBg="muted"
            value={dateTo}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="card">
        {state.status === 'error' ? (
          <PageError message="Unable to load audit logs." onRetry={load} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={state.logs}
              rowKey="_id"
              loading={state.status === 'loading'}
              emptyMessage="No audit log entries yet."
            />
            {state.pagination && (
              <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
