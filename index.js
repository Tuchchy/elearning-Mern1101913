const express = require('express')
const db = require('./configs/db')
require('dotenv').config()

const app = express()

app.use(express.json())

const courses = require('./database/mock/courses.json')
const students = require('./database/mock/students.json')

// connect database then seperate all to diff dir
app.get('/dbtest', async(req,res)=>{
    const [rows] = await db.execute('SELECT 1+1 AS solution');
    console.log(`The solution is: ${rows[0].solution}`);
    res.json({ solution: rows[0].solution });
    // const idk = await db.execute('SELECT * FROM new_data');
    // res.json({rows: idk})
})


//CRUD students
app.get('/students', (req,res)=>{
    res.json(students)
})
app.get('/students/:id', (req,res)=>{
    const {id} = req.params
    const student = students.find(s => s.id == id)
    res.json(student)
})
app.post('/students', (req,res)=>{
    const field = req.body
    const requireField = ["studentNumber", "name", "year", "major", "dob", "email", "password", "gpa", "status"]
    const createAt = new Date()
    
    const obj = Object.entries(field)
    let iter = 0
    for (const rf of requireField) {
        if (!rf.includes(obj[iter][0])) {
            return res.status(400).json({error: `${rf} is required`})
        }
        iter++
    }
    
    const student = students.push({
        name: "...i'm lazy to fill lol",
        enrolledCourseIds: [],
        createAt: createAt.toDateString()
    })
    console.log(student);
    res.json({student: students[students.length-1] ,createAt})
})
app.patch('/students/:id', (req,res)=>{
    const {id} = req.params
    const allowedField = ["name", "year", "major", "dob", "email", "password", "gpa", "status", "enrolledCourseIds"]
    
    const updates = Object.keys(req.body)
    for (const u of updates) {
        if (!allowedField.includes(u)) {
            return res.status(400).json({message: `${res.statusMessage}, ${af} this field is not allow or not exists, or your json body is empty`})
        }
    }

    const student = students.find(s => s.id == id)
    for (const b in req.body) {
        student[b] = req.body[b]
    }
    
    res.json(student);
})
app.delete('/students/:id', (req,res)=>{
    const {id} = req.params
    const student = students.find(s => s.id  == id)
    console.log(`delete student ${student.name}`);
    // res.redirect('/')
    res.json({deleted: student})
})

//CRUD elearning (courses)
app.get('/courses', (req,res)=>{
    res.json(courses)
})
app.get('/courses/:id', (req,res)=>{
    const {id} = req.params
    const course = courses.find(c => c.id == id)
    res.json(course)
})
app.post('/courses', 
    (req,res,next)=>{
        const {username, password} = req.body
        if (username==="staff01" && password==="123456") {
            return next();
        }
        return res.status(403).json({message: "not allowed"})
    }, 
    (req,res)=>{
        const requiredField = ["code", "name", "credits", "semester", "description", "instructor"]

        for (const rf of requiredField) {
            if (!req.body[rf]) {
                return res.status(400).json({error: `${rf} is required`})
            }
        }

        res.json({message: "add courses success"})
    })
app.patch('/courses/:id', (req,res)=>{
    const {id} = req.params
    const field = req.body
    const course = courses.find(c => c.id == id)

    if (!course) {
        return res.status(404).json({error: `course not found`})
    }

    const allowedField = ["code","name","credits","semester","prerequisites","description","instructor"]
    try {
        // checking invalid body field
        const updates = Object.keys(field)
        for (const u of updates) {
            console.log(u);
            if (!allowedField.includes(u)) {
                return res.status(400).json({error: `unknow field ${rf}`})
            }
        }
    } catch (error) {
        res.status(500).json({message: "json body may empty", error})
    }

    // not update yet
    res.json({message: "update success", updatedAt: new Date(), new_course: req.body, old_course: course})
})
app.delete('/courses/:id', (req,res)=>{
    const {id} = req.params
    const course = courses.find(c => c.id == id)

    if (!course) {
        return res.status(404).json({error: `course not found`})
    }

    res.json({message: "course deleted!", course})
})

app.listen(process.env.PORT, ()=>{
    console.log(`listen at http://localhost:${process.env.PORT}/`);
})