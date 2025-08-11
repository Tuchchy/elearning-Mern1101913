const express = require('express')
const router = express.Router()

const { getStudent, getStudentById, createStudent, updateStudent, deleteStudent } = require("../controllers/student.controller.js")

router.get('/', getStudent)
router.get('/:id', getStudentById)
router.post('/', createStudent)
router.patch('/:id', updateStudent)
router.delete('/:id', deleteStudent)

module.exports = {router}
