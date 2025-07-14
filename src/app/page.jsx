'use client';

import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [calendarDate, setCalendarDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef();
  const emailRef = useRef();
  const whatsappRef = useRef();
  const serviceRef = useRef();
  const colorRef = useRef();

  // Track fromTime (string HH:mm) and toTime (calculated)
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');





    useEffect(() => {
    getBookedDetails();
    }, []);
  


  
  
  

  const clearForm = () => {
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (whatsappRef.current) whatsappRef.current.value = '';
    if (serviceRef.current) serviceRef.current.value = '';
    if (colorRef.current) colorRef.current.value = '#00cc66';

    setFromTime('');
    setToTime('');
  };

  // When fromTime or selectedDate changes, recalc toTime = fromTime + 1 hour
  useEffect(() => {
    if (!fromTime) {
      setToTime('');
      return;
    }
    const time = dayjs(`${selectedDate} ${fromTime}`, 'YYYY-MM-DD HH:mm', true);
    if (!time.isValid()) {
      setToTime('');
      return;
    }
    setToTime(time.add(1, 'hour').format('HH:mm'));
  }, [fromTime, selectedDate]);

  // Handle when user clicks a time slot in calendar
  const handleDateClick = (info) => {
  const clickedDateTime = dayjs(info.date);
  setSelectedDate(clickedDateTime.format('YYYY-MM-DD'));
  setFromTime(clickedDateTime.format('HH:mm')); // Set start time to clicked hour and minute
  setIsEditing(false);
  setEditingEventId(null);

  // Instead of clearing everything including times, only clear the input fields but keep times:
  if (nameRef.current) nameRef.current.value = '';
  if (emailRef.current) emailRef.current.value = '';
  if (whatsappRef.current) whatsappRef.current.value = '';
  if (serviceRef.current) serviceRef.current.value = '';
  if (colorRef.current) colorRef.current.value = '#00cc66';

  setShowModal(true);
};





 

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingEventId(null);
    clearForm();
  };

  



const getBookedDetails = async () => {
  try {
    const response = await fetch('/api/booking?type=get_booking_details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await response.json();

    if (response.ok) {
      const mappedEvents = data.bookings.map((booking) => {
        const [fromTime, toTime] = booking.bookedtimerange.split(' to ');
        return {
          id: booking.bookingid,
          title: `${booking.username} - ${booking.discription}`,
          start: dayjs(`${booking.bookeddate} ${fromTime}`, 'YYYY-MM-DD h:mm A').toISOString(),
          end: dayjs(`${booking.bookeddate} ${toTime}`, 'YYYY-MM-DD h:mm A').toISOString(),
          backgroundColor: 'transparent',
           borderColor: 'transparent',
          editable: false,
          isBooked: true,
          email: booking.email, // <-- required for comparison
          whatsapp: booking.whatsapp // <-- optional
        };

      });

      setEvents(mappedEvents);
    } else {
      alert(data.error || 'Failed to fetch bookings.');
    }
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    alert('An error occurred while fetching bookings.');
  }
};

  const handleCancelBooking = async () => {
  if (!editingEventId) return;

  const confirmed = window.confirm('Are you sure you want to cancel this booking?');
  if (!confirmed) return;

  try {
    const response = await fetch('/api/booking?type=cancel_booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingid: editingEventId })
    });

    const data = await response.json();

    if (response.ok) {
      getBookedDetails();
      setEvents(events.filter(event => event.id !== editingEventId));
      closeModal();

    } else {
      alert(data.error || 'Failed to cancel booking.');
    }
  } catch (error) {
    console.error('Cancel error:', error);
    alert('An error occurred while cancelling the booking.');
  }
};


