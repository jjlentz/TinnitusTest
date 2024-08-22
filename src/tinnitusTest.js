const TONE_DURATION = 2
let participantData = {};
let startTime = 0;
let soundEar = "R";
let currentPhase = 'calibrate';
let testValues = null;

const testSettings = {
    testLow: {tonef: 500, calPass: 1},
    testMid: {tonef: 3000, calPass: 6},
    testHigh: {tonef: 8000, calPass: 11}
}

const frequencies = [250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000,
    250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000,
    250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000, 16000];
// will be initialized later
let ampInit = null;

const handleLevelSet = (event) => {
    console.log(`handleLevelSet`)
}

const handleFinishAnswer = (event) => {
    console.log(`handleFinishAnswer`)
}

const handleBracketThreeAnswer = (event) => {
    console.log(`handleBracketThreeAnswer`)
}

const handleBracketTwoAnswer = (event) => {
    console.log(`handleBracketTwoAnswer`)
}

const addLevelMatchingInstructions = () => {
    $("#instruct").html('Instructions: Level Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play a sound. </li>\
                    <li>If your tinnitus is softer than the sound, click the \
                        <strong> softer </strong> button. </li>\
                    <li>If your tinnitus is louder than the sound or you can't hear the sound, click the <strong> louder </strong> button.</li>\
                    <li style='color:firebrick'><strong>Do this until your find a sound that has the same (or very close) \
                        loudness as your tinnitus.</strong></li>\
                    <li>Then, click the <strong> Done </strong> button to play the next sound and do this again.</li><br>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const setUplevelMatching = () => {
    // remove the calibration test buttons
    $("#testMid").remove();
    $("#testLow").remove();
    $("#testHigh").remove();
    $("#down").html('tinnitus is softer');
    $("#up").html('tinnitus is louder');
}

const switchToTwo = () => {
    $('#ansButton1').removeClass('is-invisible');
    $('#ansButton2').removeClass('is-invisible');
    $("#ansButton1 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#ansButton2 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#testHigh").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testMid").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test2 </strong> to play another sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const switchToThree = () => {
    console.log('hello from switchToThree')
    $("button.answer").prop('disabled', true);
    $("#testLow").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test3 </strong> to play the last sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const beginLevelMatching = () => {
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addLevelMatchingInstructions();
}

const handleBracketOneAnswer = (event) => {
    console.log(`handleBracketOneAnswer`)
}

const handleCalibrateAnswer = (event) => {
    const increaseVolume = event.target.id === 'up'
    if (increaseVolume) {
        const increase = 1.78 * ampInit[testValues.calPass];
        ampInit[testValues.calPass] = increase > 1 ? 1 : increase
    } else {
        ampInit[testValues.calPass] = 0.56 * ampInit[testValues.calPass];
    }
}

const answerPhaseFunction = {
    finish: handleFinishAnswer,
    bracketOne: handleBracketOneAnswer,
    bracketTwo: handleBracketTwoAnswer,
    bracketThree: handleBracketThreeAnswer,
    calibrate: handleCalibrateAnswer,
    levelSet: handleLevelSet
}

function playOneSound(tinnitusType, ear, amplitude, tone, buttonId) {
    $('button').prop('disabled', true)
    // $("#finish").prop('disabled', true);
    // $("#ansButton1 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#ansButton2 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#startId").prop('disabled', true);
    setTimeout(() => {
        $("#soundIndicator").show();
        $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing
    }, 250);
    const filePrefix = tinnitusType === "Noisy" ? ear + 'Noise' : ear

    const sound = new Howl({
        src: [filePrefix + 'wav' + tone + '.wav'],
        html5: true // Force to HTML5 so that the audio can stream in (best for large files).
    });

    console.log(`Hello from playOneSound with ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    Howler.volume(amplitude)
    sound.play();

    setTimeout(() => {
        $('#'+buttonId).prop('disabled', false);
        $("#finish").prop('disabled', false);
        $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
    }, TONE_DURATION * 1500);

}

const handleCalibration = (buttonId) => {
    console.log(`The clicked button has id ${buttonId}`)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = ampInit[testValues.calPass]
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}


const compareSounds = () => {

}

const handleParticipantForm = () => {
    $('#participantForm').submit((event) => {
        event.preventDefault();
        $('#firstSubmit').prop('disabled', true);
        console.log("form has been submitted")
        const pid = $('#participantId').val();
        participantData['participantId'] = pid
        participantData['earPhone'] = $('#earphone').val();
        participantData['tinnitusEar'] = $('#tinnitusEar').val();
        participantData['tinnitusType'] = $('#tinnitusType').val();
        participantData['hearingLoss'] = $('#hearingLoss').val();
        participantData['earphoneDescription'] = $('#earphoneDescription').val();
        console.log("participantData", participantData);
        if (participantData['hearingLoss'] === "HL") {
            ampInit = new Array(frequencies.length).fill(0.5);
        } else {
            ampInit = new Array(frequencies.length).fill(0.005);
        }
        if (participantData['tinnitusEar'] === "Right"){
            soundEar = "L";
        } else if (participantData['tinnitusEar'] === "Left"){
            soundEar = "R";
        } else {
            soundEar = "S";
        }
        // TODO POST THE DATA
        console.log(`SUBMITTING ${JSON.stringify({participantId: pid, browser: navigator.userAgent})}`)
        // $.ajax({
        //     type: 'POST',
        //     url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/start/',
        //     dataType: 'json',
        //     data: {participantId: pid, browser: navigator.userAgent}
        // })
        //     .done((response) => {
        //         startTime = response.startTime;
                startTime = new Date();
                $('#participation').hide();
                $('#experiment').show();
                // ampInit
                const value = participantData['hearingLoss'] === 'HL' ? 0.5 : 0.005;
                ampInit = Array(frequencies.length).fill(value);
            // })
            // .fail(() => {
            //     $('#participantForm').append('<div class="notification is-danger">The Participant Id is not valid</div>');
            // });
    });
}

$.when( $.ready ).then(() => {
    console.log("We are ready")
    handleParticipantForm();
    $("button.test").click((event) => {
        event.preventDefault();
        handleCalibration(event.target.id)
    });
    $('#finish').click(() => {
        $("#levelAtMax").css({'opacity': '0'});
        const current = $("#testButtons button:not(:disabled)")[0];
        if (current.id === 'testHigh') {
            switchToTwo();
        } else if (current.id === 'testMid') {
            switchToThree();
        } else if (current.id === 'testLow') {
            beginLevelMatching()
        }
        console.log(`the current is ${current.id}`, current)
    })
    $("button.answer").click((event) => {
        console.log(`Answer button clicked ${event.target.id} in phase ${currentPhase}`)
        $("button.answer").prop('disabled', true);
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
});



// TODO make louder button isn't working