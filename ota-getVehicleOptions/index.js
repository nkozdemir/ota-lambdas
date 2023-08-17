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

        let query = 'SELECT * FROM VehicleOptions';

        const vehicle_id = event.body.vehicle_id || '';
        const vehicle_make = event.body.vehicle_make || '';
        const vehicle_model = event.body.vehicle_model || '';
        const vehicle_year = event.body.vehicle_year || '';
        let conditions = [];
        let values = [];

        if (vehicle_id !== '') {
            conditions.push('vehicle_id = ?');
            values.push(vehicle_id);
        }
        if (vehicle_make !== '') {
            conditions.push('vehicle_make = ?');
            values.push(vehicle_make);
        }
        if (vehicle_model !== '') {
            conditions.push('vehicle_model = ?');
            values.push(vehicle_model);
        }
        if (vehicle_year !== '') {
            const years = vehicle_year.split('-');
            conditions.push('vehicle_year_from = ?')
            values.push(years[0]);
            conditions.push('vehicle_year_to = ?')
            values.push(years[1]);
        }

        if (conditions.length > 0)
            query += ' WHERE ' + conditions.join(' AND ');

        const data = await new Promise((resolve, reject) => {
            connection.query(query, values, (error, result) => {
                connection.end();

                if (error) {
                    console.log('An error occurred:', error);
                    reject(error);
                }
                else
                    resolve(result)
            })
        })

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