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
    <div className="hero">
      <h1 className="hero__title">Smart Recruitment & Interview Management</h1>
      <p className="hero__subtitle">
        SmartHire helps organizations post jobs, screen candidates, and run their interview pipeline end to end.
      </p>

      <div className="hero__status">
        {status === 'loading' && <span className="text-faint">Checking API connection...</span>}
        {status === 'success' && <span className="text-success">API connected: {message}</span>}
        {status === 'error' && <span className="text-error">{message}</span>}
      </div>

      <Button>Browse Jobs</Button>
    </div>
  );
}
