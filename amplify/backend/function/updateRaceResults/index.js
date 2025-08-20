const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    try {
        const body = JSON.parse(event.body);
        const tableName = process.env.API_RACERESULTS_RACERESUITTABLE_NAME;
        
        const params = {
            TableName: tableName,
            Key: {
                id: body.id
            },
            UpdateExpression: 'SET firstName = :firstName, lastName = :lastName, elapsedTime = :elapsedTime, category = :category, #place = :place',
            ExpressionAttributeNames: {
                '#place': 'place'
            },
            ExpressionAttributeValues: {
                ':firstName': body.firstName,
                ':lastName': body.lastName,
                ':elapsedTime': body.elapsedTime,
                ':category': body.category,
                ':place': body.place
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await dynamodb.update(params).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
            },
            body: JSON.stringify({
                message: 'Race result updated successfully',
                result: result.Attributes
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
