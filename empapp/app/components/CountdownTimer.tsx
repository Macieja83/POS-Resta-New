import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownTimerProps {
  createdAt: string;
  promisedTime?: number; // w minutach, domyślnie 30
  status: string;
}

export function CountdownTimer({ 
  createdAt, 
  promisedTime = 30, 
  status 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

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

    // Ustaw interwał na aktualizację co sekundę dla React Native
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, promisedTime]);

  // Nie pokazuj timera dla zakończonych zamówień
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(Math.abs(seconds) / 3600);
    const minutes = Math.floor((Math.abs(seconds) % 3600) / 60);
    const secs = Math.abs(seconds) % 60;

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
    <View
      style={[
        styles.timerContainer,
        {
          backgroundColor: getTimerBackground(),
          borderColor: getTimerBorder(),
        },
      ]}
    >
      <Text style={styles.timerIcon}>{isExpired ? '⏰' : '⏱️'}</Text>
      <Text style={[styles.timerText, { color: getTimerColor() }]}>
        {isExpired ? `-${formatTime(timeLeft)}` : formatTime(timeLeft)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 60,
    justifyContent: 'center',
  },
  timerIcon: {
    fontSize: 12,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

