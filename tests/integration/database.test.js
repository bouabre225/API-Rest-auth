import {test} from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import * as path from "node:path";
import {describe} from "zod";

const linkDB = path.resolve(process.cwd(), 'test.db');
const db = new Database(linkDB);
function testConnection(){
    try {
        db.prepare('SELECT 1').get();
        return true;
    } catch (err){
        return false;
    }
}
describe('Database configuration', ()=> {
    test('should connect successfully', ()=>{
        const isConnected = testConnection();
        assert.strictEqual(isConnected, true);
    })
})

