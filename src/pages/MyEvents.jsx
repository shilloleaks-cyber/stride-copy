// MyEvents page — now fully powered by the Stride event system.
// This file redirects all traffic to StrideMyEvents.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyEvents() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/StrideMyEvents', { replace: true });
  }, [navigate]);
  return null;
}