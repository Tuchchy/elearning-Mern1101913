const express = require('express')
require('dotenv').config()

const app = express()

app.use(express.json())

const courses = require('./database/mock/courses.json')
const students = require('./database/mock/students.json')

//CRUD elearning (courses)
app.get('/courses', (req,res)=>{
    res.json(courses)
})
app.get('/courses/:id', (req,res)=>{
    const {id} = req.params
    const course = courses.find(c => c.id == id)
    res.json(course)
})
app.post('/courses', (req,res)=>{
    const requiredField = ["id", "code", "name", "credits", "semester", "description", "instructor"]

    for (const rf of requiredField) {
        if (!req.body[rf]) {
            return res.status(400).json({error: `${rf} is required`})
        }
    }

    res.json({message: "not finish"})
})
app.patch('/courses/:id', (req,res)=>{
    const {id} = req.params
    const course = courses.find(c => c.id == id)

    // test
    const xs = req.body
    for (const x of xs) {
        console.log(x[1])
    }

    if (!course) {
        return res.status(404).json({error: `course not found`})
    }

    const allowedField = ["code","name","credits","semester","prerequisites","description","instructor"]
    const updates = Object.keys(req.body)
    for (const u of updates) {
        if (!allowedField.includes(u)) {
            return res.status(400).json({error: `unknow field ${rf}`})
        }
    }

    // didn't update .json file
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
    console.log(`listen at ${process.env.PORT}`);
})