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

        const campaign_name = event.body.campaign_name || '';
        const campaign_description = event.body.campaign_description || '';
        const region_id = event.body.region_id || [];
        const vehicle_sw_config_id = event.body.vehicle_sw_config_id || '';
        const vehicle_id = event.body.vehicle_id || '';
        const vin_number = event.body.vin_number|| '';

        if (campaign_name === '' || campaign_description === '' || region_id.length === 0 || vehicle_sw_config_id === '' || vehicle_id === '' || vin_number === '') {
            return {
                statusCode: 400,
                message: 'campaign_name, campaign_description, region_id, vehicle_sw_config_id, vehicle_id and vin_number are required'
            }
        }
        
        // check if region_id exists in db
        const regionQuery = 'SELECT COUNT(*) AS count FROM Regions WHERE id IN (?)';
        const checkRegion = await new Promise((resolve, reject) => {
            connection.query(regionQuery, [region_id], (error, result) => {
                if (error) {
                    console.error(error);
                    reject(error);
                }
                else
                    resolve(result[0].count);       
            });
        });
        if (checkRegion !== region_id.length) {
            return {
                statusCode: 400,
                message: "regions(s) with provided region id(s) not found"
            }
        }
        
        // check if vehicle_sw_config_id exists in db
        const configQuery = "SELECT COUNT(*) AS count FROM VehicleConfigurations WHERE vehicle_sw_config_id = ?";
        const checkConfig = await new Promise((resolve, reject) => {
            connection.query(configQuery, [vehicle_sw_config_id], (error, result) => {
                if (error) {
                    console.error(error)
                    reject(error);
                }
                else 
                    resolve(result[0].count);
            });
        });
        if (checkConfig == 0) {
            return {
                statusCode: 400,
                message: "vehicle configuration with provided vehicle_sw_config_id not found"
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

        // perform insertion
        const query = 'INSERT INTO Campaigns SET ?'
        const insert = {
            campaign_name: campaign_name,
            campaign_description: campaign_description,
            region_id: JSON.stringify(region_id),
            vehicle_sw_config_id: vehicle_sw_config_id,
            vehicle_id: vehicle_id,
            vin_number: vin_number,
            created_date: getCurrentDateTimeMySQLFormat()
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