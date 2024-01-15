import { GetObjectCommand } from '@aws-sdk/client-s3';
const findParticipantIndex = async (participantId, s3, bucket) => {

    const getParams = new GetObjectCommand({
        Bucket: bucket,
        Key: 'participants.txt'
    });
    const participantIds = [];
    let index = -1;
    try {
        const response = await s3.send(getParams);
        const text = await response.Body.transformToString();
        const lines = text.split('\n');
        lines.forEach(l => participantIds.push(l));
        // console.log(`Total Participants: ${participantIds.length}`);
        index = participantIds.indexOf(participantId);
        // console.log(`${participantId} has index of ${index}`);
    } catch (err) {
        console.log(err);
    }
    return index;
};

export default findParticipantIndex