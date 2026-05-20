import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import config from 'src/config/config';

@Injectable()
export class DatabaseService {
  private pool = new Pool({
    connectionString: config().DATABASE_URL,
  });

  db = drizzle(this.pool);
}