const handleBooking = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  const name = nameRef.current.value.trim();
  const email = emailRef.current.value.trim();
  const whatsapp = whatsappRef.current.value.trim();
  const service = serviceRef.current.value.trim();
  const color = colorRef.current.value || '#00cc66';

  if (!name || !email || !whatsapp || !service || !fromTime) {
    alert('Please fill all fields including start time');
    setIsSubmitting(false);
    return;
  }

  const timeFormat = /^\d{2}:\d{2}$/;
  if (!timeFormat.test(fromTime)) {
    setIsSubmitting(false);
    alert('Invalid start time format. Please use HH:mm.');
    return;
  }

  const startDateTime = dayjs(`${selectedDate} ${fromTime}`, 'YYYY-MM-DD HH:mm', true);
  const endDateTime = startDateTime.add(1, 'hour');

  if (!startDateTime.isValid() || !endDateTime.isValid()) {
    setIsSubmitting(false);
    alert('Invalid time format. Please check your time inputs.');
    return;
  }

  const title = `${name} - ${service}`;
  const newEvent = {
    id: isEditing && editingEventId ? editingEventId : String(Date.now()),
    title,
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    backgroundColor: color,
    borderColor: color,
    extendedProps: { email, whatsapp }
  };

  // Update events in UI
  if (isEditing && editingEventId) {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === editingEventId ? newEvent : event
      )
    );
  } else {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  }

  try {
    if (isEditing && editingEventId) {
      // 👉 Call update method here if editing
      await updateBookingDetails({
        bookingid: editingEventId,
        username: name,
        email,
        discppition: service,
        color,
        whatsapp,
        bookeddate: dayjs(selectedDate).format('YYYY-MM-DD'),
        bookedtimerange: `${dayjs(`${selectedDate} ${fromTime}`).format('h:mm A')} to ${dayjs(`${selectedDate} ${endDateTime.format('HH:mm')}`).format('h:mm A')}`
      });
    } else {
      // 👉 Create new booking
      const response = await fetch('/api/booking?type=inserting_booking_details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name,
          email,
          discppition: service,
          color,
          whatsapp,
          status: 0,
          bookeddate: dayjs(selectedDate).format('YYYY-MM-DD'),
          bookedtimerange: `${dayjs(`${selectedDate} ${fromTime}`).format('h:mm A')} to ${dayjs(`${selectedDate} ${endDateTime.format('HH:mm')}`).format('h:mm A')}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem('useremailaddress', data.email);

        const response2 = await fetch('/api/booking?type=send_booking_email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useremailaddress: data.email })
        });

        const emailData = await response2.json();

        if (response2.ok) {
          getBookedDetails();
          alert(emailData.message || 'Email sent successfully!');
        } else {
          alert(emailData.error || 'Failed to send email.');
        }
      } else {
        alert(data.error || 'Failed to book appointment.');
      }
    }

  } catch (error) {
    console.error('Booking failed:', error);
    alert('An error occurred while processing the booking.');
  }

  setIsSubmitting(false);
  setCalendarDate(selectedDate);
  closeModal();
};

  
  
const updateBookingDetails = async (updateData) => {
  const formData = new FormData();
  Object.entries(updateData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch('/api/booking?type=update_booking_details', {
    method: 'POST',
    body: formData      
  });

  const data = await response.json();

  if (response.ok) {
    sessionStorage.setItem('useremailaddress', updateData.email);
    getBookedDetails();
    alert(data.message || 'Booking updated successfully!');
    sessionStorage.removeItem('useremailaddress');
  } else {
    alert(data.error || 'Failed to update booking.');
  }
};

  
  
  
  
const handleEventClick = (info) => {
  const event = info.event;
  const storedEmail = sessionStorage.getItem('useremailaddress');

  // If it's a booked slot, check if the user owns it
  if (event.extendedProps.isBooked) {
    const eventEmail = event.extendedProps.email;

    if (storedEmail && eventEmail && storedEmail === eventEmail) {
      // User owns this booking — allow editing
    } else {
      // Someone else's booking — block access
      alert('This time slot is already booked.');
      return;
    }
  }

  const [name, service] = event.title.split(' - ');
  const startDate = dayjs(event.start);
  const endDate = dayjs(event.end);
  const color = event.backgroundColor || '#00cc66';

  setSelectedDate(startDate.format('YYYY-MM-DD'));
  setFromTime(startDate.format('HH:mm'));
  setIsEditing(true);
  setEditingEventId(event.id);
  setShowModal(true);

  setTimeout(() => {
    if (nameRef.current) nameRef.current.value = name || '';
    if (serviceRef.current) serviceRef.current.value = service || '';
    if (colorRef.current) colorRef.current.value = color;
    if (emailRef.current) emailRef.current.value = event.extendedProps.email || '';
    if (whatsappRef.current) whatsappRef.current.value = event.extendedProps.whatsapp || '';
  }, 0);
};

  
const renderEventContent = (eventInfo) => {
  if (eventInfo.event.extendedProps.isBooked) {
    return (
      <div style={{
        backgroundColor: 'red',
        color: 'white',
        padding: '4px 6px',
        borderRadius: '4px',
        fontWeight: 'bold',
        fontSize: '0.85em',
        textAlign: 'center'
      }}>
        Booked
      </div>
    );
  }

  return (
    <div>
      <b>{eventInfo.timeText}</b> <br />
      <span>{eventInfo.event.title}</span>
    </div>
  );
};


  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Weekly Booking Calendar</h1>

      <div className="mb-6">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
  <StaticDatePicker
    displayStaticWrapperAs="desktop"
    value={dayjs(selectedDate)}
    onChange={(newDate) => {
      if (!newDate || !newDate.isValid()) return;
      const formattedDate = newDate.format('YYYY-MM-DD');
      setSelectedDate(formattedDate);
      setCalendarDate(formattedDate);
    }}
    minDate={dayjs()}  // <-- Disable dates before today
    slotProps={{ textField: { variant: 'standard' } }}
  />
</LocalizationProvider>

      </div>

      <FullCalendar
        key={calendarDate}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        weekends={true}
        events={events}
        eventContent={renderEventContent}
        height="auto"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDisplay="block"
        initialDate={calendarDate}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        slotDuration="01:00:00"
        validRange={{ start: dayjs().format('YYYY-MM-DD') }}
      />

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
  <div className="bg-white rounded-xl w-full max-w-sm p-6 relative shadow-lg">
    <button
      className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
      onClick={closeModal}
      aria-label="Close modal"
    >
      &times;
    </button>

<div className="mb-4 text-sm text-gray-600">
  <strong>{dayjs(selectedDate).format('dddd, MMMM D, YYYY')}</strong>

  <div className="mt-1 text-sm">
    Booking your meeting from{' '}
    <b>{fromTime ? dayjs(`${selectedDate} ${fromTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A') : ''}</b>
    {' '}to{' '}
    <b>{toTime ? dayjs(`${selectedDate} ${toTime}`, 'YYYY-MM-DD HH:mm').format('h:mm A') : ''}</b>
  </div>

  {isEditing && (
    <div className="mt-2 text-xs text-red-500 italic">
      This is a one-time update.
    </div>
  )}
</div>


    <form onSubmit={handleBooking} className="flex flex-col gap-3 text-sm">
      <input
        ref={nameRef}
        placeholder="Name"
        className="border rounded px-3 py-2"
        required
      />
      <input
        ref={emailRef}
        placeholder="Email"
        type="email"
        className="border rounded px-3 py-2"
        required
      />
      <input
        ref={whatsappRef}
        placeholder="WhatsApp Number"
        className="border rounded px-3 py-2"
        required
      />
      <textarea
        ref={serviceRef}
        placeholder="Which Service intended to discuss"
        className="border rounded px-3 py-2 h-20"
        required
      />
      <div className="flex items-center gap-2">
        <label className="text-gray-700">Pick Color:</label>
        <input
          ref={colorRef}
          type="color"
          className="w-6 h-6 border rounded-full"
          defaultValue="#00cc66"
        />
      </div>
      <div className="flex justify-between mt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${isEditing ? 'bg-blue-600' : 'bg-black'} text-white px-4 py-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? 'Processing...' : isEditing ? 'Update' : 'Book 📅'}
        </button>
        <button
          type="button"
          onClick={closeModal}
          className="bg-gray-200 px-4 py-2 rounded-full cursor-pointer"
        >
          Cancel
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={handleCancelBooking}
            className="bg-red-600 text-white px-4 py-2 rounded-full cursor-pointer"
          >
            Cancel Booking
          </button>
        )}
      </div>
    </form>
  </div>
</div>

      )}
    </div>
  );
}
