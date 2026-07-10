'use client';
import { useState, useEffect } from 'react';
export default function SpiritualGatewayModal() {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {}, []);
  const handleClose = () => setIsOpen(false);
  if (!isOpen) return null;
  return (<div>Gerbang Rohani Hari Ini</div>);
}
