import { db } from "../app.js";
export function roomPhotosSchema() {
    const photoTable = `CREATE TABLE IF NOT EXISTS ROOMPHOTOS(PHOTO_ID CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    ROOM_REF_ID char,
    PHOTO_URL VARCHAR(255) NOT NULL ,
    FOREIGN KEY (ROOM_REF_ID) REFERENCES ROOMS(ROOM_ID),
    createdAt DATETIME DEFAULT now()
    )`;
    db.query(photoTable, (err, result) => {
        if (err)
            throw err;
        console.log("photo table created abhay ji");
    });
}
