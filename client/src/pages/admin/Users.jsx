import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { usersApi } from '../../api/usersApi';
import { createUserSchema } from '../../validators/user.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import FloatingInput from '../../components/ui/FloatingInput';
import FloatingSelect from '../../components/ui/FloatingSelect';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'interviewer', label: 'Interviewer' },
];

const ROLE_FILTER_OPTIONS = [{ value: '', label: 'All roles' }, ...ROLE_OPTIONS, { value: 'candidate', label: 'Candidate' }];

export default function AdminUsers() {
  const [state, setState] = useState({ status: 'loading', users: [], pagination: null });
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(createUserSchema) });

  const loadUsers = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await usersApi.list({ page, limit: 20, role: roleFilter || undefined, search: search || undefined });
      setState({ status: 'success', users: res.data.data, pagination: res.data.pagination });
    } catch {
      setState({ status: 'error', users: [], pagination: null });
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onCreateUser = async (values) => {
    setFormError('');
    try {
      await usersApi.create(values);
      reset();
      setModalOpen(false);
      setPage(1);
      loadUsers();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Unable to create user.'));
    }
  };

  const toggleStatus = async (user) => {
    setActionError('');
    try {
      await usersApi.updateStatus(user._id, !user.isActive);
      loadUsers();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to update user status.'));
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <span className="capitalize">{row.role}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (row.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="secondary" onClick={() => toggleStatus(row)}>
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">Users</h1>
        <Button onClick={() => setModalOpen(true)}>Add user</Button>
      </div>

      <div className="filter-row">
        <div className="filter-field--wide">
          <FloatingInput
            id="userSearch"
            label="Search by name or email"
            type="search"
            icon={Search}
            labelBg="muted"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="filter-field">
          <FloatingSelect
            id="roleFilter"
            label="Role"
            labelBg="muted"
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            options={ROLE_FILTER_OPTIONS}
          />
        </div>
      </div>

      {actionError && <p className="text-error">{actionError}</p>}

      <div className="card">
        {state.status === 'error' ? (
          <p className="table-error">Unable to load users. Please try again.</p>
        ) : (
          <>
            <DataTable columns={columns} rows={state.users} rowKey="_id" loading={state.status === 'loading'} />
            {state.pagination && (
              <Pagination page={state.pagination.page} totalPages={state.pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add user">
        <form onSubmit={handleSubmit(onCreateUser)} className="stack stack--gap-4" noValidate>
          <FloatingInput id="name" label="Full name" error={errors.name?.message} {...register('name')} />
          <FloatingInput id="email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <FloatingInput
            id="password"
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <FloatingSelect id="role" label="Role" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />

          {formError && <p className="text-error">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="btn--block">
            {isSubmitting ? 'Creating...' : 'Create user'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
