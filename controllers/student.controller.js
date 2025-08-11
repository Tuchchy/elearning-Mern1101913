const students = require('../database/mock/students.json')

function getStudent(req, res) {
    res.json(students)
}

function getStudentById(req, res) {
    const { id } = req.params
    const student = students.find(s => s.id == id)
    res.json(student)
}

function createStudent(req, res) {
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
}

function updateStudent(req, res) {
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
}

function deleteStudent(req, res) {
    const { id } = req.params
    const student = students.find(s => s.id == id)
    console.log(`delete student ${student.name}`);
    res.json({ deleted: student })
}

module.exports = {getStudent, getStudentById, createStudent, updateStudent, deleteStudent}