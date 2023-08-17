const mysql = require('mysql');

exports.handler = async(event) => {
    try {
        const connection = mysql.createConnection({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PSWD,
            database: process.env.DB,
            port: process.env.PORT,
            connectionLimit: 1000,
            connectTimeout: 60 * 60 * 1000,
            acquireTimeout: 60 * 60 * 1000,
            timeout: 60 * 60 * 1000,
        })

        connection.connect((error) => {
            if (error) 
                console.log('Connection failed!', error)
            else
                console.log('Connection successful.')
        })

        let query = 'SELECT * FROM Regions';
        let data;
        
        const id = event.body.id || '';

        if (id !== '') {
            query = 'SELECT * FROM Regions WHERE id = ?'
            data = await new Promise((resolve, reject) => {
                connection.query(query, [id], (error, result) => {
                    connection.end();

                    if (error) {
                        console.log('An error occurred:', error);
                        reject(error);
                    }
                    else
                        resolve(result)
                })
            })
        }
        else {
            data = await new Promise((resolve, reject) => {
                connection.query(query, (error, result) => {
                    connection.end();

                    if (error) {
                        console.log('An error occurred:', error);
                        reject(error);
                    }
                    else
                        resolve(result)
                })
            })
        }

        if (data && data.length > 0) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: data 
            }
        }
        else {
            return {
                statusCode: 400,
                message: 'No records found.'
            }
        }
    }
    catch (error) {
        console.log(error)
        return {
            statusCode: 500,
            message: 'An unexpected error occurred.'
        }
    }
}