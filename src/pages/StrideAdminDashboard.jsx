import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page is deprecated. Redirect to AdminEvents.
export default function StrideAdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/AdminEvents', { replace: true });
  }, []);
  return null;
}