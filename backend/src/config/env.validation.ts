import { z } from "zod";

export const envValidationSchema = z.object({
    DATABASE_URL: z.string(),
    DIRECT_URL: z.string(),
    PORT: z.coerce.number().default(3333),
    JWT_ACCESS_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRES: z.string(),
    REFRESH_TOKEN_EXPIRES: z.string(),
    OTP_EXPIRES: z.string(),
    BCRYPT_ROUND: z.string(),
});