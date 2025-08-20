const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    try {
        const { race, category } = event.queryStringParameters || {};
        const tableName = process.env.API_RACERESULTS_RACERESUITTABLE_NAME;
        
        let params = {
            TableName: tableName
        };
        
        // Add filters if provided
        if (race) {
            params.FilterExpression = '#race = :race';
            params.ExpressionAttributeNames = { '#race': 'race' };
            params.ExpressionAttributeValues = { ':race': race };
            
            if (category) {
                params.FilterExpression += ' AND category = :category';
                params.ExpressionAttributeValues[':category'] = category;
            }
        }
        
        const result = await dynamodb.scan(params).promise();
        
        // Sort by place
        const sortedResults = result.Items.sort((a, b) => a.place - b.place);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            },
            body: JSON.stringify({
                results: sortedResults,
                count: sortedResults.length
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};