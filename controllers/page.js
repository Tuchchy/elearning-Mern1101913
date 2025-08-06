const db = require('../configs/db')

function pageSetUp(app) {
    app.use((req,res,next)=>{
        if(req.path.startsWith('/api/')) return next();
        console.log('LOGIN', req.cookies.refreshToken, req.cookies);

        const token = req.cookies.refreshToken || null
        res.locals.isLogin = token ? true : false;
        next()
    })
    app.get('/', (req, res) => {
        res.render('pages/home', {
            title: "kuy",
            active: 'home',
            style: "/styles/pages/home.css",
            data: { // rows[], Activities or Courses
                d1: "suck",
                d2: {
                    d21: "po",
                    d22: "ppr"
                }
            }
        })
    })
    app.get('/activity', async (req, res) => {
        res.render('pages/activities', {
            title: "kuy",
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
            title: "kuy",
            active: 'activity',
            style: "/styles/pages/activity.css",
            data: {
                ...row[0],
                start_date: sdt,
                end_date: edt
            }
        })
    })
    app.get('/selflearn', (req, res) => {
        res.render('pages/selflearn', {
            title: "kuy",
            active: 'selflearn',
            style: "/styles/pages/selflearn.css",
        })
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