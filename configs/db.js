// import mysql from "mysql";
const mysql = require('mysql2/promise')
require('dotenv').config()

// กรณีปกติ
// let connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '368271',
//     database: 'elearn_app'
// })

let connection = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.DBPWD,
    database: process.env.DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
})

/* // กรณีพิเศษ authPlugins เป็น config สำหรับให้คุณกำหนด วิธี login” แบบ custom เอง เช่น เอา private key ไป encrypt แล้วตอบกลับ...
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '368271',
    database: 'elearn_app',
    authPlugins: {
        'ssh-key-auth': function ({ password }) {
            return function (pluginData) {
                return getPrivate(key)
                    .then((key) => {
                        const response = encrypt(key, password, pluginData);
                        // continue handshake by sending response data
                        return response;
                    })
                    .catch((err) => {
                        // throw error to propagate error to connect/changeUser handlers
                    });
            };
        },
    },
});
*/

/*
connection.connect()
connection.query('SELECT 1+1 AS solution', function (error, results, fields) {
    if (error) {
        console.log("error happen")
        throw error
    }
    console.log(`the solution is: ${results[0].solution}`);
})
// connection.end()
*/

module.exports = connection