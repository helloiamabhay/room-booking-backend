export function adminSchema() {
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
)`;
    // db.query(adminTable, (err, result) => {
    //     if (err) throw err;
    //     console.log("admin table created abhay ji");
    // })
}
