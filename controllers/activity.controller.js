const { error } = require('console');
const db = require('../configs/db')

async function getActivity(req, res) {
    try {
        const [rows] = await db.execute('SELECT * FROM Activities')
        res.json({ rows })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
}

async function getActivityById(req, res) {
    try {
        const [row] = await db.execute('SELECT * FROM Activities WHERE id = ?', [req.params.id])
        res.json({ row })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
}

async function createActivity (req, res) {
    console.log('AT create /api/activity');

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
}

async function updateActivity (req, res) {
    // Threat: sql injection
    console.log('AT /api/activity/:id');
    const field = []
    const value = []

    if (!req.file) {
        console.log(`image isn't update, file: ${req.file}`);
    } else {
        value.push(`/images/uploads/activities/${req.file.filename}`)
        field.push(`imageUrl=?`)
    }

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
    
    if (field.length == 0) {
        console.log('ERROR No Field');
        return res.status(404).json({error: "no field"})
    }

    try {
        console.log(
            `UPDATE Activities SET ${field.join(',')} WHERE id=?`, 
            [...value, req.params.id]
        );

        const [result] = await db.execute(
            `UPDATE Activities SET ${field.join(',')} WHERE id=?`,
            [...value, req.params.id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Activities not exists' })
        }

        // delete image file
        debugger
        const [rows] = await db.execute( // for get await get: TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
            `SELECT * FROM Users WHERE id=?`,
            [req.params.id]
        )
        
        const oldImg = rows[0]?.imageUrl
        if (req.file && oldImg) {
            const fs = require('fs').promises // the path of this file
            try {
                await fs.unlink('public' + oldImg) // fs start with this file path so it can go to /public, same as when node server.js
            } catch (error) {
                console.log('Request File Error, Image: ', error);
            }
        }

        console.log(result);
        res.json({ result })
    } catch (error) {
        console.log('500 ERROR: ', error);
        res.status(500).json({ error })
    }

}


async function deleteActivity (req, res) {
    try {
        const [result] = await db.execute('DELETE FROM Activities WHERE id=?', [req.params.id])
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'this activities not exists' })
        }
        res.json({ result })
    } catch (error) {
        res.status(500).json({ error })
    }
}


module.exports = {getActivity, getActivityById, createActivity, updateActivity, deleteActivity}