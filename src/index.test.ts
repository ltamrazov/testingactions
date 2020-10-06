import pg from 'pg';

describe('TestSuite', () => {
  const config = {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT, 10),
    host: process.env.DATABASE_HOST,
  };

  const pool = new pg.Pool(config);
  let client: pg.PoolClient;

  beforeAll(async (done) => {
    client = await pool.connect();
    done();
  });

  afterAll(async (done) => {
    await client.release();
    await pool.end();
    done();
  });

  it('should connect to postgres', async (done) => {
    expect(client).toBeDefined();
    done();
  });

  it('should connect to postgres again', async (done) => {
    expect(client).toBeDefined();
    done();
  });
});
