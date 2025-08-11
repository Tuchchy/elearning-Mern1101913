const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
    definition: {
        optnapi: "3.0.0",
        info: {
            title: "ELearning API Docs",
            version: "1.0.0",
            description: "API documentation for SutAct+ app"
        },
        servers: [
            {
                url: "http://localhost:3000/api",
            },
        ],
    },
    apis: ["./routes/*.js"]
}

const swaggerSpec = swaggerJsDoc(options)

function swaggerDocs(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

module.exports = swaggerDocs