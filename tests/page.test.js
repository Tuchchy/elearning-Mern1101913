const {app} = require('../index')
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect

// npx mocha tests/page.test.js
app.response.render = function(view, option) {
    this.status(200).json({view, option})
}

describe('Page Routing', ()=>{
    it('GET / should render home page', async ()=>{
        const res = await request(app).get('/')
        expect(res.status).to.equal(200)
        expect(res.body.view).to.equal('pages/home')
        expect(res.body.option.title).to.equal('kuy')
        expect(res.body.option.data.d1).to.equal('suck')
    })
})