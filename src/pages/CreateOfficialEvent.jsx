// CreateOfficialEvent — old system removed. Redirects to Stride Admin.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateOfficialEvent() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/StrideAdminDashboard', { replace: true });
  }, [navigate]);
  return null;
}