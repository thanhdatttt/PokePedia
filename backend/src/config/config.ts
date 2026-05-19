export default () => {
    return {
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,

        // JWT
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES,
        REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES,
        OTP_EXPIRES: process.env.OTP_EXPIRES,
        BCRYPT_ROUND: process.env.BCRYPT_ROUND,
    };
}