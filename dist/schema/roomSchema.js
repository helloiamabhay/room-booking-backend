import { db } from "../app.js";
export async function roomSchema() {
    const roomTable = `CREATE TABLE IF NOT EXISTS ROOMS(
        ROOM_ID VARCHAR(200) PRIMARY KEY NOT NULL UNIQUE,
        ADMIN_REF_ID VARCHAR(200) NOT NULL,
        PRICE INT NOT NULL,
        LOCALITY VARCHAR(40) NOT NULL,
        DISTRICT VARCHAR(25) NOT NULL,
        LATITUDE DECIMAL(10, 8) DEFAULT NULL,
        LONGITUDE DECIMAL(11, 8) DEFAULT NULL,
        RATING FLOAT DEFAULT 0,
        RATING_COUNT_USER INT DEFAULT 0,
        ROOM_STATUS VARCHAR(5) NOT NULL CHECK (ROOM_STATUS IN ('TRUE', 'FALSE')),
        BED VARCHAR(6) NOT NULL CHECK (BED IN ('DOUBLE', 'SINGLE', 'NO')),
        BED_SIT VARCHAR(3) NOT NULL CHECK (BED_SIT IN ('YES', 'NO')),
        TOILET VARCHAR(3) NOT NULL CHECK (TOILET IN ('YES', 'NO')),
        BATHROOM VARCHAR(3) NOT NULL CHECK (BATHROOM IN ('YES', 'NO')),
        FAN VARCHAR(3) NOT NULL CHECK (FAN IN ('YES', 'NO')),
        KITCHEN VARCHAR(3) NOT NULL CHECK (KITCHEN IN ('YES', 'NO')),
        TABLE_CHAIR VARCHAR(3) NOT NULL CHECK (TABLE_CHAIR IN ('YES', 'NO')),
        ALMIRA VARCHAR(3) NOT NULL CHECK (ALMIRA IN ('YES', 'NO')),
        WATER_SUPPLY INT NOT NULL CHECK (WATER_SUPPLY BETWEEN 1 AND 24), 
        WATER_DRINK VARCHAR(8) NOT NULL CHECK (WATER_DRINK IN ('NAL', 'FILTERED')),
        PARKING_SPACE VARCHAR(50) NOT NULL CHECK (PARKING_SPACE IN ('NO', 'TWO_WHEELER')),
        WIFI VARCHAR(3) NOT NULL CHECK (WIFI IN ('YES', 'NO')),
        ELLECTRICITY_BILL VARCHAR(3) NOT NULL CHECK (ELLECTRICITY_BILL IN ('YES', 'NO')), 
        RULES VARCHAR(255) NOT NULL, 
        PHOTO_URL_ID VARCHAR(200) NOT NULL UNIQUE,
        CREATEDAT DATETIME DEFAULT NOW(),
        FOREIGN KEY (ADMIN_REF_ID) REFERENCES ADMINS(ADMIN_ID) ON DELETE CASCADE,
        INDEX idx_address_price_room_status (PRICE,LOCALITY,DISTRICT,ROOM_STATUS)
        )`;
    const connection = await db.getConnection();
    try {
        await connection.query(roomTable);
        connection.release();
        console.log("room table created");
    }
    catch (error) {
        connection.release();
        console.log("room table not created");
    }
}
