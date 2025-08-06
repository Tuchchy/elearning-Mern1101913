const express = require('express')
const engine = require('ejs-mate')
const multer = require('multer')
const db = require('./configs/db')
const cookieParser = require('cookie-parser')
/* import security module */
// const helmet = require('helmet')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')

const courses = require('./database/mock/courses.json')
const students = require('./database/mock/students.json')
const { authMiddleware } = require('./middlewares/authentication')
const { pageSetUp } = require('./controllers/page')
const { getStudent } = require('./controllers/student.controller')
require('dotenv').config()

let errorCount = 0

const app = express()

app.engine('ejs', engine)
app.set('view engine', 'ejs')

// app.use(helmet())
app.use('/api', express.json())
app.use(cookieParser())
// app.use(bodyParser)
app.use(cors({
    origin: "*", // 👈 exact origin (no '*'), http://127.0.0.1:5500
    credentials: true
}))
app.use(express.static('public'))

// need logic to store for each course id
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('base url: ' + req.baseUrl.includes('activity'));// not work, 2 below work
        console.log('or this ' + req.path);
        console.log('or these ' + req.originalUrl);
        let uploadPath = 'public/images/uploads'
        if (req.originalUrl.includes('testform')) { // 🙌
            uploadPath = 'public/images/uploads/profiles'
        } else if (req.originalUrl.includes('activity')) { // will it have problem with /api/activity?
            uploadPath = 'public/images/uploads/activities'
        } else if (req.originalUrl.includes('courses')) {
            uploadPath = 'public/images/uploads/courses'
        }
        console.log(uploadPath);
        cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + '-' + file.originalname
        cb(null, filename)
    }
})
const upload = multer({ storage })

pageSetUp(app)

// API ZONE
// connect database then seperate all to diff dir
app.get('/api/dbtest', async (req, res) => {
    const [rows] = await db.execute('SELECT 1+1 AS solution');
    console.log(`The solution is: ${rows[0].solution}`);
    // ใช้ chatgpt ในการสอนให้ทำ CRUD database/api >5 hours
    //      แล้วไป เรื่องพวก ENUM, และเทคนิคอื่นๆต่อ     <2 hours
    //      แล้วไป transaction/procedure/index    >2 hours
    //      แล้วไป auth และความปลอดภัย            >2 hours
    const [rows1] = await db.execute('SELECT * FROM new_data')
    res.json({ solution: rows1 });
    // const idk = await db.execute('SELECT * FROM new_data');
    // res.json({rows: idk})
})

