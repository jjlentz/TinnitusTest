import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import querystring from 'querystring';
import csv from 'fast-csv';
import findParticipantIndex from "./common.mjs";


const doWrite = async (rows, s3, params) => {
    const data = await csv.writeToString(rows);
    const putCommand =  new PutObjectCommand({
        ...params,
        Body: data
    });
    const response = await s3.send(putCommand);
    console.log(response);
};

const appendCsv = async (newRow, s3, bucket) => {
    const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: 'results.csv'
    });
    const rows = [];
    const response = await s3.send(getObjectCommand);
    const readStream = response.Body;
    const putParams = {
        Bucket: bucket,
        Key: 'results.csv'
    };
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
                await doWrite(rows, s3, putParams);
                resolve();
            });
    }));
};

const saveStartTime = async (newRow, s3, bucket) => {
    const now = new Date();
    const dateString = now.toISOString();
    newRow['startTime'] = dateString;
    const command = new PutObjectCommand({
        Body: JSON.stringify(newRow, null, 4),
        Bucket: bucket,
        Key: newRow.participantId + '.txt',
        ContentType: 'application/json'
    });
    try {
        const response = await s3.send(command);
        console.log("file upload response:",response)
        //newRow['start'] = dateString;
        //await appendCsv(newRow, s3, bucket);
        return dateString;
    } catch (err) {
        console.error('Error writing participant data to s3', err)
    }
};

export const handler = async (event) => {
    const bucket = process.env.EXPERIMENT_BUCKET;
    console.log(`EVENT: \n ${JSON.stringify(event, null, 4)}`);
    const bodyString = event.body;
    const submission = JSON.parse(bodyString)
    // const rawBody = event.body;
    // const data = querystring.parse(rawBody);
    // const id = data.participantId;
    console.log("SUBMISSION", submission)
    const client = new S3Client({});
    const index = await findParticipantIndex(submission.participantId, client, bucket);
    if (index > -1) {
        const startTime = await saveStartTime(submission, client, bucket);
        return {
            'statusCode': 200,
            headers: {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': JSON.stringify({status: 'OK', startTime: startTime})
        };
    }
    return {
        'statusCode': 401,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        'body': JSON.stringify({status: 'NOPE'})
    };
};
