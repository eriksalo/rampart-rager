const AWS = require('aws-sdk');
const XLSX = require('xlsx');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    try {
        // Handle S3 trigger
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        
        console.log(`Processing file: ${key} from bucket: ${bucket}`);
        
        // Download file from S3
        const data = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();
        
        // Parse Excel file
        const workbook = XLSX.read(data.Body);
        
        // Process registration report sheet
        const registrationSheet = workbook.Sheets['Sheet 1 - registration_report'] || 
                                workbook.Sheets[workbook.SheetNames[0]];
        const registrationData = XLSX.utils.sheet_to_json(registrationSheet, { header: 1 });
        
        // Process each race sheet (100K, 70K, 50K)
        const raceSheets = ['100K', '70K', '50K'];
        const allResults = [];
        
        for (const race of raceSheets) {
            if (workbook.Sheets[race]) {
                const raceData = XLSX.utils.sheet_to_json(workbook.Sheets[race], { header: 1 });
                
                // Skip header row and process results
                for (let i = 1; i < raceData.length; i++) {
                    const row = raceData[i];
                    if (row.length > 4 && row[4]) { // Has bib number
                        const result = {
                            id: `${race}-${row[4]}`, // race-bib as ID
                            bib: parseInt(row[4]),
                            firstName: row[6] || '',
                            lastName: row[5] || '',
                            elapsedTime: formatTime(row[7]),
                            race: race,
                            category: getCategory(row[4], registrationData),
                            gender: getGender(row[1]),
                            place: parseInt(row[3]) || 0,
                            finishTime: '',
                            startTime: '08:00:00',
                            age: getAge(row[4], registrationData)
                        };
                        
                        if (result.bib && result.firstName && result.lastName) {
                            allResults.push(result);
                        }
                    }
                }
            }
        }
        
        // Batch write to DynamoDB
        const tableName = process.env.API_RACERESULTS_RACERESUITTABLE_NAME;
        
        for (let i = 0; i < allResults.length; i += 25) {
            const batch = allResults.slice(i, i + 25);
            const putRequests = batch.map(result => ({
                PutRequest: {
                    Item: result
                }
            }));
            
            await dynamodb.batchWrite({
                RequestItems: {
                    [tableName]: putRequests
                }
            }).promise();
        }
        
        // Update race metadata
        const metaTableName = process.env.API_RACERESULTS_RACEMETATABLE_NAME;
        await dynamodb.put({
            TableName: metaTableName,
            Item: {
                id: 'rampart-rager-2024',
                raceName: 'Rampart Rager Ultra Marathon',
                raceDate: '2024-08-19',
                lastUpdated: new Date().toISOString()
            }
        }).promise();
        
        console.log(`Successfully processed ${allResults.length} race results`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully processed ${allResults.length} race results`,
                results: allResults.length
            })
        };
        
    } catch (error) {
        console.error('Error processing file:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};

// Helper functions
function formatTime(timeValue) {
    if (!timeValue) return '';
    
    if (typeof timeValue === 'string') {
        return timeValue;
    }
    
    // Handle Excel date/time format
    if (typeof timeValue === 'number') {
        const date = new Date((timeValue - 25569) * 86400 * 1000);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return String(timeValue);
}

function getCategory(bib, registrationData) {
    const runner = registrationData.find(row => row[0] === bib);
    return runner ? runner[7] || 'Open' : 'Open';
}

function getGender(genderValue) {
    if (typeof genderValue === 'string') {
        return genderValue.toUpperCase();
    }
    return 'MALE'; // default
}

function getAge(bib, registrationData) {
    const runner = registrationData.find(row => row[0] === bib);
    return runner ? runner[9] || 0 : 0;
}