// gen 2 keys, insert to refresh table
function createTokens(userId) {
    const jti = uuidv4()
    const accessToken = jwt.sign({ sub: userId, jti }, process.env.ACCESS_SECRET, {
        expiresIn: "15m"
    })
    const refreshToken = jwt.sign({ sub: userId, jti }, process.env.REFRESH_SECRET, {
        expiresIn: "7d"
    })
    db.execute(
        `INSERT INTO refresh_tokens VALUES (?,?)`,
        [userId, jti]
    )
    return { accessToken, refreshToken }
}
/* 🛠🛠🛠, 
problem: 
 * can generate many token in 1 user by login 
 * navigation isLogin not work
*/
// check user/pwd if yes gen 2 keys
app.post('/login', express.json(), async (req, res) => {
    const { username } = req.body
    try {
        const [rows] = await db.execute(
            `SELECT * FROM Users WHERE username=?`, 
            [username]
        )
        if (!rows.length) {
            return res.status(404).json({})
        }
        const { accessToken, refreshToken } = createTokens(rows[0].id)
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false
        }).json({ accessToken }) // client side manage it
        res.redirect('/')
    } catch (error) {
        errorCount++
        console.log(errorCount, error);
        res.status(500).json(error)
    }
})
// check refresh -> get new 2 key -> replace old refreshToken cookie and delete row in refresh table
app.post('/refresh-token', async (req, res) => {
    const token = req.cookies.refreshToken
    if (!token) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.REFRESH_SECRET, async (err, payload) => {
        if (err) {
            return res.status(403).json({})
        }
        const [row] = await db.execute(
            `select * from refresh_tokens WHERE jti=?`,
            [payload.jti]
        )
        console.log(row);
        const { accessToken, refreshToken } = createTokens(payload.sub) // use same userId no need to query again
        db.execute("DELETE FROM refresh_tokens WHERE jti=?")
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false
        }).json({ accessToken })
    })
})
app.post('/register', upload.single('profile'), async (req, res) => {
    try {
        const file = req.file
        const { username, password, email } = req.body
        const role = 'user'
        let imageUrl;
        console.log(file);

        if (!file) { // when file undifind
            console.log('file is null so we fill it :)');
            imageUrl = '/images/uploads/profiles/default-user-profile.png'
        } else {
            imageUrl = '/images/uploads/profiles/' + Date.now() + file.fieldname + username
        }
        console.log(username, password, email, imageUrl, role);

        const [result] = await db.execute(
            `INSERT INTO Users(username, password, email, imageUrl, role) VALUES (?,?,?,?,?);`,
            [username, password, email, imageUrl, role]
        )
        console.log(result);

        res.json(result)

    } catch (error) {
        errorCount += 1
        console.log(errorCount, error);
        res.status(500).json(error)
    }
})
app.post('/logout', async (req, res) => {
    const token = req.cookies.refreshToken
    if (!token) {
        return res.status(204).json({})
    }
    jwt.verify(token, REFRESH_SECRET, (err, payload) => {
        if (!err) {
            db.execute('DELETE FROM refresh_tokens WHERE jti=?', [payload.jti])
        }
        res.clearCookie("refreshToken").sendStatus(204).json({})
    })
})

//CRUD students
app.get('/api/students', getStudent)
app.get('/api/students/:id', (req, res) => {
    const { id } = req.params
    const student = students.find(s => s.id == id)
    res.json(student)
})
app.post('/api/students', (req, res) => {
    const field = req.body
    const requireField = ["studentNumber", "name", "year", "major", "dob", "email", "password", "gpa", "status"]
    const createAt = new Date()

    const obj = Object.entries(field)
    let iter = 0
    for (const rf of requireField) {
        if (!rf.includes(obj[iter][0])) {
            return res.status(400).json({ error: `${rf} is required` })
        }
        iter++
    }

    const student = students.push({
        name: "...i'm lazy to fill lol",
        enrolledCourseIds: [],
        createAt: createAt.toDateString()
    })
    console.log(student);
    res.json({ student: students[students.length - 1], createAt })
})
app.patch('/api/students/:id', authMiddleware, (req, res) => {
    const { id } = req.params
    const allowedField = ["name", "year", "major", "dob", "email", "password", "gpa", "status", "enrolledCourseIds"]

    const updates = Object.keys(req.body)
    for (const u of updates) {
        if (!allowedField.includes(u)) {
            return res.status(400).json({ message: `${res.statusMessage}, ${af} this field is not allow or not exists, or your json body is empty` })
        }
    }

    const student = students.find(s => s.id == id)
    for (const b in req.body) {
        student[b] = req.body[b]
    }

    res.json(student);
})
app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params
    const student = students.find(s => s.id == id)
    console.log(`delete student ${student.name}`);
    res.json({ deleted: student })
})

