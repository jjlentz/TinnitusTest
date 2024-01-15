import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import querystring from 'querystring';
import csv from 'fast-csv';
import findParticipantIndex from './common.mjs'

const doWrite = async (rows, s3, params) => {
    const data = await csv.writeToString(rows, {headers: true});
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
        Key: 'results.csv'
    });
    const rows = [];
    const response = await s3.send(command);
    const readStream = response.Body;
    const params = {
        Bucket: bucket,
        Key: 'results.csv'
    };
    return new Promise(((resolve, reject) => {
        csv.parseStream(readStream, {headers: true})
            .on('error', error => {
                reject(error);
            })
            .on('data', row => {
                if (row.participantId === data.participantId && row.start === data.startTime) {
                    const matchRow = {
                        ...row,
                        ...data
                    };
                    rows.push(matchRow);
                } else {
                    rows.push(row);
                }
            })
            .on('end', async rowCount => {
                console.log(`Row count ${rowCount - 1}`);
                await doWrite(rows, s3, params);
                resolve();
            });
    }));
};

export const lambdaHandler = async (event, context) => {
    const bucket = process.env.EXPERIMENT_BUCKET;
    const rawBody = event.body;
    const data = querystring.parse(rawBody);
    const client = new S3Client({});
    const index = await findParticipantIndex(data.participantId, client, bucket);
    if (index > -1) {
        const resultParams = new PutObjectCommand({
            Bucket: bucket,
            Key: data.participantId + '-end.txt'
        });

        let text = '';

        const endDateString = new Date().toISOString();
        for (const [key, value] of Object.entries(data)) {
            if (key !== 'participantId') {
                text = text + '\n' + key + '\t' + value;
            }
        }
        text = text + '\n' + 'END TIME' + '\t' + endDateString;
        resultParams['Body'] = text;
        await client.send(resultParams);
        data['end'] = endDateString;
        await appendDataToCSV(data, client, bucket);
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