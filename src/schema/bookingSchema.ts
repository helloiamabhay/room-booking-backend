import { db } from "../app.js";

export async function bookingSchema() {
  const bookingsTable = `
    CREATE TABLE IF NOT EXISTS BOOKINGS (
      BOOKING_ID VARCHAR(200) PRIMARY KEY,
      ADMIN_REF_ID VARCHAR(200) NOT NULL,
      ROOM_ID VARCHAR(200) NOT NULL,
      USER_ID VARCHAR(200) DEFAULT NULL,
      ROOM_NO VARCHAR(200) NOT NULL,
      BOOKING_STATUS ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
      PAYMENT_STATUS ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID',
      PRICE INT NOT NULL,
      PAYMENT_DATE TIMESTAMP DEFAULT NULL,
      AVAILABILITY_DATE DATE DEFAULT NULL,
      FOREIGN KEY (ADMIN_REF_ID) REFERENCES admins(ADMIN_ID) ON DELETE CASCADE,
      FOREIGN KEY (ROOM_ID) REFERENCES rooms(ROOM_ID) ON DELETE CASCADE,
      FOREIGN KEY (USER_ID) REFERENCES users(userId) ON DELETE SET NULL
    )
  `;

  const connection = await db.getConnection();
  try {
    await connection.query(bookingsTable);
    connection.release();
    console.log("bookings table created");
  } catch (error) {
    console.error("Error creating bookings table:", error);
  }
}
