const AWS = require('aws-sdk');
const XLSX = require('xlsx');

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('=== LAMBDA FUNCTION STARTED ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        // Handle S3 trigger
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
        
        console.log(`=== Processing file: ${key} from bucket: ${bucket} ===`);
        
        // Download file from S3
        const data = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();
        
        // Parse CSV file
        let rows;
        if (key.toLowerCase().endsWith('.csv')) {
            console.log('Processing CSV file');
            const csvText = data.Body.toString('utf8');
            rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
        } else {
            console.log('Processing Excel file');
            const workbook = XLSX.read(data.Body);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        }
        
        console.log(`Total rows: ${rows.length}`);
        console.log('Sample rows:', rows.slice(0, 3));
        
        const allResults = [];
        
        // Process each row (skip empty rows)
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip empty rows
            if (!row || row.length === 0 || !row[0] || row[0] === '') continue;
            
            const bib = parseInt(row[0]);
            const lastName = (row[1] || '').toString().trim();
            const firstName = (row[2] || '').toString().trim();
            const raceFinishTime = (row[3] || '').toString().trim();
            const komFinishTime = (row[4] || '').toString().trim();
            const race = (row[5] || '').toString().trim();
            const category = (row[6] || 'Open').toString().trim();
            const age = parseInt(row[7]) || 0;
            const gender = (row[8] || 'MALE').toString().trim().toUpperCase();
            
            // Skip if missing essential data
            if (!bib || !firstName || !lastName) {
                console.log(`Skipping row ${i}: missing essential data`);
                continue;
            }
            
            console.log(`Processing: ${bib} ${firstName} ${lastName} - Race: ${race} (${raceFinishTime}) KOM: (${komFinishTime})`);
            
            // Create race result if we have race data
            if (race && raceFinishTime && (race === '100K' || race === '70K' || race === '50K')) {
                const raceElapsed = calculateElapsed('8:00:00', raceFinishTime);
                
                if (raceElapsed) {
                    allResults.push({
                        id: `${race}-${bib}`,
                        bib: bib,
                        firstName: firstName,
                        lastName: lastName,
                        elapsedTime: raceElapsed,
                        finishTime: raceFinishTime,
                        startTime: '8:00:00',
                        race: race,
                        category: category,
                        gender: gender,
                        age: age,
                        place: 0
                    });
                    console.log(`  → Created ${race} result: ${raceElapsed}`);
                }
            }
            
            // Create KOM result if we have KOM finish time
            if (komFinishTime) {
                const komElapsed = calculateElapsed('8:30:00', komFinishTime);
                
                if (komElapsed) {
                    allResults.push({
                        id: `KOM-${bib}`,
                        bib: bib,
                        firstName: firstName,
                        lastName: lastName,
                        elapsedTime: komElapsed,
                        finishTime: komFinishTime,
                        startTime: '8:30:00',
                        race: 'KOM',
                        category: category,
                        gender: gender,
                        age: age,
                        place: 0
                    });
                    console.log(`  → Created KOM result: ${komElapsed}`);
                }
            }
        }
        
        console.log(`=== Total results created: ${allResults.length} ===`);
        
        if (allResults.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No valid results found', results: 0 })
            };
        }
        
        // Calculate places for each race
        const raceGroups = {};
        allResults.forEach(result => {
            if (!raceGroups[result.race]) {
                raceGroups[result.race] = [];
            }
            raceGroups[result.race].push(result);
        });
        
        // Sort each race by elapsed time and assign places
        Object.keys(raceGroups).forEach(raceType => {
            raceGroups[raceType].sort((a, b) => {
                const timeA = timeToSeconds(a.elapsedTime);
                const timeB = timeToSeconds(b.elapsedTime);
                return timeA - timeB;
            });
            
            raceGroups[raceType].forEach((result, index) => {
                result.place = index + 1;
            });
            
            console.log(`${raceType}: ${raceGroups[raceType].length} results ranked`);
        });
        
        // Clear existing results
        const tableName = process.env.API_RACERESULTS_RACERESUITTABLE_NAME;
        console.log('Clearing existing results...');
        
        let scanParams = { TableName: tableName };
        let existingItems = [];
        let scanData;
        
        do {
            scanData = await dynamodb.scan(scanParams).promise();
            existingItems = existingItems.concat(scanData.Items);
            scanParams.ExclusiveStartKey = scanData.LastEvaluatedKey;
        } while (scanData.LastEvaluatedKey);
        
        console.log(`Deleting ${existingItems.length} existing items`);
        
        // Delete in batches
        for (let i = 0; i < existingItems.length; i += 25) {
            const batch = existingItems.slice(i, i + 25);
            const deleteRequests = batch.map(item => ({
                DeleteRequest: { Key: { id: item.id } }
            }));
            
            if (deleteRequests.length > 0) {
                await dynamodb.batchWrite({
                    RequestItems: { [tableName]: deleteRequests }
                }).promise();
            }
        }
        
        // Insert new results in batches
        console.log('Inserting new results...');
        for (let i = 0; i < allResults.length; i += 25) {
            const batch = allResults.slice(i, i + 25);
            const putRequests = batch.map(result => ({
                PutRequest: { Item: result }
            }));
            
            await dynamodb.batchWrite({
                RequestItems: { [tableName]: putRequests }
            }).promise();
        }
        
        // Update metadata
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
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Helper function to calculate elapsed time
function calculateElapsed(startTime, finishTime) {
    if (!startTime || !finishTime) return null;
    
    const startSeconds = timeToSeconds(startTime);
    const finishSeconds = timeToSeconds(finishTime);
    
    if (finishSeconds > startSeconds) {
        const elapsed = finishSeconds - startSeconds;
        return secondsToTime(elapsed);
    }
    
    return null;
}

// Convert HH:MM:SS to seconds
function timeToSeconds(timeString) {
    if (!timeString) return 0;
    const parts = timeString.split(':');
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
}

// Convert seconds to HH:MM:SS
function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}