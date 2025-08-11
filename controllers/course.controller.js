const db = require('../configs/db')

async function getCourses(req, res) {
    // query course, course module(count lesson)
    try {
        const [crows] = await db.execute('SELECT * FROM Courses')
        if (!crows.length) {
            return res.status(404).json({ error: 'course not found' })
        }
        const [mrows] = await db.execute('SELECT * FROM CourseModules')

        res.json({ courses: crows, module: mrows })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
}

async function getCourseById(req, res) {
    try {
        let arows = [];

        const [crows] = await db.execute('SELECT * FROM Courses WHERE id=?', [req.params.id])
        const [erows] = await db.execute('SELECT * FROM CourseEnrollments WHERE cid=?', [req.params.id])

        if (!crows.length) {
            return res.status(404).json({ error: 'course not found' })
        }

        const [mrows] = await db.execute('SELECT * FROM CourseModules WHERE course_id=?', [req.params.id])
        if (mrows.length > 0) {
            [arows] = await db.execute('SELECT * FROM CourseModuleAssets WHERE cmid=?', [mrows[0].id])
        }

        const send = {
            courses: crows,
            modules: mrows,
            asset: arows,
            enroll: erows
        }
        console.log('API: ', send);
        res.json(send)

    } catch (error) {
        console.log('Error /courses/:id, ' + error);
        res.status(500).json({ error })
    }
}

async function createCourse(req, res) {
    const requiredField = ["code", "name", "credits", "semester", "description", "instructor"]

    for (const rf of requiredField) {
        if (!req.body[rf]) {
            return res.status(400).json({ error: `${rf} is required` })
        }
    }

    res.json({ message: "add courses success" })
}

async function updateCourse(req, res) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const allowedCourseField = ["title", "detail", "imageUrl"];
        const courseFields = [];
        const courseValues = [];

        // check json then add
        allowedCourseField.forEach(field => {
            if (req.body[field] !== undefined) {
                courseFields.push(`${field} = ?`);
                courseValues.push(req.body[field]);
            }
        });

        // exe query
        if (courseFields.length > 0) {
            await conn.execute(
                `UPDATE Courses SET ${courseFields.join(', ')} WHERE id = ?`,
                [...courseValues, req.params.id]
            );
            console.log('Update Courses');
        }

        // check .modules in json
        if (Array.isArray(req.body.modules)) {
            const allowedModuleField = ["title", "content_type", "content"];

            for (const module of req.body.modules) {
                const moduleFields = [];
                const moduleValues = [];

                allowedModuleField.forEach(field => {
                    if (module[field] !== undefined) {
                        moduleFields.push(`${field} = ?`);
                        moduleValues.push(module[field]);
                    }
                });

                // "id" for checking
                if (moduleFields.length > 0 && module.id) {
                    await conn.execute(
                        `UPDATE CourseModules SET ${moduleFields.join(', ')} WHERE id = ? AND course_id = ?`,
                        [...moduleValues, module.id, req.params.id]
                    );
                    console.log('Update CourseModules');
                }

                // iterate asset in .modules, then update
                if (Array.isArray(module.assets)) {
                    for (const asset of module.assets) {
                        const allowedAssetFields = ["asset_type", "asset_url", "is_download"];
                        const assetFields = [];
                        const assetValues = [];

                        allowedAssetFields.forEach(field => {
                            if (asset[field] !== undefined) {
                                assetFields.push(`${field} = ?`);
                                assetValues.push(asset[field]);
                            }
                        });

                        if (assetFields.length > 0 && asset.id) {
                            await conn.execute(
                                `UPDATE CourseModuleAssets SET ${assetFields.join(', ')} WHERE id = ? AND cmid = ?`,
                                [...assetValues, asset.id, module.id]
                            );
                            console.log('Update CourseModuleAssets');
                        }
                    }
                }
            }
        }

        await conn.commit();
        res.json({ message: 'Update successful' });

    } catch (error) {
        await conn.rollback();
        console.log('Error updating course with modules and assets:', error);
        res.status(500).json({ error: 'Update failed' });
    } finally {
        conn.release(); // to release resourse(pool) for next request
    }
}

async function deleteCourse(req, res) {
    try {
        const [result] = await db.execute('DELETE FROM Courses WHERE id=?', [req.params.id])
        if (result.affectedRows == 0) {
            res.status(404).json({message: "course not exists"})
        }
        console.log('delete succcess');
        res.json({result})
    } catch (error) {
        res.status(500).json({error})
    }
}

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse }