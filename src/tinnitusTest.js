const TONE_DURATION = 2
let participantData = {};
let startTime = 0;
let soundEar = "R";
let tinnitusTypeMeasured = "Tonal";
let currentPhase = 'calibrate';
let testValues = null;

const testSettings = {
    testLow: {tonef: 500, calPass: 0},
    testMid: {tonef: 3000, calPass: 4},
    testHigh: {tonef: 8000, calPass: 9}
}


const frequencies = [
    500, 1000, 3000, 5000, 8000,
    500, 1000, 3000, 5000, 8000,
    500, 1000, 3000, 5000, 8000];
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000,
    // 500, 1500, 3000, 5000, 7000, 8000, 12000]
    // //|                      |                             |
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000,
    // 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 14000];
const ratingsFrequencies = [...frequencies];
let bracketFrequencies = frequencies.slice(0, frequencies.length / 3);  
// assume all frequencies will be heard, and only mark them otherwise if they are not.
const heardFrequencies = Array(frequencies.length).fill(true);

const ratingCount = [];
const rating = [];
for (let step = 0; step < ratingsFrequencies.length; step++) {
    ratingCount.push(step % (ratingsFrequencies.length / 3)); //put back after testing!
    rating.push(-1);
}

// will be initialized later
let ampInit = null;
let frequencyIndex = 0;
let arrayIndex = 0;
let endArrayIndex = 0;
let pitchMatchingCounter = 0;
const pitchRatingAmplitude = [...new Array(frequencies.length/3)].map(() => 0)
const pitchMatchingAmplitude = [...new Array(bracketFrequencies)].map(() => 0)

function shuffle(freqArray, counterArray) {
    for (let i = freqArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        // swap elements array[i] and array[j]
        [freqArray[i], freqArray[j]] = [freqArray[j], freqArray[i]];
        [counterArray[i], counterArray[j]] = [counterArray[j], counterArray[i]];
    }
}

const topThreeIndices = (arr) => {
    // create array of objects with value & index
    const indexedArray = arr.map((value, index) => ({value, index}));
    // sort descending
    indexedArray.sort((a, b) => b.value - a.value);
    // get the first 3 and return the indices
    const largestElements = indexedArray.slice(0, 3);
    return largestElements.map((el) => el.index)
}

const switchToFinalMatch = () => {
    currentPhase = 'finish';
    $("#instruct").html('Instructions: Final Step');
    // $("#startingInstr").css({'text-align': 'center'});
    $("#startingInstr").html("<li>Push the Play button to hear the last sound</li> \
                            <li>Use the input to type or toggle input to rate the similarity of that sound to your tinnitus.</li> \
                            <li>Push the Submit button to complete the experiment.</li>");
    $('#tinnitusRating').show();
    $("#ratingSlider").remove();
    $("#finish").remove();
}
const handleLevelSetDone = (event) => {
    console.log(`handleLevelSet with frequencyIndex ${frequencyIndex}`, event)
    if (frequencyIndex === (frequencies.length - 1)) {
        console.log('handle move to qualityhMatching')
        switchToQualityMatching()
    } else {
        const amplitude = ampInit[++frequencyIndex]
        const tone = frequencies[frequencyIndex]
        // TODO JJL PUT BACK IN
        playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    }
}

const handleLevelSet = (event) => {
        $('#startId').show();
        if (event.target.id === 'up') {
        let maxVolume = parseInt($(event.currentTarget).attr('maxvolume'));
        console.log(`Current maxvolume is ${maxVolume}`, event.target);
        const value = 1.78 * ampInit[frequencyIndex];
        if (value > 1) {
            maxVolume += 1;
            // using >= coerces both vars to numbers while vs >== does not, and here we want to coercion
            if (maxVolume > 3) {
                console.log('maxVolume attempts exceeded');
                const heard = confirm('Press OK if you can hear a sound, but it is still softer than your tinnitus or Cancel if you can just barely hear the sound or it is not audible.')
                heardFrequencies[frequencyIndex] = heard;
                // reset before moving on
                $('#up').attr('maxvolume', 0)
                return handleLevelSetDone(event)
            }
            console.log('bumping maxvolume')
            $('#up').attr('maxvolume', maxVolume)
            ampInit[frequencyIndex] = 1;
        } else {
            ampInit[frequencyIndex] = value;
        }
    } else if (event.target.id === 'down') {
        ampInit[frequencyIndex] = 0.56 * ampInit[frequencyIndex];
    }
    const amplitude = ampInit[frequencyIndex]
    const tone = frequencies[frequencyIndex]
    // JJL PUT BACK IN
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
}

