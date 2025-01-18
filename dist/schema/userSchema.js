import { db } from "../app.js";
export async function userSchema() {
    const userTable = `
    CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(200) PRIMARY KEY NOT NULL UNIQUE,
        first_name VARCHAR(30) NOT NULL,
        last_name VARCHAR(15) DEFAULT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone BIGINT  UNIQUE DEFAULT NULL,
        altPhone BIGINT DEFAULT NULL,
        state VARCHAR(20) DEFAULT NULL,  
        district VARCHAR(30) DEFAULT NULL,
        town VARCHAR(500) DEFAULT NULL,   
        pinCode INT DEFAULT NULL,
        gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')) DEFAULT NULL,
        createdAt DATETIME DEFAULT now()
    );
    `;
    const connection = await db.getConnection();
    try {
        await connection.query(userTable);
        connection.release();
        console.log("user table created");
    }
    catch (error) {
        connection.release();
        console.log("user table not created");
    }
}
;
