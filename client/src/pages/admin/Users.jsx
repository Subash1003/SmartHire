import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../../api/usersApi';
import { createUserSchema } from '../../validators/user.schema';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <Button onClick={() => setModalOpen(true)}>Add user</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Select
          id="roleFilter"
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          options={ROLE_FILTER_OPTIONS}
        />
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="rounded-lg border border-gray-200 bg-white">
        {state.status === 'error' ? (
          <p className="p-8 text-center text-sm text-red-600">Unable to load users. Please try again.</p>
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
        <form onSubmit={handleSubmit(onCreateUser)} className="flex flex-col gap-4" noValidate>
          <Input id="name" label="Full name" error={errors.name?.message} {...register('name')} />
          <Input id="email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input
            id="password"
            label="Temporary password"
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select id="role" label="Role" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create user'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
