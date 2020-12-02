export async function findParticipantIndex(participantId, bucket) {

    const getParams = {
        Bucket: bucket,
        Key: 'participants.txt'
    }
    const participantIds = [];
    const s3 = new AWS.S3();
    let index = -1;
    try {
        const file = await s3.getObject(getParams).promise();
        const text = file.Body.toString('ascii');
        const lines = text.split('\n');
        lines.forEach(l => participantIds.push(l));
        index = participantIds.indexOf(id);
    } catch (err) {
        console.log(err);
    }
    return index;
}