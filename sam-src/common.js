const findParticipantIndex = async (participantId, s3, bucket) => {

    const getParams = {
        Bucket: bucket,
        Key: 'participants.txt'
    }
    const participantIds = [];
    let index = -1;
    try {
        const file = await s3.getObject(getParams).promise();
        const text = file.Body.toString('ascii');
        const lines = text.split('\n');
        lines.forEach(l => participantIds.push(l));
        // console.log(`Total Participants: ${participantIds.length}`);
        index = participantIds.indexOf(participantId);
        // console.log(`${participantId} has index of ${index}`);
    } catch (err) {
        console.log(err);
    }
    return index;
}

exports.findParticipantIndex = findParticipantIndex