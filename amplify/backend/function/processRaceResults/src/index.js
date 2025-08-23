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
        console.log(`File extension: ${key.toLowerCase().split('.').pop()}`);
        
        // Download file from S3
        const data = await s3.getObject({
            Bucket: bucket,
            Key: key
        }).promise();
        
        // Parse CSV/Excel file
        let mainData;
        
        if (key.toLowerCase().endsWith('.csv')) {
            // Handle CSV file
            console.log('Processing CSV file');
            const csvText = data.Body.toString('utf8');
            console.log('Raw CSV text (first 500 chars):', csvText.substring(0, 500));
            mainData = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim()));
            console.log('Parsed CSV rows:', mainData.length);
            console.log('First few rows:', mainData.slice(0, 3));
        } else {
            // Handle Excel file
            console.log('Processing Excel file');
            const workbook = XLSX.read(data.Body);
            const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
            mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
        }
        
        const allResults = [];
        
        // Process all rows (assuming first row might be data, not header)
        console.log(`Total rows: ${mainData.length}`);
        console.log(`First row:`, mainData[0]);
        console.log(`Second row:`, mainData[1]);
        
        // Use constant start times as specified by user
        let raceStartTimeConstant = '8:00:00';  // Race start time
        let komStartTimeConstant = '8:30:00';   // KOM start time
        
        console.log(`Using constant start times: Race=${raceStartTimeConstant}, KOM=${komStartTimeConstant}`);
        
        // Start from row 0 (process all data rows)
        let startRow = 0;
        console.log(`Processing ${mainData.length - startRow} data rows with start times: Race=${raceStartTimeConstant}, KOM=${komStartTimeConstant}`);
        
        for (let i = startRow; i < mainData.length; i++) {
            const row = mainData[i];
            
            // Skip empty rows or rows without bib number
            if (!row || row.length === 0 || !row[0] || row[0] === '') {
                console.log(`  → Skipping empty row ${i}: row length=${row ? row.length : 0}, first cell="${row ? row[0] : 'undefined'}"`);
                continue;
            }
            
            console.log(`Processing row ${i} with ${row.length} columns:`, row);
            
            const bib = parseInt(row[0]);
            const lastName = formatTime(row[1]) || '';
            const firstName = formatTime(row[2]) || '';
            const raceFinishTime = formatTime(row[3]);
            const komFinishTime = formatTime(row[4]);
            const race = formatTime(row[5]) || '';  // e.g., "100K"
            const category = formatTime(row[6]) || 'Open';
            const age = parseInt(row[7]) || 0;
            const gender = (formatTime(row[8]) || 'MALE').toUpperCase();
            // Row[9] is empty column in CSV - skip it
            // Use constant start times
            const raceStartTime = raceStartTimeConstant;
            const komStartTime = komStartTimeConstant;
            
            console.log(`  → Parsed data: bib=${bib}, name="${firstName} ${lastName}", race="${race}", raceFinish="${raceFinishTime}", komFinish="${komFinishTime}", category="${category}", gender="${gender}", age=${age}`);
            
            // Calculate elapsed times from start and finish times
            const raceElapsedTime = calculateElapsedTime(raceStartTime, raceFinishTime);
            const komElapsedTime = calculateElapsedTime(komStartTime, komFinishTime);
            
            console.log(`Row ${i}: Bib=${bib}, Name=${firstName} ${lastName}`);
            console.log(`  Race: "${race}", Category: "${category}", Age: ${age}, Gender: ${gender}`);
            console.log(`  Race: Start=${raceStartTime}, Finish=${raceFinishTime}, Elapsed=${raceElapsedTime}`);
            console.log(`  KOM: Start=${komStartTime}, Finish=${komFinishTime}, Elapsed=${komElapsedTime}`);
            console.log(`  Raw row data:`, row);
            
            // Create race result entry if we have essential data
            if (bib && firstName && lastName && race) {
                const raceResult = {
                    id: `${race}-${bib}`, // race-bib as ID
                    bib: bib,
                    firstName: firstName,
                    lastName: lastName,
                    elapsedTime: raceElapsedTime,
                    finishTime: raceFinishTime,
                    startTime: raceStartTime,
                    race: race,
                    category: category,
                    gender: gender,
                    age: age,
                    place: 0 // Will be calculated based on elapsed time
                };
                
                allResults.push(raceResult);
                console.log(`  → Created ${race} result: elapsedTime=${raceResult.elapsedTime}`);
            } else {
                console.log(`  → Skipped race result: Missing data - bib=${bib}, firstName=${firstName}, lastName=${lastName}, race=${race}, raceElapsedTime=${raceElapsedTime}`);
            }
            
            // Create KOM result entry if we have participant data and KOM finish time
            if (bib && firstName && lastName && komFinishTime) {
                const komResult = {
                    id: `KOM-${bib}`, // KOM-bib as ID
                    bib: bib,
                    firstName: firstName,
                    lastName: lastName,
                    elapsedTime: komElapsedTime,
                    finishTime: komFinishTime,
                    startTime: komStartTime,
                    race: 'KOM',
                    category: category,
                    gender: gender,
                    age: age,
                    place: 0 // Will be calculated based on elapsed time
                };
                
                allResults.push(komResult);
                console.log(`  → Created KOM result: elapsedTime=${komResult.elapsedTime}`);
            } else if (bib && firstName && lastName) {
                console.log(`  → Skipped KOM result: No calculated elapsed time - komElapsedTime=${komElapsedTime}`);
            }
        }
        
        console.log(`=== Total results created: ${allResults.length} ===`);
        
        if (allResults.length === 0) {
            console.log('WARNING: No results were created from the uploaded file!');
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'File processed but no valid results found',
                    results: 0
                })
            };
        }
        
        // Calculate places for each race based on elapsed time
        const raceGroups = {};
        allResults.forEach(result => {
            if (!raceGroups[result.race]) {
                raceGroups[result.race] = [];
            }
            raceGroups[result.race].push(result);
        });
        
        console.log('Race groups:', Object.keys(raceGroups).map(race => `${race}: ${raceGroups[race].length}`));
        
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
            
            console.log(`${race}: ${raceGroups[race].length} results sorted and placed`);
        });
        
        // Clear all existing race results before adding new ones
        const tableName = process.env.API_RACERESULTS_RACERESUITTABLE_NAME;
        console.log('Clearing existing race results...');
        
        // First, scan to get all existing items
        let scanParams = {
            TableName: tableName
        };
        
        let existingItems = [];
        let scanData;
        
        do {
            scanData = await dynamodb.scan(scanParams).promise();
            existingItems = existingItems.concat(scanData.Items);
            scanParams.ExclusiveStartKey = scanData.LastEvaluatedKey;
        } while (scanData.LastEvaluatedKey);
        
        console.log(`Found ${existingItems.length} existing items to delete`);
        
        // Delete existing items in batches
        for (let i = 0; i < existingItems.length; i += 25) {
            const batch = existingItems.slice(i, i + 25);
            const deleteRequests = batch.map(item => ({
                DeleteRequest: {
                    Key: { id: item.id }
                }
            }));
            
            if (deleteRequests.length > 0) {
                await dynamodb.batchWrite({
                    RequestItems: {
                        [tableName]: deleteRequests
                    }
                }).promise();
            }
        }
        
        console.log('Finished clearing existing results');
        
        // Batch write new results to DynamoDB
        
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
        return timeValue.trim();
    }
    
    // Handle Excel date/time format
    if (typeof timeValue === 'number') {
        const date = new Date((timeValue - 25569) * 86400 * 1000);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return String(timeValue).trim();
}

// Parse time string (HH:MM:SS) to total seconds
function timeToSeconds(timeString) {
    if (!timeString || timeString === '') return 0;
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
}

// Convert seconds back to HH:MM:SS format
function secondsToTime(seconds) {
    if (seconds <= 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate elapsed time between start and finish times
function calculateElapsedTime(startTime, finishTime) {
    if (!startTime || !finishTime) return '';
    
    const startSeconds = timeToSeconds(startTime);
    const finishSeconds = timeToSeconds(finishTime);
    
    if (finishSeconds > startSeconds) {
        return secondsToTime(finishSeconds - startSeconds);
    }
    
    return '';
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