const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/images/uploads/activities'
        cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + '-' + file.originalname
        cb(null, filename)
    }
})

const upload = multer({ storage })

module.exports = {upload}
