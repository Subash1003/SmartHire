import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/ui/Button';

export default function Home() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      setStatus('loading');
      try {
        const res = await axiosClient.get('/health');
        if (cancelled) return;
        setMessage(res.data.message);
        setStatus('success');
      } catch {
        if (cancelled) return;
        setMessage('Unable to reach the API. Please try again.');
        setStatus('error');
      }
    }

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">
        Smart Recruitment & Interview Management
      </h1>
      <p className="max-w-xl text-gray-600">
        SmartHire helps organizations post jobs, screen candidates, and run their
        interview pipeline end to end.
      </p>

      <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm">
        {status === 'loading' && <span className="text-gray-500">Checking API connection...</span>}
        {status === 'success' && <span className="text-green-600">API connected: {message}</span>}
        {status === 'error' && <span className="text-red-600">{message}</span>}
      </div>

      <Button>Browse Jobs</Button>
    </div>
  );
}
