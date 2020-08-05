let count = 0;
const frequencies = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
//var audioCtx=new(window.AudioContext) || window.webkitAudioContext();


$.when( $.ready ).then(() => {
    $("#startId").click(() => {
        $("#controls").prop('disabled', true);


     //playSound();
    $("button.answer").click((event) => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "softer" ? true : false;
        const ansLouder = event.target.id === "louder" ? true : false;
        const ansfinish = event.target.id === "finishID" ? true : false;
     
        if (ans) {
        // if true, make sound softer.  If false, make louder
         }      
        });

        const timeout = .2;
        if (count < frequencies.length) {
            setTimeout(() => {
                playSound();
                 $("#startId").show('slow');
            }, timeout * 1000);
        }
          
    });

    // $("button.answer").click((event) => {
    //     $("button.answer").prop('disabled', true);
    //     const ans = event.target.id === "softer" ? false : true;

    //     if (ans) {
    //     // if true, make sound softer.  If false, make louder
    //     }       
       
    //     const timeout = randomExponential(1);
    //     if (count < movies.length) {
    //         setTimeout(() => {
    //             runExperiment();
    //         }, timeout * 1000);
    //     }
        
    //     // if (count === movies.length) {
    //     //     $("#startId").show('slow');
    //     //     $("#Feedback").html("<p id='Response'>Feel Free to take a short break. Press Start when Ready to resume.</p>");
    //     // }
    //     // $("#Feedback").html("<p id='Response'>Updating</p>");
    // });
});

// Exponential random number generator
// Time until next arrival

function playSound() {
       
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const tone = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        tone.frequency.value = frequencies[count];
        count++
        tone.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(.2,audioCtx.currentTime + 0.04);
        tone.start(0);
        tone.stop(audioCtx.currentTime + 2);




}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

    // swap elements array[i] and array[j]
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

