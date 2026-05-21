export const AUTH_CONSTANTS = {
  OTP_TTL: 5 * 60,
  EMAIL_VERIFIED_TTL: 15 * 60,  
  RESET_VERIFIED_TTL: 10 * 60,

  BCRYPT_ROUNDS: 12,
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
};

export const strongPasswordOptions = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};