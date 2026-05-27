import * as bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '../constants/auth.constant';

export class HashUtil {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(AUTH_CONSTANTS.BCRYPT_ROUNDS);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(raw: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(raw, hash);
  }
}