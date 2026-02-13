import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  createdAt: string;
  promisedTime: number; // w minutach
  status: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  createdAt, 
  promisedTime, 
  status 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Debug logging
  console.log('CountdownTimer received:', { createdAt, promisedTime, status });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const orderTime = new Date(createdAt).getTime();
      const currentTime = new Date().getTime();
      const promisedTimeMs = promisedTime * 60 * 1000; // konwersja minut na milisekundy
      const deadline = orderTime + promisedTimeMs;
      const remaining = deadline - currentTime;

      if (remaining <= 0) {
        setIsExpired(true);
        return Math.floor(remaining / 1000); // zwróć ujemną wartość
      }

      return Math.floor(remaining / 1000); // konwersja na sekundy
    };

    const updateTimer = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
    };

    // Aktualizuj timer natychmiast
    updateTimer();

    // Ustaw interwał na aktualizację co 10 sekund
    const interval = setInterval(updateTimer, 10000);

    return () => clearInterval(interval);
  }, [createdAt, promisedTime]);

  // Nie pokazuj timera dla zakończonych zamówień
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const getTimerColor = (): string => {
    if (isExpired) return '#ef4444'; // czerwony
    if (timeLeft <= 300) return '#f59e0b'; // pomarańczowy (5 minut)
    return '#10b981'; // zielony
  };

  const getTimerBackground = (): string => {
    if (isExpired) return '#fef2f2'; // jasny czerwony
    if (timeLeft <= 300) return '#fffbeb'; // jasny pomarańczowy
    return '#f0fdf4'; // jasny zielony
  };

  const getTimerBorder = (): string => {
    if (isExpired) return '#fecaca'; // czerwony border
    if (timeLeft <= 300) return '#fed7aa'; // pomarańczowy border
    return '#bbf7d0'; // zielony border
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '6px',
        fontSize: '0.625rem',
        fontWeight: '600',
        backgroundColor: getTimerBackground(),
        color: getTimerColor(),
        border: `1px solid ${getTimerBorder()}`,
        letterSpacing: '0.025em',
        minWidth: '3rem',
        justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: '0.75rem' }}>
        {isExpired ? '⏰' : '⏱️'}
      </span>
      <span>
        {isExpired ? `-${formatTime(Math.abs(timeLeft))}` : formatTime(timeLeft)}
      </span>
    </div>
  );
};
