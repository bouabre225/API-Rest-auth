import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import helmet from 'helmet';

describe('Error handler', ()=>{
    let app ;
    before(()=>{
    app = express();
    app.get('/error', (req, res, next)=>{
        const err = new Error('Test error');
        err.status = 500;
        next(err);
    })
    app.use(errorHandler)
    });
    
})