import { db } from "../app.js"
import ErrorHandler from "../middleware/customError.js"

export async function adminSchema() {

    const adminTable = `CREATE TABLE IF NOT EXISTS ADMINS ( 
ADMIN_ID VARCHAR(200) PRIMARY KEY,
FIRST_NAME  VARCHAR(30) NOT NULL,
LAST_NAME VARCHAR(20) DEFAULT NULL,
PHONE BIGINT NOT NULL UNIQUE,
EMAIL VARCHAR(100) UNIQUE NOT NULL,
PASSWORD VARCHAR(100) NOT NULL,
HOSTEL_NAME VARCHAR(100) NOT NULL,
STATE VARCHAR(50) NOT NULL,
DISTRICT VARCHAR(50) NOT NULL,
PINCODE INT NOT NULL ,
TOWN_NAME VARCHAR(500) NOT NULL ,
GENDER VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
createdAt DATETIME DEFAULT now()
)`

    const connection = await db.getConnection()
    try {
        await connection.query(adminTable)
        connection.release()
        console.log("admin table created");

    } catch (error) {
        connection.release()
        console.log("admin table not created");

    }

}