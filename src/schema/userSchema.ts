import { db } from "../app.js";
export function userSchema() {
    const userTable = `
    CREATE TABLE IF NOT EXISTS users (
        userId VARCHAR(200) PRIMARY KEY ,
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
    db.query(userTable, function (err, result) {
        if (err) throw err;
        console.log("user table created abhay ji!");
    })

};


