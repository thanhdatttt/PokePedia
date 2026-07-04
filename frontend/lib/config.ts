import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Backend API
  NEXT_PUBLIC_API_URL: z.url({ message: "NEXT_PUBLIC_API_URL must be valid url" }),
  
  // Frontend App
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
});

const envServer = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!envServer.success) {
  console.error('env is not valid');
  throw new Error('env is not valid. Please check again');
}

export const config = envServer.data;
export type EnvConfig = z.infer<typeof envSchema>;