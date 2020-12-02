const AWS = require('aws-sdk');
const querystring = require('querystring');
const csv = require('fast-csv');
const findParticipantIndex = require('./common');

const doWrite = async (rows, s3, params) => {
    const data = await csv.writeToString(rows, {headers: true});
    const writeParams = {
        ...params,
        Body: data
    };
    await s3.putObject(writeParams).promise();
}

const appendDataToCSV = async (data, s3, bucket) => {
    const params = {
        Bucket: bucket,
        Key: 'results.csv'
    }
    const rows = [];
    const readStream = s3.getObject(params).createReadStream();
    return new Promise(((resolve, reject) => {
        csv.parseStream(readStream, {headers: true})
            .on('error', error => {
                reject(error);
            })
            .on('data', row => {
                if (row.participantId === data.participantId) {
                    const matchRow = {
                        ...row,
                        ...data
                    }
                    rows.push(matchRow)
                } else {
                    rows.push(row);
                }
            })
            .on('end', async rowCount => {
                console.log(`Row count ${rowCount - 1}`);
                await doWrite(rows, s3, params)
                resolve();
            })
    }));
}

exports.lambdaHandler = async (event, context) => {
    const bucket = process.env.EXPERIMENT_BUCKET;
    const rawBody = event.body;
    const data = querystring.parse(rawBody);
    const index = findParticipantIndex(data.participantId);
    if (index > -1) {
        const resultParams = {
            Bucket: bucket,
            Key: data.participantId + '-end.txt'
        }

        let text = '';
        const s3 = new AWS.S3();
        const endDateString = new Date().toISOString()
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'participantId') {
                text = text + '\n' + key + '\t' + value
            }
        }
        text = text + '\n' + 'END TIME' + '\t' + endDateString;
        resultParams['Body'] = text;
        const result = await s3.putObject(resultParams).promise();
        data['end'] = endDateString;
        await appendDataToCSV(data, s3, bucket);
        return {
            'statusCode': 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': JSON.stringify({status: 'OK'})
        }
    }
    return {
        'statusCode': 401,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        'body': JSON.stringify({status: 'NOPE'})
    }

}