const switchToQualityMatching = () => {
    currentPhase = 'qualityMatching';
    console.log('Hello from switch to qualityMatching');
    $('#startId').show();
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addQualityMatchingInstructions();
    setUpPitchAndQualityMatching();  //This sets up the buttons only
    for (step = 0; step < pitchRatingAmplitude.length / 3; step++) {
        pitchMatchingAmplitude[step] =
        (ampInit[step]
            + ampInit[step + pitchRatingAmplitude.length]
            + ampInit[step + (2 * pitchRatingAmplitude.length)]) / 3;
    }
}

const switchToPitchMatching = () => {
    currentPhase = 'pitchMatching';
    console.log('Hello from switch to pitchMatching');
    $('#startId').show().prop('disabled', false).css({'opacity': '1'});
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addPitchMatchingInstructions();
}

const handlePitchMatching = (event) => {
    $('#startId').hide();
    if (event.target.id === 'down') {
        endArrayIndex--
    } else if (event.target.id ==='up'){
        arrayIndex++
    }

    // TODO Need to save final frequencies (when the indices are equal)
    var tone1 = bracketFrequencies[arrayIndex];
    var amplitude1 = pitchMatchingAmplitude[arrayIndex];
    var tone2 = bracketFrequencies[endArrayIndex];
    var amplitude2 = pitchMatchingAmplitude[endArrayIndex];
    if (pitchMatchingCounter < 2) {
        if (arrayIndex == endArrayIndex) {
            pitchMatchingCounter++; 
            arrayIndex = 0;
            endArrayIndex = bracketFrequencies.length - 1;
            console.log(`handlePitchMatching with start ${arrayIndex} vs end ${endArrayIndex}`);
            tone1 = bracketFrequencies[arrayIndex];
            amplitude1 = pitchMatchingAmplitude[arrayIndex];
            tone2 = bracketFrequencies[endArrayIndex];
            amplitude2 = pitchMatchingAmplitude[endArrayIndex];
        }
        if (pitchMatchingCounter === 2) {
            switchToPitchRating();
        } else {
            playTwoSounds(tinnitusTypeMeasured, tinnitusTypeMeasured, soundEar, amplitude1, amplitude2, tone1, tone2);
        }
    }
}

const handleQualityMatching = (event) => {
    $('#startId').hide();
    if (event.target.id === 'down') {
        tinnitusTypeMeasured = 'Tonal';
        switchToPitchMatching();
        console.log("Hello from handleQualityMatching - tonal");
    } else if (event.target.id ==='up'){
        tinnitusTypeMeasured = 'Noise';
        switchToPitchMatching();
        console.log("Hello from handleQualityMatching - tonal");
    }

    if (event.target.id === 'startId') {
        const tone = 1000;
        const frequencyIndex = bracketFrequencies.indexOf(tone)
        console.log("Hello from handleQualityMatching - after ifs");
        console.log(bracketFrequencies)
        console.log(frequencyIndex)
        const amplitude = pitchMatchingAmplitude[frequencyIndex];
        console.log(pitchMatchingAmplitude)
        playTwoSounds('Tonal', 'Noisy', soundEar, amplitude, amplitude, tone, tone);
    // TODO JJL needs to fix playtwosounds routing to handle two different sounds
}
 }

