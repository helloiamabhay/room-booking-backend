export async function paymentSchema() {
    const paymentTable = `CREATE TABLE IF NOT EXISTS PAYMENT(
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('INITIATED','SUCCESS','FAILED','REFUNDED') DEFAULT 'INITIATED',
    transaction_id VARCHAR(255), -- from PhonePe response
    payment_date TIMESTAMP NULL,
    refund_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )`;
}
