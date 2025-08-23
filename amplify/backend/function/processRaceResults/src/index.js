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
        
        // Process the new combined Excel format
        // Use first sheet as it contains all data
        const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
        const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
        
        const allResults = [];
        
        // Skip header row and process results
        for (let i = 1; i < mainData.length; i++) {
            const row = mainData[i];
            if (row.length > 0 && row[0]) { // Has bib number
                const bib = parseInt(row[0]);
                const lastName = row[1] || '';
                const firstName = row[2] || '';
                const raceFinishTime = formatTime(row[3]);
                const raceElapsedTime = formatTime(row[4]);
                const komFinishTime = formatTime(row[5]);
                const komElapsedTime = formatTime(row[6]);
                const race = row[7] || '';
                const category = row[8] || 'Open';
                const age = parseInt(row[9]) || 0;
                const gender = (row[10] || 'MALE').toUpperCase();
                const raceStartTime = formatTime(row[11]) || '08:00:00';
                const komStartTime = formatTime(row[12]) || '';
                
                // Create race result entry
                if (bib && firstName && lastName && race) {
                    const raceResult = {
                        id: `${race}-${bib}`, // race-bib as ID
                        bib: bib,
                        firstName: firstName,
                        lastName: lastName,
                        elapsedTime: raceElapsedTime || '',
                        finishTime: raceFinishTime || '',
                        startTime: raceStartTime,
                        race: race,
                        category: category,
                        gender: gender,
                        age: age,
                        place: 0 // Will be calculated based on elapsed time
                    };
                    
                    allResults.push(raceResult);
                }
                
                // Create KOM result entry if KOM data exists
                if (bib && firstName && lastName && (komElapsedTime || komFinishTime)) {
                    const komResult = {
                        id: `KOM-${bib}`, // KOM-bib as ID
                        bib: bib,
                        firstName: firstName,
                        lastName: lastName,
                        elapsedTime: komElapsedTime || '',
                        finishTime: komFinishTime || '',
                        startTime: komStartTime || '',
                        race: 'KOM',
                        category: category,
                        gender: gender,
                        age: age,
                        place: 0 // Will be calculated based on elapsed time
                    };
                    
                    allResults.push(komResult);
                }
            }
        }
        
        // Calculate places for each race based on elapsed time
        const raceGroups = {};
        allResults.forEach(result => {
            if (!raceGroups[result.race]) {
                raceGroups[result.race] = [];
            }
            raceGroups[result.race].push(result);
        });
        
        // Sort by elapsed time and assign places
        Object.keys(raceGroups).forEach(race => {
            raceGroups[race].sort((a, b) => {
                const timeA = parseElapsedTime(a.elapsedTime);
                const timeB = parseElapsedTime(b.elapsedTime);
                return timeA - timeB;
            });
            
            raceGroups[race].forEach((result, index) => {
                result.place = index + 1;
            });
        });
        
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

function parseElapsedTime(timeString) {
    if (!timeString) return Infinity; // Put entries without times at the end
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds; // Convert to total seconds
    }
    
    return Infinity;
}