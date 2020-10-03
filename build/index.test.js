"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = __importDefault(require("pg"));
const config = {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: parseInt(process.env.DATABASE_PORT),
    host: process.env.DATABASE_HOST
};
console.log("CONFIG", config);
describe('TestSuite', () => {
    console.log("yooo");
    const pool = new pg_1.default.Pool(config);
    let client;
    beforeAll(async (done) => {
        client = await pool.connect();
        done();
    });
    afterAll(async (done) => {
        console.log("AFTER ALL CALLED");
        await client.release();
        await pool.end();
        done();
    });
    it('should connect to postgres', async (done) => {
        expect(client).toBeDefined();
        done();
    });
});
