
export const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now,
    dateString: now.toISOString().split('T')[0],
    time: {
      hour: now.getHours(),
      minute: now.getMinutes(),
      hour12: now.getHours() > 12 ? now.getHours() - 12 : now.getHours() === 0 ? 12 : now.getHours(),
      ampm: now.getHours() >= 12 ? 'PM' : 'AM'
    }
  };
};

export const formatTimeString = (hour: number, minute: number) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export const isTimeSlotPast = (hour: number, currentHour: number, currentMinute: number) => {
  return hour < currentHour || (hour === currentHour && currentMinute > 30);
};

export const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};