const handlePitchRating = (event) => {
    console.log(`In handlePitchRating with event.target.id of ${event.target.id}`, event)
    if (event.target.id === 'startId') {
        $('#startId').hide();
        $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
        const tone = ratingsFrequencies[frequencyIndex]
        const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
        playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    } else if (event.target.id === 'finish') {
        rating[frequencyIndex] = $('#rangeSlider').val();
        console.log(`Recording rating of ${rating[frequencyIndex]} for index ${frequencyIndex}`);
        if (frequencyIndex >= frequencies.length - 1) {
            switchToFinalMatch();
        } else {
            frequencyIndex++;
            if (heardFrequencies[frequencyIndex]) {
                const tone = ratingsFrequencies[frequencyIndex]
                const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
                playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
            } else {
                console.log('recursively calling self')
                // TODO is this the right thing to do?
                handlePitchRating(event)
            }
        }
    } else {
        // just play the same thing again
        const tone = ratingsFrequencies[frequencyIndex]
        const amplitude = pitchRatingAmplitude[ratingCount[frequencyIndex]]
        playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    }
}

const handleFinishAnswer = (event) => {
    console.log(`handleFinishAnswer`)
    const mostSimilarIndices = topThreeIndices(rating)
    const tones = []
    mostSimilarIndices.forEach((val) => {
        tones.push({frequency: ratingsFrequencies[val], freqIndex: val})
    })
    console.log(`mostSimilarIndices are ${mostSimilarIndices}`);
    tones.sort((a, b) => b.frequency - a.frequency);
    let bestTone = tones[1];
    console.log(`equating to tones ${JSON.stringify(tones)} with best ${JSON.stringify(bestTone)}`);
    const tone = bestTone.frequency
    const amplitude = pitchRatingAmplitude[ratingCount[bestTone.freqIndex]]

    playOneSound(participantData['tinnitusType'], soundEar, amplitude, tone, null)
    $('#submitTinRating').prop('disabled', false)
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

const addQualityMatchingInstructions = () => {
    $("#instruct").html('Instructions: Quality Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play two sounds. </li>\
                    <li>If the quality of your tinnitus sounds more like the first sound, click the \
                        <strong> Sound 1 </strong> button. </li>\
                    <li>If the quality of your tinnitus sounds more like the second sound, click the <strong> Sound 2 </strong> button.</li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}

const addPitchMatchingInstructions = () => {
    $("#instruct").html('Instructions: Pitch Matching');
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Start </strong> to play two sounds. </li>\
                    <li>If the pitch of your tinnitus is more similar to the sound that played first, click the \
                        <strong> Sound 1 </strong> button. </li>\
                    <li>If the pitch of your tinnitus is more similar to the sound played second, click the <strong> Sound 2 </strong> button.</li>\
                    <li style='color:firebrick'><strong>This procedure will repeat a number of times.</strong></li>\
                    <li>Note: You will see an orange circle while sound is playing.");
}
// The following code sets  levels for all tones based on values set for calibration
// low-frequency tones (500-1500) set to 500-Hz calibration amplitude
// mid-frequency tones (2000-5000) set to 3000-Hz calibration
// high-frequency tonres (6000 and above) set to 8000 Hz calibration
// const testSettings = {
//     testLow: {tonef: 500, calPass: 0},
//     testMid: {tonef: 3000, calPass: 4},
//     testHigh: {tonef: 8000, calPass: 9}
// }

//TODO Need to fix for final version

    const setLevelsFrequencyRanges = () => {
    console.log('starting state of ampInit', ampInit)
    const copy = [...ampInit]
    for (let step = 0; step < 2; step++) {   // 0 & 4
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 2; step < 5; step++) {  // 4 & 9
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 5; step < 7; step++) { // 9 & 13
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 7; step < 9; step++) { // 13 & 17
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 9; step < 12; step++) { // 17 & 22
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 12; step < 14; step++) {  // 22 & 26
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    for (let step = 14; step < 16; step++) {  // 26 & 30
        ampInit[step] = copy[testSettings.testLow.calPass];
    }
    for (let step = 16; step < 19; step++) { // 30 & 35
        ampInit[step] = copy[testSettings.testMid.calPass];
    }
    for (let step = 19; step < 21; step++) { // 35 & 39
        ampInit[step] = copy[testSettings.testHigh.calPass];
    }
    console.log('ending state of ampInit', ampInit)
} 

const setUplevelMatching = () => {
    // remove the calibration test buttons
    $('#testButtons>button').remove()
    $("#down").html('tinnitus is softer');
    $("#up").html('tinnitus is louder');
    $("#finish").html("Done");
    $("#startId").show().prop('disabled', false);
    //Setting up new frequency range
}

const setUpPitchAndQualityMatching = () => {
    // Sets up the buttons for pitch matching
    // $('#testButtons>button').remove()
    $("#down").html('Sound 1');
    $("#up").html('Sound 2');
    $("#finish").hide();
    $("#startId").prop('disabled', false);
}

const setUpPitchRating = () => {
    // remove the calibration test buttons
    $('#testButtons>button').remove()
    // $("#testMid").remove();
    // $("#testLow").remove();
    // $("#testHigh").remove();
    $("#down").html('tinnitus is softer');
    $("#up").html('tinnitus is louder');
    $("#finish").html("Done");
    $("#startId").prop('disabled', false);
}
const switchToTwo = () => {
    $('#ansButton1').removeClass('is-invisible');
    $('#ansButton2').removeClass('is-invisible');
    $("button.answer").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#ansButton1 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    // $("#ansButton2 button").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#testHigh").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#testMid").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test2 </strong> to play another sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const switchToThree = () => {
    console.log('hello from switchToThree')
    $("button.answer").prop('disabled', true).css({'cursor': 'not-allowed'});
    $("#testLow").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    $("#testMid").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    $("#startingInstr").html("<li id='Instructions'> Push <strong> Test3 </strong> to play the last sound. </li>\
                    <li>Use the softer and louder buttons to set this sound so that it is moderately soft.");
}

const beginLevelMatching = () => {
    currentPhase = 'levelSet';
    setLevelsFrequencyRanges();
    $("#testLow").prop('disabled', true).css({'opacity': '.1', 'cursor': 'not-allowed'});
    addLevelMatchingInstructions();
    setUplevelMatching();
}

const switchToPitchRating = () => {
    currentPhase = 'pitchRating';
    $("button.answer").prop('disabled', true)
        .css({'cursor': 'not-allowed', 'opacity': '.1'});
    $("#instruct").html('Instructions: Pitch Rating');
    $("#startingInstr").html("<li id='Instructions'>In this last phase of the experiment, we will measure\
            the pitch of your tinnitus using a different procedure.</li>\
        <li>Push <strong> Play </strong> (as many times as you want) to hear a sound.</li>\
        <li>Rate the similarity of the pitch of that sound to the pitch of your tinnitus using the slider.</li>\
        <li>Push <strong> Done </strong> button when you satisfied with your rating and a new sound will play. </li>\
        <li>If you can't hear the sound, drag the slider all the way to the left. </li><br>\
        <li>Push <strong> Start </strong> when you are ready. </li><br>\
        <li>Note: there are a total of 45 sounds in this section of the experiment.</li>");
    $('#finish').prop('disabled',true).css({'opacity': '.1'});
    $('#startId').show().prop('disabled', false);
    $('#down').hide();
    $('#up').html('Play').prop('disabled', false).css({'opacity': '1','cursor': 'pointer'});
    $('#ratingSlider').show();
    $("#finish").css({'opacity': '1','cursor': 'pointer','background-color': 'green'});
    frequencyIndex = 0;
    //TODO JJL Take out and rename amplitude values for pitch rating after pitch matching works
    for (step = 0; step < pitchRatingAmplitude.length; step++) {
        pitchRatingAmplitude[step] =
            (ampInit[step]
                + ampInit[step + pitchRatingAmplitude.length]
                + ampInit[step + (2 * pitchRatingAmplitude.length)]) / 3;
    }
}

const handleCalibrateAnswer = (event) => {
    const increaseVolume = event.target.id === 'up'
    if (increaseVolume) {
        const increase = 1.78 * ampInit[testValues.calPass];
        ampInit[testValues.calPass] = increase > 1 ? 1 : increase
    } else {
        ampInit[testValues.calPass] = 0.56 * ampInit[testValues.calPass];
    }
    const buttonId = $('#testButtons').find('button:not(:disabled)').attr('id')
    console.log("The clicked button has id " + buttonId);
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = buttonId === 'testHigh' ? null : ampInit[testValues.calPass]
    playOneSound(participantData['tinnitusType'], soundEar, amplitude, testValues.tonef, buttonId)
    $("#finish").prop('disabled', false);
    $("#finish").css({'opacity': '1','cursor': 'pointer' });
}

const handleCalibrateDone = () => {
    const current = $("#testButtons button:not(:disabled)")[0];
    console.log(`current is ${JSON.stringify(current)}`)
    if (current.id === 'testHigh') {
        switchToTwo();
    } else if (current.id === 'testMid') {
        switchToThree();
    } else if (current.id === 'testLow') {
        beginLevelMatching()
    }
    console.log(`the current is ${current.id}`, current)
}

function playOneSound(tinnitusType, ear, amplitude, tone, buttonId) {
    $('button').prop('disabled', true);
    $("#ansButton1 button").css({'cursor': 'not-allowed'});
    $("#ansButton2 button").css({'cursor': 'not-allowed'});
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    //TODO Amplitude of first sound (8000 Hz is not passing correctly).  Needs fixing.

    // TODO MAybe Stu can make this cleaner
    var filePrefix = ear + 'wav';
    if (tinnitusType === "Noisy") {
        filePrefix = ear + 'wavNoise';
    }
        
    const source = `${filePrefix}${tone}.wav`
    const howlOptions = {
        src: [source],
        html5: true
    }
    if (amplitude) {
        howlOptions['volume'] = amplitude;
    }
    const sound = new Howl(howlOptions);

    console.log(`Hello from playOneSound with src ${source} ${tinnitusType}:${ear}:${amplitude}:${tone}`)
    sound.play();

    sound.on('end', () => {
        if (buttonId) {
            $('#'+buttonId).prop('disabled', false);
        }
        $("#finish").prop('disabled', false);
        $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer'});
        $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
    });
}

function playTwoSounds(tinnitusTypeS1, tinnitusTypeS2, ear, amplitude1, amplitude2, tone1, tone2, buttonId) {
    $('button').prop('disabled', true).css({'cursor': 'not-allowed'});
    console.log(`playTwoSounds with ${tinnitusTypeS1}:${amplitude1}:${tone1} vs ${tinnitusTypeS2}:${amplitude2}:${tone2}`)
    $("#soundIndicator").css({'opacity': '1'}); // Turning on the circle while playing

    var filePrefix1 = ear + 'wav';
    if (tinnitusTypeS1 === "Noisy") {
        filePrefix1 = ear + 'wavNoise';
    } 

    var filePrefix2 = ear + 'wav';
    if (tinnitusTypeS2 === "Noisy") {
        filePrefix2 = ear + 'wavNoise';
    }

    //TODO - need to adjust the amplitudes of the noise so they are same as the tone; max may also need to be different!
    const source1 = `${filePrefix1}${tone1}.wav`
    const source2 = `${filePrefix2}${tone2}.wav`
    console.log(`playTwoSounds with ${source1}:${source2}`)

    let howlOptions = {
        src: [source1],
        html5: true
    }
    if (amplitude1) {
        howlOptions['volume'] = amplitude1;
    }

    let sound = new Howl(howlOptions);
    sound.play()
    sound.on('end', () => {
        setTimeout(() => {
            howlOptions = {
                src: [source2],
                html5: true
            }
            if (amplitude2) {
                howlOptions['volume'] = amplitude2;
            }
            const nextSound = new Howl(howlOptions);
            nextSound.play();
            nextSound.on('end', () => {
                $("#finish").prop('disabled', false).css({'cursor': 'pointer'});
                $("#ansButton1 button").prop('disabled', false).css({'cursor': 'pointer'});
                $("#ansButton2 button").prop('disabled', false).css({'cursor': 'pointer'});
                $("#soundIndicator").css({'opacity': '0'}); // Turning off the button while playing
            })

        }, 500)
    })
}

const handleCalibration = (buttonId) => {
    console.log(`The clicked button has id ${buttonId}`)
    $("#ansButtons button").prop('disabled', false).css({'opacity': '1', 'cursor': 'pointer'});
    testValues = testSettings[buttonId]
    const amplitude = buttonId === 'testHigh' ? null : ampInit[testValues.calPass] //TODO Need to resaerch what "Null" means in this context
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
            soundEar = "R";  //Sound played in Right ear if tinnitus is bilateral
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
                $('footer.footer').show();
                // ampInit
                const value = participantData['hearingLoss'] === 'HL' ? 0.5 : 0.005;
                ampInit = Array(frequencies.length).fill(value);
            // })
            // .fail(() => {
            //     $('#participantForm').append('<div class="notification is-danger">The Participant Id is not valid</div>');
            // });
    });
}

const submitExperimentResults = (tinitusRating) => {
    console.log(`submit tinitusRating of ${tinitusRating} and whatever additional data collected....`)
    // TODO see tintest function of the same name
    for (let i = 0; i < frequencies.length; i++) {
        participantData['CalFreq'+i] = frequencies[i];
    }
    for (let i = 0; i < ampInit.length; i++) {
        participantData['CalAmp'+i] = ampInit[i];
    }
    participantData['clinicalRating'] = tinitusRating
    for (let i = 0; i < ratingsFrequencies.length; i++) {
        participantData['rfreqs'+i] = ratingsFrequencies[i];
    }
    for (let i = 0; i < rating.length; i++) {
        participantData['rating'+i] = rating[i];
    }
    console.log('POSTING DATA', participantData)
    // TODO POST
    // $.ajax({
    //     type: 'POST',
    //     url: 'https://xcca7zh3n1.execute-api.us-east-2.amazonaws.com/Prod/complete/',
    //     dataType: 'json',
    //     data: participantData
    // }).done(() => {
    //     console.log('DATA SAVED');
    //     console.log(myData)
    // }).fail((err) => {
    //     console.error('Data not saved', err);
    //     $("#startingInstr").html("<li id='Instructions'>OOPS - something went completely wrong saving your experiment data.</li>");
    // });
}
const complete = () => {
    const tinitusRating = $('#tinnitusRatingField').val();
    console.log(`tinitusRating is ${tinitusRating}`)
    if (tinitusRating !== '') {
        $("#up").remove();
        $("#instruct").html('Thank you.  You are done!');
        $("#startingInstr").remove();
        $('#tinnitusRating').remove();
        submitExperimentResults(tinitusRating);
    } else {
        $("#startingInstr").append('<li class="important">Rating is required</li>')
    }
}

const answerPhaseFunction = {
    finish: handleFinishAnswer,
    calibrate: handleCalibrateAnswer,
    levelSet: handleLevelSet,
    pitchRating: handlePitchRating,
    pitchMatching: handlePitchMatching, 
    qualityMatching: handleQualityMatching
}

const donePhaseFunction = {
    calibrate: handleCalibrateDone,
    levelSet: handleLevelSetDone,
    pitchRating: handlePitchRating,
    // TODO delete this line cuz there is no Done button in pitch matching right?
    //pitchMatching: handlePitchMatchingDone
}

$.when( $.ready ).then(() => {
    console.log("We are ready")
    handleParticipantForm();
    $("button.test").click((event) => {
        event.preventDefault();
        handleCalibration(event.target.id)
    });
    $('#finish').click((event) => {
        $("#levelAtMax").css({'opacity': '0'});
        console.log(`finish button clicked in phase ${currentPhase}`)
        const handler = donePhaseFunction[currentPhase]
        handler(event)
    })
    $("button.answer").click((event) => {
        console.log(`Answer button clicked ${event.target.id} in phase ${currentPhase}`)
        $("button.answer").prop('disabled', true);
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
    $("#startId").click((event) => {
        console.log(`startId button clicked in phase ${currentPhase}`)
        const handler = answerPhaseFunction[currentPhase]
        handler(event)
    })
    $('#submitTinRating').click((event) => {
        event.preventDefault()
        complete()
    })
});

// TODO during level setting could we disable done button while sound is playing?

