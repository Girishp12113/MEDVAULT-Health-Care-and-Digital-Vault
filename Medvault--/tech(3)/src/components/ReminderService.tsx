import { useEffect } from 'react';
import { checkAndSendReminders } from '../services/reminderService';

const REMINDER_CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour

export default function ReminderService() {
  useEffect(() => {
    // Check reminders immediately when component mounts
    checkReminders();

    // Set up periodic checks
    const interval = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const checkReminders = async () => {
    try {
      const remindersSent = await checkAndSendReminders();
      if (remindersSent > 0) {
        console.log(`Sent ${remindersSent} reminder(s)`);
      }
    } catch (error) {
      console.error('Error in reminder service:', error);
    }
  };

  return null; // This component doesn't render anything
}
