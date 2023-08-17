const mysql = require('mysql');

function getCurrentDateTimeMySQLFormat() {
  const now = new Date();
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Istanbul',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const formattedDateTime = formatter.format(now);

  return formattedDateTime;
}

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

        const vehicle_sw_config_name = event.body.vehicle_sw_config_name || '';
        const vehicle_id = event.body.vehicle_id || '';
        const subsystem_id = event.body.subsystem_id || [];
        const subsystem_version = event.body.subsystem_version || [];

        if (vehicle_sw_config_name === '' || vehicle_id === '' || subsystem_id.length === 0 || subsystem_version.length === 0) {
            return {
                statusCode: 400,
                message: 'vehicle_sw_config_name, vehicle_id, subsystem_id and subsystem_version are required'
            }
        }
        
        // check if vehicle_id exists in db
        const vehicleQuery = "SELECT COUNT(*) AS count FROM VehicleOptions WHERE vehicle_id = ?";
        const checkVehicle = await new Promise((resolve, reject) => {
            connection.query(vehicleQuery, [vehicle_id], (error, result) => {
                if (error) {
                    console.error(error)
                    reject(error);
                }
                else 
                    resolve(result[0].count);
            });
        });
        if (checkVehicle == 0) {
            return {
                statusCode: 400,
                message: "vehicle with provided vehicle_id not found"
            }
        }
        
        // check if subsystem ids exists in db
        const sysQuery = 'SELECT COUNT(*) AS count FROM Subsystems WHERE sys_id IN (?)';
        const checkSys = await new Promise((resolve, reject) => {
            connection.query(sysQuery, [subsystem_id], (error, result) => {
                if (error) {
                    console.error(error);
                    reject(error);
                }
                else
                    resolve(result[0].count);       
            });
        });
        if (checkSys !== subsystem_id.length) {
            return {
                statusCode: 400,
                message: "subsystem(s) with provided subsystem id(s) not found"
            }
        }

        // perform insertion
        const query = 'INSERT INTO VehicleConfigurations SET ?'
        const insert = {
            vehicle_sw_config_name: vehicle_sw_config_name,
            vehicle_id: vehicle_id,
            subsystem_id: JSON.stringify(subsystem_id),
            subsystem_version: JSON.stringify(subsystem_version),
            date: getCurrentDateTimeMySQLFormat()
        }

        const data = await new Promise((resolve, reject) => {
            connection.query(query, insert, (error, result) => {
                if (error) {
                    console.log('An error occurred:', error)
                    reject(error);
                }
                else 
                    resolve(result);
            })
        })

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: insert
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