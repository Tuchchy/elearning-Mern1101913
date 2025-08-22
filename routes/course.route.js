const express = require('express')
const router = express.Router()

const { getCourses, getCourseById, updateCourse, deleteCourse, createCourse } = require('../controllers/course.controller')
const { upload } = require('../middlewares/uploadImgCourse')


router.get('/', getCourses)
router.get('/:id', getCourseById)
router.post('/', upload.any(), createCourse)
router.patch('/:id', upload.single('cimg'), updateCourse)
router.delete('/:id', deleteCourse)

/**
 * @openapi
 * /api/courses:
 *   get:
 *     summary: Get all courses with modules
 *     description: Retrieve all courses and course modules from the database
 *     tags:
 *       - Courses
 *     responses:
 *       200:
 *         description: List of courses and modules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                 module:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: No courses found
 *       500:
 *         description: Server error
 * 
 *   post:
 *     summary: Create a new course
 *     description: Create a new course with title, detail, creator, and optional poster image
 *     tags:
 *       - Courses
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               detail:
 *                 type: string
 *               createBy:
 *                 type: integer
 *               poster:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: object
 *       500:
 *         description: Server error
 *
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID including modules, assets, and enrollments
 *     description: Retrieve detailed course info by id
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                 asset:
 *                   type: array
 *                   items:
 *                     type: object
 *                 enroll:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 *
 *   patch:
 *     summary: Update course info, modules and assets
 *     description: Update course fields, modules, and nested assets
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               detail:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     content_type:
 *                       type: string
 *                     content:
 *                       type: string
 *                     assets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           asset_type:
 *                             type: string
 *                           asset_url:
 *                             type: string
 *                           is_download:
 *                             type: boolean
 *     responses:
 *       200:
 *         description: Update successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Update failed
 *
 *   delete:
 *     summary: Delete a course by ID
 *     description: Delete course by id; cascades delete to related entities if FK with ON DELETE CASCADE exists
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID to delete
 *     responses:
 *       200:
 *         description: Delete success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: object
 *       404:
 *         description: Course not exists
 *       500:
 *         description: Server error
*/



module.exports = { router }