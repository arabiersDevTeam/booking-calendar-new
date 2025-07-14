// src/app/api/booking/route.js
import { NextResponse } from 'next/server';
import pool from './db';
import nodemailer from 'nodemailer';






function generateRandomId(length = 30) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}





export async function POST(request) {
  try {
    const { type } = Object.fromEntries(new URL(request.url).searchParams);

    if (type === 'inserting_booking_details') {
      const body = await request.json();
      const {
        username,
        email,
        discppition,
        color,
        whatsapp,
        status = 0,     
        bookeddate,
        bookedtimerange
      } = body;

      if (  !username || !email || !discppition || !color) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const bookingid = generateRandomId(30);

      const [result] = await pool.query(
        `INSERT INTO calenderbooking (bookingid, username, email, discription, color,whatsapp, bookeddate, bookedtimerange, createddate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?,  ?,NOW(), ?)`,
        [bookingid, username, email, discppition, color,whatsapp, bookeddate, bookedtimerange, status]
      );

      return NextResponse.json({
        message: 'Booking inserted successfully',
        email,
        bookingid,
        insertId: result.insertId
      });
    }     




    if (type === 'get_booking_details') {
  try {
    const [bookings] = await pool.query(`SELECT * FROM calenderbooking`);

    return NextResponse.json({
      message: 'Bookings fetched successfully',
      bookings
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
    }
    

if (type === 'update_booking_details') {
    try {
      let body = {};

      // Detect whether we received JSON or FormData
      if (request.headers.get('content-type')?.includes('application/json')) {
        body = await request.json();
      } else {
        const form = await request.formData();
        body = Object.fromEntries(form.entries()); // turns FormData into plain object
      }

      const {
        bookingid,
        username,
        email,
        discppition,        
        color,
        whatsapp,
        bookeddate,
        bookedtimerange
      } = body;

      if (
        !bookingid || !username || !email || !discppition || !color ||
        !whatsapp || !bookeddate || !bookedtimerange
      ) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      await pool.query(
        `UPDATE calenderbooking
         SET username = ?, email = ?, discription = ?, color = ?, whatsapp = ?, bookeddate = ?, bookedtimerange = ?
         WHERE bookingid = ?`,
        [
          username,
          email,
          discppition,
          color,
          whatsapp,
          bookeddate,
          bookedtimerange,
          bookingid
        ]
      );

      return NextResponse.json({ message: 'Booking updated successfully!' });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
    }
    




if (type === 'cancel_booking') {
  try {
    let body = {};

    // Detect and parse body from JSON or FormData
    if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    }

    const { bookingid } = body;

    if (!bookingid) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    // 1. Get booking details before deletion
    const [rows] = await pool.query(
      `SELECT * FROM calenderbooking WHERE bookingid = ?`,
      [bookingid]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = rows[0]; // Get the booking row

    // 2. Send email with booking info
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
       auth: {
      user: 'dilshanwickramaarachchi99@gmail.com',
      pass: 'lqtj loqv aiqz wsty'
    }
    });

    const mailOptions = {
      from: 'dilshanwickramaarachchi99@gmail.com',               // Sender email
      to: 'dasanworkweb@gmail.com',              // Receiver email
      subject: 'Booking Cancelled Notification',
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #dc3545; text-align: center;">📅 Booking Cancelled</h2>
      <p style="font-size: 14px; color: #333;">A booking has just been <strong>cancelled</strong>. Below are the details:</p>

      <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">👤 Username:</td>
          <td style="padding: 8px;">${booking.username}</td>
        </tr>
        <tr style="background-color: #f1f1f1;">
          <td style="padding: 8px; font-weight: bold;">📧 Email:</td>
          <td style="padding: 8px;">${booking.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">📱 WhatsApp:</td>
          <td style="padding: 8px;">${booking.whatsapp}</td>
        </tr>
        <tr style="background-color: #f1f1f1;">
          <td style="padding: 8px; font-weight: bold;">📝 Description:</td>
          <td style="padding: 8px;">${booking.discription}</td>
        </tr>
         
        <tr style="background-color: #f1f1f1;">
          <td style="padding: 8px; font-weight: bold;">📅 Booked Date:</td>
          <td style="padding: 8px;">${booking.bookeddate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">⏰ Time Range:</td>
          <td style="padding: 8px;">${booking.bookedtimerange}</td>
        </tr>
        
      </table>

      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
`

    };

    await transporter.sendMail(mailOptions);

    // 3. Delete the booking
    await pool.query(
      `DELETE FROM calenderbooking WHERE bookingid = ?`,
      [bookingid]
    );

    // 4. Success response
    return NextResponse.json({ message: 'Booking cancelled and email sent successfully.' });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}












  if (type === 'send_booking_email') {
  const body = await request.json();
  const { useremailaddress } = body;

  if (!useremailaddress) {
    return NextResponse.json({ error: 'Missing email address' }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'dilshanwickramaarachchi99@gmail.com',
      pass: 'lqtj loqv aiqz wsty'
    }
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #4285f4;">Arooha : Google Ads Consultation</h2>
      <p><strong>When:</strong> <br> Thursday, July 3, 2025 <br> 12:30pm – 1:00pm (GMT+5:30)</p>
      <p><strong>Who:</strong> <br> you & Varun Manchanda</p>
      <p><strong>Add to calendar:</strong> <a href="#">Click here</a></p>

      <hr style="border: none; border-top: 1px solid #ccc;" />

      <p><strong>This event isn’t in your calendar yet</strong></p>
      <p>Do you want to automatically add this and future invitations from us to your calendar?</p>

      <hr style="border: none; border-top: 1px solid #ccc;" />

      <a href="https://meet.google.com/ita-nfiw-ucv" style="display: inline-block; padding: 10px 20px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 5px;">Join with Google Meet</a>

      <p><strong>Meeting link:</strong> <br> <a href="https://meet.google.com/ita-nfiw-ucv">https://meet.google.com/ita-nfiw-ucv</a></p>
      <p><strong>Join by phone:</strong> <br> (IN) +91 22 7127 9696<br> PIN: 7934499775718</p>
      <p><a href="#">More phone numbers</a></p>

      <hr style="border: none; border-top: 1px solid #ccc;" />
      <p style="font-size: 12px; color: #888;">This is a demo email. Replace with your actual booking details.</p>
    </div>
  `;

  await transporter.sendMail({
    from: '"Booking Team" <dilshanwickramaarachchi99@gmail.com>',
    to: useremailaddress,
    subject: 'Booking Confirmation: Arooha Consultation',
    text: 'You have a new booking for Arooha: Google Ads Consultation on July 3, 2025 at 12:30pm.',
    html: htmlContent
  });

  return NextResponse.json({ message: 'Test email sent successfully' });
}





    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
