import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RunDetails() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('History'), { replace: true });
  }, []);
  return null;
}