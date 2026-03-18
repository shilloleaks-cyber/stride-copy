// Events tab — fully powered by the Stride event system.
// Immediate redirect to StrideEvents so the nav tab still works.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Events() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/StrideEvents', { replace: true });
  }, [navigate]);
  return null;
}