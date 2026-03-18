// Events page — now fully powered by the Stride event system.
// This file redirects all traffic to StrideEvents.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Events() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/StrideEvents', { replace: true });
  }, [navigate]);
  return null;
}