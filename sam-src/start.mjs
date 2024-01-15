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
    let text = 'START TIME\t' + dateString
        + '\nBROWSER\t' + newRow.browser;
    const params = new PutObjectCommand({
        Body: text,
        Bucket: bucket,
        Key: newRow.participantId + '.txt'
    });
    const response = await s3.send(params);
    console.log(response)
    newRow['start'] = dateString;
    await appendCsv(newRow, s3, bucket);
    return dateString;
};

export const handler = async (event) => {
    const bucket = process.env.EXPERIMENT_BUCKET;

    const rawBody = event.body;
    const data = querystring.parse(rawBody);
    const id = data.participantId;
    const client = new S3Client({});
    const index = await findParticipantIndex(id, client, bucket);
    if (index > -1) {
        const startTime = await saveStartTime(data, client, bucket);
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
