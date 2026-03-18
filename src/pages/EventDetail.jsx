// EventDetail page — now fully powered by the Stride event system.
// Forwards ?id= param to StrideEventDetail.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventDetail() {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    navigate('/StrideEventDetail' + (id ? `?id=${id}` : ''), { replace: true });
  }, [navigate]);
  return null;
}