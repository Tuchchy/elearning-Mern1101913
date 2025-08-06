const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../index');

describe('Activity API', () => {
    it('GET /api/activity → should return all activities', async () => {
        const res = await request(app).get('/api/activity');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('rows');
        expect(res.body.rows).to.be.an('array');
    });
    it('GET /api/activity/:id → should return 1 activity', async () => {
        const res = await request(app).get('/api/activity/1');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('row');
    });
    it('GET /api/activity/1 → should return empty', async () => {
        const res = await request(app).get('/api/activity/1');
        expect(res.status).to.equal(200);
        expect(res.body.row).to.be.an('array').that.is.empty;
    });
    it('DELETE /api/activity/1 → should return 404', async () => {
        const res = await request(app).delete('/api/activity/1')
        expect(res.status).to.equal(404)
        expect(res.body.error).to.equal('this activities not exists')
    })

});