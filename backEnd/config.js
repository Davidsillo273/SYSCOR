import dotenv from "dotenv"

dotenv.config();

export const config = {
    db: {
        URI: process.env.DB_URI
    },
    JWT: {
        secret: process.env.JWT_Secret_key
    },
    email: {
        user_email: process.env.USER_EMAIL,
        user_password: process.env.USER_PASSWORD
    },
    appUrl: process.env.APP_URL || "http://localhost:4200"
}
