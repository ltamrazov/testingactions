import pg from 'pg'

describe('TestSuite', () => {
    const pool = new pg.Pool({
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        port: parseInt(process.env.DATABASE_PORT),
        host: process.env.DATABASE_HOST
    })
    let client: pg.PoolClient
    beforeAll(async(done) => {
        client = await pool.connect()
        done()
    })
    afterAll(async (done) => {
        client.release()
        await pool.end()
        done()
    })
    it('should connect to postgres', async (done) => {


        const client = await pool.connect()
        expect(client).toBeDefined()
        done()
    })
})