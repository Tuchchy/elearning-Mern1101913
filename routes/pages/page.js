const db = require('../../configs/db')
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch').default

// const express = require('express')
const url = 'http://localhost:3000'

function pageSetUp(app) {
    // const app = express()
    app.use(async(req,res,next)=>{
        if(req.path.startsWith('/api/')) return next();
        // console.log('LOGIN', req.cookies.refreshToken, req.cookies);

        const token = req.cookies.refreshToken || null
        res.locals.isLogin = false;
        res.locals.user = null
        if (token) {
            try {
                const payload = jwt.verify(token, process.env.REFRESH_SECRET)
                res.locals.isLogin = true
                res.locals.user = {
                    id: payload.sub,
                    jti: payload.jti
                }
                const [userRow] = await db.execute(
                    `SELECT * FROM Users Where id=?`, [payload.sub]
                )
                res.locals.user = {
                    jti: res.locals.user.jti,
                    ...userRow[0]
                }
            } catch (error) {
                console.log('Invalid Token', error);
            }
        }
        next()
    })
    app.get('/', (req, res) => {
        res.render('pages/home', {
            title: "home",
            active: 'home',
            style: "/styles/pages/home.css",
        })
    })
    app.get('/profile', async (req, res) => {
        res.render('pages/profile', {
            title: "profile",
            active: 'activity',
            style: "/styles/pages/activity.css",
        })
    })
    app.get('/activity', async (req, res) => {
        res.render('pages/activities', {
            title: "activity",
            active: 'activity',
            style: "/styles/pages/activity.css",
            data: {}
        })
    })
    app.get('/activity/:id', async (req, res) => {
        const [row] = await db.execute(
            `SELECT * FROM Activities WHERE id=?`,
            [req.params.id]
        )
        // alway convert date to string first
        const sdt = new Date(row[0].start_date).toISOString().slice(0, 16)
        const edt = new Date(row[0].end_date).toISOString().slice(0, 16)

        const x = new Date(row[0].start_date).toDateString()// Thu Jul 31 2025
        const y = new Date(row[0].start_date).toISOString() // 2025-07-30T17:00:00.000Z
        console.log('DateStr: ' + x, ', ISO-Str: ' + y);

        console.log(row[0]);

        res.render('pages/activity', {
            title: "activity",
            active: 'activity',
            style: "/styles/pages/activity.css",
            data: {
                ...row[0],
                start_date: sdt,
                end_date: edt
            }
        })
    })
    app.post('/activity/:id', async (req, res) => {
        const [row] = await db.execute(
            `SELECT * FROM Activities WHERE id=?`,
            [req.params.id]
        )
        // alway convert date to string first
        const sdt = new Date(row[0].start_date).toISOString().slice(0, 16)
        const edt = new Date(row[0].end_date).toISOString().slice(0, 16)

        const x = new Date(row[0].start_date).toDateString()// Thu Jul 31 2025
        const y = new Date(row[0].start_date).toISOString() // 2025-07-30T17:00:00.000Z
        console.log('DateStr: ' + x, ', ISO-Str: ' + y);

        console.log(row[0]);

        res.render('pages/activity', {
            title: "activity",
            active: 'activity',
            style: "/styles/pages/activity.css",
            data: {
                ...row[0],
                start_date: sdt,
                end_date: edt
            }
        })
    })
    app.get('/selflearn', async(req, res) => {
        // use node-fetch to get /api/courses
        try {
            const response = await fetch(`${url}/api/courses`)
            const data = await response.json()

            res.render('pages/courses', {
                title: "self learn",
                active: 'selflearn',
                style: "/styles/pages/courses.css",
                data
            })
        } catch (error) {
            console.log(error);
            res.status(500)
        }
    })
    app.get('/selflearn/:id', async(req, res) => {
        try {
            const response = await fetch(`${url}/api/courses/${req.params.id}`)
            console.log(req.params.id);

            if (!response.ok) {
                const text = await response.text();
                console.error('API response not OK:', text);
                return res.status(response.status).send('Error fetching course data');
            }
            
            const {courses, modules, asset, enroll} = await response.json()
            
            const send = {
                title: "self learn",
                active: 'selflearn',
                style: "/styles/pages/course.css",
                courses, modules, asset, enroll
            }
            console.log(send);
            res.render('pages/course', send)
        } catch (error) {
            console.log(error);
        }
    })
    app.get('/login', (req, res) => {
        res.render('pages/login', {
            title: 'login',
            active: "login",
            style: '/styles/pages/home.css'
        })
    })
    app.get('/testform', (req, res) => {
        res.render('pages/testform', {
            title: 'test',
            active: "login",
            style: '/styles/pages/home.css'
        })
    })
}

module.exports = {pageSetUp}