import { db } from "../app.js";
export async function paymentSchema() {
    const paymentTable = `CREATE TABLE IF NOT EXISTS PAYMENTS(
    PAYMENT_ID VARCHAR(200) PRIMARY KEY,
    USER_ID VARCHAR(200) NOT NULL,
    ROOM_ID VARCHAR(200) NOT NULL,
    ORDER_ID VARCHAR(255) UNIQUE NOT NULL,
    AMOUNT DECIMAL(10,2) NOT NULL,
    PAYMENT_STATUS ENUM('INITIATED','COMPLETED','FAILED','REFUNDED') DEFAULT 'INITIATED',
    TRANSACTION_ID VARCHAR(200) DEFAULT NULL,
    PAYMENT_DATE TIMESTAMP DEFAULT NULL,
    REFUND_DATE TIMESTAMP DEFAULT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (USER_ID) REFERENCES users(userId),
    FOREIGN KEY (ROOM_ID) REFERENCES rooms(ROOM_ID)
    )`;
    const connection = await db.getConnection();
    try {
        await connection.query(paymentTable);
        connection.release();
        console.log("Payment table created successfully");
    }
    catch (error) {
        connection.release();
        console.error("Error creating payment table:", error);
    }
}
