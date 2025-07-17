"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import name from "../../public/name.png";
import email from "../../public/email.png";
import whatsapp from "../../public/whatsapp.png";
import service from "../../public/service.png";
import calender from "../../public/calender.png";
import logo from "../../public/logo.png";

import Image from "next/image";

const sriLankaHolidays = [
  "2025-01-13",
  "2025-01-14",
  "2025-02-04",
  "2025-02-12",
  "2025-02-26",
  "2025-03-13",
  "2025-03-31",
  "2025-04-12",
  "2025-04-13",
  "2025-04-14",
  "2025-04-18",
  "2025-05-01",
  "2025-05-12",
  "2025-05-13",
  "2025-06-07",
  "2025-06-10",
  "2025-07-10",
  "2025-08-08",
  "2025-09-05",
  "2025-09-07",
  "2025-10-06",
  "2025-10-20",
  "2025-11-05",
  "2025-12-04",
  "2025-12-25",
];

const EmptyActionBar = () => null;

function CustomDay(props) {
  const { day, ...other } = props;
  const formatted = day.format("YYYY-MM-DD");
  const isHoliday = sriLankaHolidays.includes(formatted);

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        ...(isHoliday && {
          backgroundColor: "#ffe5b4",
          borderRadius: "50%",
          border: "1px solid orange",
          color: "black",
        }),
      }}
    />
  );
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [calendarDate, setCalendarDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBookedPopup, setShowBookedPopup] = useState(false);
  const [animatePopup, setAnimatePopup] = useState(false);

  const [showBookedPopupEmailSent, setShowBookedPopupEmailSent] =
    useState(false);
  const [animatePopupEmailSent, setAnimatePopupEmailSent] = useState(false);

  const [showCancelConfirmPopup, setShowCancelConfirmPopup] = useState(false);
  const [animateCancelConfirmPopup, setAnimateCancelConfirmPopup] =
    useState(false);
  const [pendingCancelBookingId, setPendingCancelBookingId] = useState(null);

  const nameRef = useRef();
  const emailRef = useRef();
  const whatsappRef = useRef();
  const serviceRef = useRef();
  const colorRef = useRef();

  // Track fromTime (string HH:mm) and toTime (calculated)
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  useEffect(() => {
    getBookedDetails();
  }, []);

  const clearForm = () => {
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    if (whatsappRef.current) whatsappRef.current.value = "";
    if (serviceRef.current) serviceRef.current.value = "";
    if (colorRef.current) colorRef.current.value = "#27BDBE";

    setFromTime("");
    setToTime("");
  };

  // When fromTime or selectedDate changes, recalc toTime = fromTime + 1 hour
  useEffect(() => {
    if (!fromTime) {
      setToTime("");
      return;
    }
    const time = dayjs(`${selectedDate} ${fromTime}`, "YYYY-MM-DD HH:mm", true);
    if (!time.isValid()) {
      setToTime("");
      return;
    }
    setToTime(time.add(1, "hour").format("HH:mm"));
  }, [fromTime, selectedDate]);

  // Handle when user clicks a time slot in calendar
  const handleDateClick = (info) => {
    const clickedDateTime = dayjs(info.date);
    setSelectedDate(clickedDateTime.format("YYYY-MM-DD"));
    setFromTime(clickedDateTime.format("HH:mm")); // Set start time to clicked hour and minute
    setIsEditing(false);
    setEditingEventId(null);

    // Instead of clearing everything including times, only clear the input fields but keep times:
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    if (whatsappRef.current) whatsappRef.current.value = "";
    if (serviceRef.current) serviceRef.current.value = "";
    if (colorRef.current) colorRef.current.value = "#00cc66";

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
      const response = await fetch("/api/booking?type=get_booking_details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        const mappedEvents = data.bookings.map((booking) => {
          const [fromTime, toTime] = booking.bookedtimerange.split(" to ");
          return {
            id: booking.bookingid,
            title: `${booking.username} - ${booking.discription}`,
            start: dayjs(
              `${booking.bookeddate} ${fromTime}`,
              "YYYY-MM-DD h:mm A"
            ).toISOString(),
            end: dayjs(
              `${booking.bookeddate} ${toTime}`,
              "YYYY-MM-DD h:mm A"
            ).toISOString(),
            backgroundColor: "transparent",
            borderColor: "transparent",
            editable: false,
            isBooked: true,
            email: booking.email, // <-- required for comparison
            whatsapp: booking.whatsapp, // <-- optional
          };
        });

        setEvents(mappedEvents);
      } else {
        alert(data.error || "Failed to fetch bookings.");
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      alert("An error occurred while fetching bookings.");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const name = nameRef.current.value.trim();
    const email = emailRef.current.value.trim();
    const whatsapp = whatsappRef.current.value.trim();
    const service = serviceRef.current.value.trim();
    const color = colorRef.current.value || "#27BDBE";

    if (!name || !email || !whatsapp || !service || !fromTime) {
      alert("Please fill all fields including start time");
      setIsSubmitting(false);
      return;
    }

    const timeFormat = /^\d{2}:\d{2}$/;
    if (!timeFormat.test(fromTime)) {
      setIsSubmitting(false);
      alert("Invalid start time format. Please use HH:mm.");
      return;
    }

    const startDateTime = dayjs(
      `${selectedDate} ${fromTime}`,
      "YYYY-MM-DD HH:mm",
      true
    );
    const endDateTime = startDateTime.add(1, "hour");

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      setIsSubmitting(false);
      alert("Invalid time format. Please check your time inputs.");
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
      extendedProps: { email, whatsapp },
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
          bookeddate: dayjs(selectedDate).format("YYYY-MM-DD"),
          bookedtimerange: `${dayjs(`${selectedDate} ${fromTime}`).format(
            "h:mm A"
          )} to ${dayjs(
            `${selectedDate} ${endDateTime.format("HH:mm")}`
          ).format("h:mm A")}`,
        });
      } else {
        // 👉 Create new booking
        const response = await fetch(
          "/api/booking?type=inserting_booking_details",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: name,
              email,
              discppition: service,
              color,
              whatsapp,
              status: 0,
              bookeddate: dayjs(selectedDate).format("YYYY-MM-DD"),
              bookedtimerange: `${dayjs(`${selectedDate} ${fromTime}`).format(
                "h:mm A"
              )} to ${dayjs(
                `${selectedDate} ${endDateTime.format("HH:mm")}`
              ).format("h:mm A")}`,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          sessionStorage.setItem("useremailaddress", data.email);

          const response2 = await fetch(
            "/api/booking?type=send_booking_email",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ useremailaddress: data.email }),
            }
          );

          const emailData = await response2.json();

          if (response2.ok) {
            getBookedDetails();
            setShowBookedPopupEmailSent(true);
            setTimeout(() => setAnimatePopupEmailSent(true), 10); // trigger animation
          } else {
            alert(emailData.error || "Failed to send email.");
          }
        } else {
          alert(data.error || "Failed to book appointment.");
        }
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("An error occurred while processing the booking.");
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

    const response = await fetch("/api/booking?type=update_booking_details", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      sessionStorage.setItem("useremailaddress", updateData.email);
      getBookedDetails();
      alert(data.message || "Booking updated successfully!");
      sessionStorage.removeItem("useremailaddress");
    } else {
      alert(data.error || "Failed to update booking.");
    }
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const storedEmail = sessionStorage.getItem("useremailaddress");

    // If it's a booked slot, check if the user owns it
    if (event.extendedProps.isBooked) {
      const eventEmail = event.extendedProps.email;

      if (!storedEmail || !eventEmail || storedEmail !== eventEmail) {
        // Show animated popup instead of alert
        setShowBookedPopup(true);

        // Trigger entrance animation
        setTimeout(() => setAnimatePopup(true), 10);

        return;
      }
    }

    const [name, service] = event.title.split(" - ");
    const startDate = dayjs(event.start);
    const endDate = dayjs(event.end);
    const color = event.backgroundColor || "#00cc66";

    setSelectedDate(startDate.format("YYYY-MM-DD"));
    setFromTime(startDate.format("HH:mm"));
    setIsEditing(true);
    setEditingEventId(event.id);
    setShowModal(true);

    setTimeout(() => {
      if (nameRef.current) nameRef.current.value = name || "";
      if (serviceRef.current) serviceRef.current.value = service || "";
      if (colorRef.current) colorRef.current.value = color;
      if (emailRef.current)
        emailRef.current.value = event.extendedProps.email || "";
      if (whatsappRef.current)
        whatsappRef.current.value = event.extendedProps.whatsapp || "";
    }, 0);
  };

  const renderEventContent = (eventInfo) => {
    if (eventInfo.event.extendedProps.isBooked) {
      return (
        <div
          style={{
            backgroundColor: "#FDCD96",
            color: "white",
            padding: "4px 6px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "0.85em",
            textAlign: "center",
            width: "100%",
            height: "100%",
          }}
        ></div>
      );
    }

    return (
      <div>
        <b>{eventInfo.timeText}</b> <br />
        <span>{eventInfo.event.title}</span>
      </div>
    );
  };

  const handleShowCancelPopup = () => {
    if (!editingEventId) return;
    closeModal();
    setPendingCancelBookingId(editingEventId);
    setShowCancelConfirmPopup(true);
  };

  const handleCancelBooking = async () => {
    if (!pendingCancelBookingId) return;

    // alert(pendingCancelBookingId);

    try {
      const response = await fetch("/api/booking?type=cancel_booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingid: pendingCancelBookingId }),
      });

      const data = await response.json();

      if (response.ok) {
        getBookedDetails();
        setEvents(
          events.filter((event) => event.id !== pendingCancelBookingId)
        );
        closeModal();
      } else {
        alert(data.error || "Failed to cancel booking.");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("An error occurred while cancelling the booking.");
    } finally {
      setShowCancelConfirmPopup(false);
      setPendingCancelBookingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-3">
      <div className="pb-4 px-3 ">
        <Image src={logo} alt="logo" width="220" />
      </div>
      {showBookedPopupEmailSent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
          <div
            className={`bg-white rounded-xl shadow-lg transform transition-all duration-300 ${
              animatePopupEmailSent
                ? "opacity-100 scale-100"
                : "opacity-0 scale-90"
            } max-w-sm w-full p-6 relative`}
          >
            <button
              className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center text-xl text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200 shadow-sm cursor-pointer"
              onClick={() => {
                setAnimatePopupEmailSent(false);
                setTimeout(() => setShowBookedPopupEmailSent(false), 300);
              }}
              aria-label="Close popup"
            >
              &times;
            </button>

            <div className="text-center text-lg font-semibold text-green-600">
              Email sent successfully!
            </div>
          </div>
        </div>
      )}

      {showBookedPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm z-50 ">
          <div
            className={`bg-white rounded-xl shadow-lg transform transition-all duration-300 ${
              animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"
            } max-w-sm w-full p-6 relative`}
          >
            <button
              className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center text-xl text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200 shadow-sm cursor-pointer"
              onClick={() => {
                setAnimatePopup(false);
                setTimeout(() => setShowBookedPopup(false), 300); // Match duration
              }}
              aria-label="Close popup"
            >
              &times;
            </button>

            <div className="text-center text-lg font-semibold text-gray-800">
              This time slot is already booked.
            </div>
          </div>
        </div>
      )}

      {showCancelConfirmPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            {/* Close (X) Button */}
            <button
              className="absolute top-3 right-3 w-8 h-8 text-xl text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200"
              onClick={() => setShowCancelConfirmPopup(false)}
              aria-label="Close"
            >
              &times;
            </button>

            {/* Confirmation Message */}
            <div className="text-center text-lg font-semibold text-gray-800 mb-6">
              Are you sure you want to cancel this booking?
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleCancelBooking}
                className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-200 cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowCancelConfirmPopup(false)}
                className="px-5 py-2.5 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition duration-200 cursor-pointer"
              >
                No, Keep It
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap">
        <div className="w-full lg:w-4/14 px-3">
          {/* current date */}
          <input
            type="text"
            value="Thursday, 3rd July"
            placeholder="Current Date"
            className="w-full px-3 py-3 mb-4 border border-[#D9D9D9] rounded-lg outline-none"
          />
          {/* calender */}
          <div className="border border-[#D9D9D9] rounded-lg px-3">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={dayjs(selectedDate)}
                onChange={(newDate) => {
                  if (!newDate || !newDate.isValid()) return;
                  const formattedDate = newDate.format("YYYY-MM-DD");
                  setSelectedDate(formattedDate);
                  setCalendarDate(formattedDate);
                }}
                minDate={dayjs()} // <-- Disable dates before today
                slotProps={{ textField: { variant: "standard" } }}
                slots={{
                  actionBar: EmptyActionBar, // Remove OK/Cancel buttons
                  day: CustomDay,
                }}
              />
            </LocalizationProvider>

            {/* calender event status */}
            <div className=" flex items-center gap-4 mt-2 mb-4">
              <div className=" flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#27BDBE]"></div>
                <span className=" block text-[12px]">Today</span>
              </div>
              <div className=" flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-black"></div>
                <span className=" block text-[12px]">Selected Date</span>
              </div>
              <div className=" flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#F5F5F5] relative">
                  <div className=" w-1 h-1 bg-[#27BDBE] rounded-full absolute left-1/2 bottom-1 -translate-x-1/2"></div>
                </div>
                <span className=" block text-[12px]">Holidays</span>
              </div>
            </div>
          </div>

          {/* slot status */}
          <div className="border border-[#D9D9D9] rounded-lg p-4 mt-4">
            <h2 className=" font-extrabold ">Slot Status</h2>

            <div className="flex items-center gap-2 mt-2 mb-1.5">
              <div className="w-[61px] h-[37px] bg-[rgba(39,189,190,0.37)] border-2 border-[#27BDBE] rounded-lg"></div>
              <div>
                <span className=" block text-sm font-bold leading-4">
                  Currently Selected
                </span>
                <span className=" block text-[12px]">
                  The time slot you are about to book.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-[61px] h-[37px] bg-[#27BDBE] border-2 border-[#77EAEB] rounded-lg"></div>
              <div>
                <span className=" block text-sm font-bold leading-4">
                  Your Booking
                </span>
                <span className=" block text-[12px]">
                  You have already booked this time slot.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-[61px] h-[37px] bg-[#FDCD96] border-2 border-[#F79420] rounded-lg"></div>
              <div>
                <span className=" block text-sm font-bold leading-4">
                  Not Available
                </span>
                <span className=" block text-[12px]">
                  This slot is fully booked or blocked.
                </span>
              </div>
            </div>
          </div>

          {/* note */}
          <div className="border border-[#D9D9D9] rounded-lg p-4 mt-4">
            <h2 className=" font-extrabold ">Note</h2>
            <p className="text-sm mt-0.5">
              Lorem Ipsum is simply the dummy text for print shops and text
              files.
            </p>
          </div>
        </div>
        <div className="w-full lg:w-10/14 px-3">
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
            validRange={{ start: dayjs().format("YYYY-MM-DD") }}
            allDaySlot={false}
            headerToolbar={false}
            dayHeaderContent={(args) => {
              const date = args.date;
              const weekday = date.toLocaleDateString("en-US", {
                weekday: "short",
              }); // Sun
              const day = date.getDate(); // 20
              return (
                <div style={{ textAlign: "center" }}>
                  <div>{weekday}</div>
                  <div>{day}</div>
                </div>
              );
            }}
          />

          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm transition-opacity duration-300 ">
              <div className="bg-white rounded-[30px] w-full max-w-md px-5 py-[20px] relative border border-[#D9D9D9] shadow-lg transform transition-all duration-300 translate-y-4 opacity-0 animate-fadeInUp">
                <button
                  className=" ml-auto cursor-pointer w-9 h-9 flex items-center justify-center text-xl text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full transition duration-200 shadow-sm mb-4"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  &times;
                </button>

                <div className="mb-4">
                  <div className=" flex gap-2 items-center flex-wrap">
                    <div className=" bg-[#F5F5F5] p-2.5 rounded-lg text-[#2A2F3B]">
                      {dayjs(selectedDate).format("dddd, Do MMMM")}
                    </div>

                    <div className=" bg-[#F5F5F5] p-2.5 rounded-lg text-[#2A2F3B]">
                      {fromTime
                        ? dayjs(
                            `${selectedDate} ${fromTime}`,
                            "YYYY-MM-DD HH:mm"
                          ).format("h:mm A")
                        : ""}
                    </div>
                    <span>to</span>
                    <div className=" bg-[#F5F5F5] p-2.5 rounded-lg text-[#2A2F3B]">
                      {toTime
                        ? dayjs(
                            `${selectedDate} ${toTime}`,
                            "YYYY-MM-DD HH:mm"
                          ).format("h:mm A")
                        : ""}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-2 text-sm font-medium bg-red-500/10 text-red-500 italic p-2.5 rounded-lg text-center">
                      This is a one-time update.
                    </div>
                  )}
                </div>

                <form onSubmit={handleBooking}>
                  <label
                    htmlFor="name"
                    className=" block text-sm font-semibold mb-1 text-black"
                  >
                    Name
                  </label>
                  <div className="flex items-center gap-1 w-full border border-[#D9D9D9] rounded-[5px] p-2.5">
                    <Image src={name} alt="name" width="25" />
                    <input
                      ref={nameRef}
                      placeholder="Name"
                      type="text"
                      className="border-none outline-none w-full placeholder:text-[#D9D9D9] placeholder:font-medium"
                      required
                      name="name"
                    />
                  </div>

                  <label
                    htmlFor="name"
                    className=" block text-sm font-semibold mb-1 mt-4 text-black"
                  >
                    Email
                  </label>
                  <div className="flex items-center gap-1 w-full border border-[#D9D9D9] rounded-[5px] p-2.5">
                    <Image src={email} alt="email" width="25" />
                    <input
                      ref={emailRef}
                      placeholder="Email"
                      type="email"
                      name="email"
                      className="border-none outline-none w-full placeholder:text-[#D9D9D9] placeholder:font-medium"
                      required
                    />
                  </div>

                  <label
                    htmlFor="whatsapp"
                    className=" block text-sm font-semibold mb-1 mt-4 text-black"
                  >
                    Whatsapp Number
                  </label>
                  <div className="flex items-center gap-1 w-full border border-[#D9D9D9] rounded-[5px] p-2.5">
                    <Image src={whatsapp} alt="whatsapp" width="25" />
                    <input
                      ref={whatsappRef}
                      placeholder="WhatsApp Number"
                      name="whatsapp"
                      type="tel"
                      className="border-none outline-none w-full placeholder:text-[#D9D9D9] placeholder:font-medium"
                      required
                    />
                  </div>

                  <label
                    htmlFor="service"
                    className=" block text-sm font-semibold mb-1 mt-4 text-black"
                  >
                    Which Service intended to discuss
                  </label>
                  <div className="flex items-start gap-1 w-full border border-[#D9D9D9] rounded-[5px] p-2.5">
                    <Image src={service} alt="service" width="25" />
                    <textarea
                      ref={serviceRef}
                      placeholder="Which Service intended to discuss"
                      className="border-none outline-none w-full placeholder:text-[#D9D9D9] placeholder:font-medium"
                      name="service"
                      rows={5}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4 bg-[#F5F5F5] py-[5px] px-2.5 w-fit rounded-[30px] border border-[#D9D9D9]">
                    <label className="block text-sm font-semibold  text-black">
                      Pick Color
                    </label>
                    <input
                      ref={colorRef}
                      type="color"
                      className="w-6 h-6 border rounded-full"
                      defaultValue="#27BDBE"
                    />
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`${
                        isEditing ? "bg-blue-600 w-1/3" : "bg-black"
                      } text-white p-2 rounded-[35px] cursor-pointer flex gap-2 justify-center items-center font-bold disabled:opacity-50 disabled:cursor-not-allowed w-1/2`}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : isEditing
                        ? "Update"
                        : "Book"}
                      <Image src={calender} alt="calender" width="28" />
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className={`${
                        isEditing ? "w-1/3" : "w-1/2"
                      } bg-[#D9D9D9] p-2 rounded-[35px] cursor-pointer font-bold`}
                    >
                      Cancel
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleShowCancelPopup}
                        className="bg-red-600 text-white p-2 rounded-[35px] cursor-pointer font-bold w-1/3 leading-5"
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
      </div>
    </div>
  );
}
