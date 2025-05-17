import { addDays, format } from 'date-fns';

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  notes: string | null;
  reminder_sent?: boolean;
}

export async function checkAndSendReminders() {
  try {
    // Get tomorrow's date
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    // Get appointments from localStorage
    const savedAppointments = localStorage.getItem('appointments');
    const appointments: Appointment[] = savedAppointments ? JSON.parse(savedAppointments) : [];

    // Filter appointments for tomorrow where reminder hasn't been sent
    const tomorrowsAppointments = appointments.filter(
      apt => apt.date === tomorrow && apt.reminder_sent !== true
    );

    // Send reminders for each appointment
    for (const appointment of tomorrowsAppointments) {
      await sendReminder(appointment);
      
      // Update reminder_sent status in localStorage
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointment.id ? { ...apt, reminder_sent: true } : apt
      );
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    }

    return tomorrowsAppointments.length;
  } catch (error) {
    console.error('Error checking reminders:', error);
    throw error;
  }
}

async function sendReminder(appointment: Appointment) {
  try {
    // Since we're using localStorage, we don't have user emails
    // Just log the reminder to console
    console.log(`
      Reminder for appointment tomorrow:
      Doctor: ${appointment.doctor_name}
      Specialty: ${appointment.specialty}
      Date: ${appointment.date}
      Time: ${appointment.time}
      ${appointment.notes ? `Notes: ${appointment.notes}` : ''}
    `);
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw error;
  }
}
