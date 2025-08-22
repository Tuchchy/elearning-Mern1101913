const express = require('express')
const engine = require('ejs-mate')
const multer = require('multer')
const path = require('path')
const cookieParser = require('cookie-parser')
/* import security module */
// const helmet = require('helmet')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')

const swaggerDocs = require('./configs/swagger')

const { authMiddleware } = require('./middlewares/authentication')
const { pageSetUp } = require('./routes/pages/page')
const { getStudent } = require('./controllers/student.controller')
const { router: studentRouter } = require('./routes/student.route')
const { router: activityRouter } = require('./routes/activity.route')
const { router: coursesRouter } = require('./routes/course.route')

require('dotenv').config()

let errorCount = 0

const app = express()

app.engine('ejs', engine)
app.set('view engine', 'ejs')

app.use('/api', express.json())
app.use(cookieParser())
app.use(cors({
    origin: "*", // 👈 exact origin (no '*'), http://127.0.0.1:5500
    credentials: true
}))
app.use(express.static('public'))
app.use(express.json())

/**
 * Multer storage configuration for handling file uploads.
 *
 * - Determines the upload destination based on the file's mimetype and request URL.
 *   - Images are stored in `public/images/uploads`.
 *   - Videos are stored in `public/videos/uploads`.
 *   - PDFs are stored in `public/pdf/uploads`.
 * - Further categorizes uploads into subfolders (`profiles`, `activities`, `courses`)
 *   based on the request's original URL.
 * - Filenames are prefixed with the current timestamp to ensure uniqueness.
 *
 * @constant
 * @type {import('multer').StorageEngine}
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('base url: ' + req.baseUrl.includes('activity'));// not work, 2 below work
        console.log('or this ' + req.path);
        console.log('or these ' + req.originalUrl);
        let uploadPath = 'public'

        if (file.mimetype.startsWith('image/')) uploadPath += '/images/uploads'
        else if (file.mimetype.startsWith('video/')) uploadPath += '/videos/uploads'
        else if (file.mimetype === 'application/pdf') uploadPath += '/pdf/uploads'

        if ((req.originalUrl.includes('register') || req.originalUrl.includes('profile')) && file.mimetype.startsWith('image/')) {
            uploadPath += '/profiles'
        } else if (req.originalUrl.includes('activity')) { // will it have problem with /api/activity?
            uploadPath += '/activities'
        } else if (req.originalUrl.includes('courses')) {
            uploadPath += '/courses'
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

app.get('/api/dbtest', async (req, res) => {
    const [rows] = await db.execute('SELECT 1+1 AS solution');
    console.log(`The solution is: ${rows[0].solution}`);
    const [rows1] = await db.execute('SELECT * FROM new_data')
    res.json({ solution: rows1 });
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
/* 🛠🛠🛠, Let give LOGIN For Only my Teams, not app users */
// check user/pwd if yes gen 2 keys
app.post('/login', async (req, res) => {
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
// check refresh -> get new 2 key -> recoursePlace old refreshToken cookie and delete row in refresh table
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

pageSetUp(app)

app.use('/images', express.static(path.join(__dirname, 'public/images')));


app.use('/api/activity', activityRouter)
app.use('/api/courses', coursesRouter)

// button to add module, inside module have button to add assets
// when submit it count all of it, except an empty form
// const { upload: uploadc } = require('./middlewares/uploadImgCourse')
// const db = require('./configs/db')

/*
app.post('/api/courses', uploadc.array('poster'), async (req, res) => {
    // add multiple upload array
    const conn = await db.getConnection()
    try {
        await conn.beginTransaction()

        const allowedCourseField = ['title', 'detail', 'imageUrl']
        const cfield = [] // req.body
        const cvalue = []

        let rmrows
        let rarows

        let imageUrl = req?.file?.fieldname
        if (req?.files?.length > 0) {
            imageUrl = `/images/uploads/courses/${req.files[0].filename}`
        } else {
            imageUrl = `/images/uploads/courses/default${(Math.floor(Math.random() * 2) + 1)}.png`
        }
        cfield.push('imageUrl')
        cvalue.push(imageUrl)

        allowedCourseField.forEach(c => {
            if (req.body[c] != undefined) {
                cfield.push(c)
                cvalue.push(req.body[c])
            }
        });

        const [crows] = await db.execute(
            `INSERT INTO Courses(${cfield.join(',')}, create_by) 
             VALUES (${'?,'.repeat(cfield.length).slice(0,-1)}, ?)`,
            [...cvalue, 1]
        )
        const courseId = crows.insertId

        if (Array.isArray(req.body.modules)) {
            const allowedModuleField = ['course_id' ,'title', 'content_type', 'content', 'position']
        
            for (const module of req.body.modules) {
                const mfield = [] // req.body.modules
                const mvalue = []

                // let do ui first!
                if (req.file) {
                    console.log(req.file);
                }

                allowedModuleField.forEach(m => {
                    if (module[m] != undefined) {
                        mfield.push(m)
                        mvalue.push(module[m])
                    }
                });
                
                const [mrows] = await db.execute(
                    `INSERT INTO CourseModules(course_id, ${mfield.join(',')}) 
                    VALUES (?, ${'?,'.repeat(mfield.length).slice(0,-1)})`,
                    [courseId ,...mfield]
                )
                rmrows = mrows
                const moduleId = mrows.insertId

                if (Array.isArray(module.assets)) {
                    const allowedAssetFields = ['cmid', 'title', 'asset_type', 'asset_url', 'is_download']

                    for (const asset of module.assets) {
                        const afield = [] // req.body.modules.assets
                        const avalue = []
                        
                        allowedAssetFields.forEach(a => {
                            if (asset[a] != undefined) {
                                afield.push(a)
                                avalue.push(asset[a])
                                console.log(cfield,mfield,afield, avalue);
                            }
                        });

                        const [arows] = await db.execute(
                            `INSERT INTO CourseModuleAssets(cmid, ${afield.join(',')}) VALUES (?, ${'?,'.repeat(afield.length).slice(0,-1)})`,
                            [moduleId, ...avalue]
                        )
                        rarows = arows
                    }
                }
            }
        }
        await conn.commit()
        res.json({ message: 'course create successfull', create: {crows, rmrows, rarows} })
    } catch (error) {
        console.log(error);
        await conn.rollback()
        res.status(500).json({ error })
    } finally {
        conn.release()
    }
})*/


swaggerDocs(app)
app.listen(process.env.PORT, () => {
    console.log(`listen at http://localhost:${process.env.PORT}/`);
    console.log(`listen at http://localhost:${process.env.PORT}/api-docs`);
})

module.exports = { app }