import { db } from "../app.js"


export async function bookingSchema() {
    const bookingsTable = `CREATE TABLE IF NOT EXISTS BOOKINGS (
    BOOKING_ID VARCHAR(200) PRIMARY KEY,
    ADMIN_REF_ID VARCHAR(200) NOT NULL,
    ROOM_ID VARCHAR(200) NOT NULL,
    USER_ID VARCHAR(200) DEFAULT NULL,
    ROOM_NO VARCHAR(200) NOT NULL,
    BOOKING_STATUS VARCHAR(10) DEFAULT 'PENDING' CHECK (BOOKING_STATUS IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    PAYMENT_STATUS VARCHAR(10) DEFAULT 'UNPAID' CHECK (PAYMENT_STATUS IN ('UNPAID', 'PAID')),
    PRICE INT NOT NULL,
    PAYMENT_DATE TIMESTAMP DEFAULT NULL,
    AVAILABILITY_DATE DATE NOT NULL
    FOREIGN KEY (ADMIN_REF_ID) REFERENCES ADMINS(ADMIN_ID) ON DELETE CASCADE,
    FOREIGN KEY (ROOM_ID) REFERENCES ROOMS(ROOM_ID) ON DELETE CASCADE,
    FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE SET NULL,
    )`
    const connection = await db.getConnection()
    try {
        await connection.query(bookingsTable)
        connection.release()
        console.log("bookings table created")
    } catch (error) {
        console.error("Error creating bookings table:", error)
    }
}

