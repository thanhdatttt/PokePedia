export const AUTH_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_EXPIRES_MINUTES: 5,

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