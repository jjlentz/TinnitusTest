import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import querystring from 'querystring';
import csv from 'fast-csv';
import findParticipantIndex from './common.mjs'

const doWrite = async (rows, s3, params) => {
    const data = await csv.writeToString(rows, {headers: true, delimiter: '\t'});
    const putCommand = new PutObjectCommand({
        ...params,
        Body: data
    });
    const response = await s3.send(putCommand);
    console.log(response);
};

const appendDataToCSV = async (data, s3, bucket) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: 'results.tsv'
    });
    const rows = [];
    const response = await s3.send(command);
    const readStream = response.Body;
    const params = {
        Bucket: bucket,
        Key: 'results.tsv'
    };
    return new Promise(((resolve, reject) => {
        csv.parseStream(readStream, {headers: true, delimiter: '\t'})
            .on('error', error => {
                reject(error);
            })
            .on('data', row => {
                if (row.participantId === data.participantId && row.start === data.startTime) {
                    console.log('MATCH')
                    const matchRow = {
                        ...row,
                        ...data
                    };
                    rows.push(matchRow);
                } else {
                    console.log('NO MATCH')
                    rows.push(row);
                }
            })
            .on('end', async rowCount => {
                console.log(`Row count ${rowCount - 1}`);
                rows.push(data);
                await doWrite(rows, s3, params);
                resolve();
            });
    }));
};

export const lambdaHandler = async (event, context) => {
    const bucket = process.env.EXPERIMENT_BUCKET;
    const rawBody = event.body;
    const data = JSON.parse(rawBody);
    const client = new S3Client({});
    const index = await findParticipantIndex(data.participantId, client, bucket);
    const endDateString = new Date().toISOString();
    data['end'] = endDateString
    if (index > -1) {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: data.participantId + '-end.txt',
            Body: JSON.stringify(data, null, 4),
            ContentType: "application/json"
        });
        await client.send(command);
        data['end'] = endDateString;
        const row = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object') {
                row[key] = JSON.stringify(value);
            } else {
                row[key] = value;
            }
        }

        await appendDataToCSV(row, client, bucket);
        return {
            'statusCode': 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': JSON.stringify({status: 'OK'})
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