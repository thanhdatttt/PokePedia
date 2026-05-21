export default () => {
    return {
        PORT: process.env.PORT,
        DATABASE_URL: process.env.DATABASE_URL,

        // JWT
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    };
}