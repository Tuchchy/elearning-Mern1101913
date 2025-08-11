const express = require('express')
const router = express.Router()

const { getActivity, getActivityById, createActivity, updateActivity, deleteActivity } = require('../controllers/activity.controller.js')
const { upload } = require('../middlewares/uploadImgActivity.js')

router.get('/', getActivity)
router.get('/:id', getActivityById)
router.post('', upload.single('poster'), createActivity)
router.patch('/:id', upload.single('poster'), updateActivity)
router.delete('/:id', deleteActivity)

/**
 * @openapi
 * /api/activity:
 *   get:
 *     summary: Get all activities
 *     description: Retrieve all activities from the database
 *     tags:
 *       - Activity
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Error on API server
 *   post:
 *     summary: Create one activity
 *     description: Create a new activity with title, content, detail, image, lecturer, start_date, and end_date
 *     tags:
 *       - Activity
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               detail:
 *                 type: string
 *               lecturer:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Activity created successfully
 *       500:
 *         description: Error on API server
 *   patch:
 *     summary: Update one activity
 *     description: Update an existing activity by ID
 *     tags:
 *       - Activity
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               detail:
 *                 type: string
 *               lecturer:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date-time
 *               end_date:
 *                 type: string
 *                 format: date-time
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Error on API server
 *   delete:
 *     summary: Delete one activity
 *     description: Delete an existing activity by ID
 *     tags:
 *       - Activity
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Error on API server
*/

/**
 * @openapi
 * /api/activity/{id}:
 *   get:
 *     summary: Get one activity by ID
 *     description: Retrieve a single activity by its ID
 *     tags:
 *       - Activity
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The activity ID
 *     responses:
 *       200:
 *         description: The requested activity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 row:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Activity not found
 *       500:
 *         description: Error on API server
*/


module.exports = { router }