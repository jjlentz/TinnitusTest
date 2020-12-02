const AWS = require('aws-sdk');
const querystring = require('querystring');
const csv = require('fast-csv');

const doWrite = async (rows, s3, params) => {
    const data = await csv.writeToString(rows);
    const writeParams = {
        ...params,
        Body: data
    };
    await s3.putObject(writeParams).promise();
}

const appendCsv = async (newRow, s3, bucket) => {
    const resultsParams = {
        Bucket: bucket,
        Key: 'results.csv'
    }
    const rows = [];
    const readStream = s3.getObject(resultsParams).createReadStream();
    return new Promise(((resolve, reject) => {
        csv.parseStream(readStream)
            .on('error', error => {
                console.error(error);
                reject(error);
            })
            .on('data', row => rows.push(row))
            .on('end', async rowCount => {
                console.log(`Previous row count ${rowCount - 1}`);
                rows.push(newRow);
                await doWrite(rows, s3, resultsParams);
                resolve();
            });
    }))


}

const saveStartTime = async (newRow, s3, bucket) => {
    const now = new Date();
    const dateString = now.toISOString();
    let text = 'START TIME\t' + dateString
        + '\nBROWSER\t' + newRow.browser;
    const params = {
        Body: text,
        Bucket: bucket,
        Key: newRow.participantId + '.txt'
    }
    await s3.putObject(params).promise();
    newRow['start'] = dateString;
    await appendCsv(newRow, s3, bucket);
}

exports.lambdaHandler = async (event, context) => {
    const bucket = process.env.EXPERIMENT_BUCKET;

    const getParams = {
        Bucket: bucket,
        Key: 'participants.txt'
    }
    const participantIds = [];
    const s3 = new AWS.S3();
    try {
        const file = await s3.getObject(getParams).promise();
        const text = file.Body.toString('ascii');
        const lines = text.split('\n');
        lines.forEach(l => participantIds.push(l));
    } catch (err) {
        console.log(err);
    }
    const rawBody = event.body;
    let id = '';
    let data;
    if (rawBody.startsWith('participantId=')) {
        data = querystring.parse(rawBody);
        id = data.participantId
    } else {
        data = JSON.parse(event.body);
        id = data.participantId;
    }
    const index = participantIds.indexOf(id);
    if (index > -1) {
        await saveStartTime(data, s3, bucket);
        return {
            'statusCode': 200,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
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
};
