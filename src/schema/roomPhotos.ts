import { db } from "../app.js"

export function roomPhotosSchema() {

    const photoTable = `CREATE TABLE IF NOT EXISTS ROOMPHOTOS(PHOTO_ID VARCHAR(200) NOT NULL UNIQUE PRIMARY KEY,
    PHOTO_URL VARCHAR(255) NOT NULL ,
    CREATEDAT DATETIME DEFAULT NOW(),
    FOREIGN KEY (PHOTO_URL) REFERENCES ROOMS(PHOTO_URL_ID) ON DELETE CASCADE
    )`

    db.query(photoTable, (err, result) => {
        if (err) throw err;
        console.log("photo table created abhay ji");
    })
}