//CRUD activity
app.get('/api/activity', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM Activities')
        res.json({ rows })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
})
app.get('/api/activity/:id', async (req, res) => {
    try {
        const [row] = await db.execute('SELECT * FROM Activities WHERE id = ?', [req.params.id])
        res.json({ row })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
})
app.post('/api/activity', upload.single('poster'), async (req, res) => {
    console.log('AT /api/activity');

    const { title, content, detail, lecturer, start_date, end_date } = req.body
    const imageUrl = `/images/uploads/activities/${req.file.filename}`;
    try {
        const [result] = await db.execute(
            'INSERT INTO Activities(title, content , detail, imageUrl, lecturer, start_date, end_date) VALUES (?,?,?,?,?,?,?)',
            [title, content, detail, imageUrl, lecturer, start_date, end_date]
        )
        res.status(201).json({ result })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})
app.patch('/api/activity/:id', upload.single('poster'), async (req, res) => {
    console.log('AT /api/activity/:id');
    const field = []
    const value = []
    debugger;
    if (!req.file) {
        console.log(`image isn't update, file: ${req.file}`);
    } else {
        value.push(`/images/uploads/activities/${req.file.filename}`)
        field.push(`imageUrl=?`)
    }
    debugger;

    for (const key in req.body) {
        let t = req.body[key].trim()
        console.log(t);
        
        if (t != '') { // nah i just get it from type 'forin'
            console.log(t);
            const element = req.body[key];
            value.push(element)
            field.push(`${key}=?`)
        }
    }

    try {
        debugger;
        if (field.length == 0 && value.length == 0) { // this is not work why?
            console.log(`UPDATE Activities SET ${field.join(',')} WHERE id=?\n`, [...value, req.params.id]);

            const [result] = await db.execute(
                `UPDATE Activities SET ${field.join(',')} WHERE id=?`,
                [...value, req.params.id]
            )
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Activities not exists' })
            }

            // delete image file
            const [rows] = db.execute(
                `SELECT * FROM Users WHERE id=?`,
                [req.params.id]
            )
            const oldImg = rows[0].imageUrl
            if (req.file && oldImg) {
                const fs = require('fs').promises // the path of this file
                try {
                    await fs.unlink('public' + oldImg) // fs start with this file path so it can go to /public, same as when node server.js
                } catch (error) {
                    console.log(error);
                }
            }
            console.log(result);
            res.json({ result })
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }

})
app.delete('/api/activity/:id', async (req, res) => {
    // need auth for delete
    try {
        const [result] = await db.execute('DELETE FROM Activities WHERE id=?', [req.params.id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'this activities not exists' })
        }
        res.json({ result })
    } catch (error) {
        res.status(500).json({ error })
    }
})

// course   
// activity 
// user     
//CRUD elearning (courses)
app.get('/api/courses', (req, res) => {
    res.json(courses)
})
app.get('/api/courses/:id', (req, res) => {
    const { id } = req.params
    const course = courses.find(c => c.id == id)
    res.json(course)
})
app.post('/api/courses', (req, res) => {
    const requiredField = ["code", "name", "credits", "semester", "description", "instructor"]

    for (const rf of requiredField) {
        if (!req.body[rf]) {
            return res.status(400).json({ error: `${rf} is required` })
        }
    }

    res.json({ message: "add courses success" })
})
app.patch('/api/courses/:id', (req, res) => {
    const { id } = req.params
    const field = req.body
    const course = courses.find(c => c.id == id)

    if (!course) {
        return res.status(404).json({ error: `course not found` })
    }

    const allowedField = ["code", "name", "credits", "semester", "prerequisites", "description", "instructor"]
    try {
        // checking invalid body field
        const updates = Object.keys(field)
        for (const u of updates) {
            console.log(u);
            if (!allowedField.includes(u)) {
                return res.status(400).json({ error: `unknow field ${rf}` })
            }
        }
    } catch (error) {
        res.status(500).json({ message: "json body may empty", error })
    }

    // not update yet
    res.json({ message: "update success", updatedAt: new Date(), new_course: req.body, old_course: course })
})
app.delete('/api/courses/:id', (req, res) => {
    const { id } = req.params
    const course = courses.find(c => c.id == id)

    if (!course) {
        return res.status(404).json({ error: `course not found` })
    }

    res.json({ message: "course deleted!", course })
})


app.get('/rating', async (req,res)=>{
    try {
        const [rows] = await db.execute('SELECT rating FROM CourseEnrollments')
        console.log(rows);
        
        res.json({ rows }) // {"rows":[]}
    } catch (error) {
        console.log(error);
        
    }
})


app.listen(process.env.PORT, () => {
    console.log(`listen at http://localhost:${process.env.PORT}/`);
})

module.exports = {app}