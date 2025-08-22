const db = require('../configs/db')

function withFullImageUrl(row, req) {
    if (row.imageUrl && !row.imageUrl.startsWith('http')) {
        row.imageUrl = `${req.protocol}://${req.get('host')}${row.imageUrl}`;
    }
    return row;
}

async function getCourses(req, res) {
    // query course, course module(count lesson)
    try {
        const [crows] = await db.execute('SELECT * FROM Courses')
        if (!crows.length) {
            return res.status(404).json({ error: 'course not found' })
        }

        const courses = crows.map(row => withFullImageUrl(row, req));
        const [mrows] = await db.execute('SELECT * FROM CourseModules')

        console.log(`[API] get all courses`);
        res.json({ courses, module: mrows })
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

        const course = withFullImageUrl(crows[0], req);
        if (!crows.length) {
            return res.status(404).json({ error: 'course not found' })
        }

        const [mrows] = await db.execute('SELECT * FROM CourseModules WHERE course_id=?', [req.params.id])
        if (mrows.length > 0) {
            [arows] = await db.execute('SELECT * FROM CourseModuleAssets WHERE cmid=?', [mrows[0].id])
        }

        const send = {
            courses: course,
            modules: mrows,
            asset: arows,
            enroll: erows
        }
        // console.log(send);
        
        console.log(`[API] get course by id`);
        res.json(send)

    } catch (error) {
        console.log('Error /courses/:id, ' + error);
        res.status(500).json({ error })
    }
}

async function createCourse(req, res) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        let rmrows, rarows;

        // parse body
        const { title, detail } = req.body;
        let modules = [];
        if (req.body.modules) {
            modules = JSON.parse(req.body.modules); // string → object
        }

        // course image
        let imageUrl;
        const poster = req.files.find((f) => f.fieldname === "poster");
        if (poster) {
            imageUrl = `/images/uploads/courses/${poster.filename}`;
        } else {
            imageUrl = `/images/uploads/courses/default${Math.floor(Math.random() * 2) + 1}.png`;
        }

        // insert course
        const [crows] = await conn.execute(
            `INSERT INTO Courses(title, detail, imageUrl, create_by) VALUES (?,?,?,?)`,
            [title, detail, imageUrl, 1]
        );
        const courseId = crows.insertId;

        // modules loop
        for (let mIndex = 0; mIndex < modules.length; mIndex++) {
            const module = modules[mIndex];

            // ถ้าเป็น file → หาไฟล์จาก req.files
            if (module.content_type === "file") {
                const file = req.files.find(
                    (f) => f.fieldname === `moduleFiles[${mIndex}]`
                );
                if (file) {
                    module.content = `/images/uploads/courses/${file.filename}`;
                }
            }

            const [mrows] = await conn.execute(
                `INSERT INTO CourseModules(course_id, title, content_type, content) VALUES (?,?,?,?)`,
                [courseId, module.title, module.content_type, module.content]
            );
            rmrows = mrows;
            const moduleId = mrows.insertId;

            // assets loop
            if (Array.isArray(module.assets)) {
                for (let aIndex = 0; aIndex < module.assets.length; aIndex++) {
                    const asset = module.assets[aIndex];

                    if (asset.asset_type === "file") {
                        const file = req.files.find(
                            (f) => f.fieldname === `assetFiles[${mIndex}][${aIndex}]`
                        );
                        if (file) {
                            asset.asset_url = `/images/uploads/courses/${file.filename}`;
                        }
                    }

                    const [arows] = await conn.execute(
                        `INSERT INTO CourseModuleAssets(cmid, asset_type, asset_url, is_download) VALUES (?,?,?,?)`,
                        [moduleId, asset.asset_type, asset.asset_url, asset.is_download ? 1 : 0]
                    );
                    rarows = arows;
                }
            }
        }

        await conn.commit();
        res.json({
            message: "course create successful",
            create: { crows, rmrows, rarows },
        });
    } catch (error) {
        console.error("Error:", error);
        await conn.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        conn.release();
    }
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
            // console.log('Update Courses');
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
                    // console.log('Update CourseModules');
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
                            // console.log('Update CourseModuleAssets');
                        }
                    }
                }
            }
        }

        await conn.commit();
        console.log(`[API] update courses by id`);
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
            res.status(404).json({ message: "course not exists" })
        }
        console.log(`[API] delete course by id`);
        res.json({ result })
    } catch (error) {
        res.status(500).json({ error })
    }
}

module.exports = { getCourses, getCourseById, createCourse, updateCourse, deleteCourse }