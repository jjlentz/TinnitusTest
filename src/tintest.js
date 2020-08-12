let count = 0;
let amp = 0.01;
const frequencies = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
//var audioCtx=new(window.AudioContext) || window.webkitAudioContext();


$.when( $.ready ).then(() => {
    $("#startId").click(() => {
        $("#startId").prop('disabled', true);
        $("#startId").prop("value", "Play");
        $("#startId").prop('color', 'gray');
        //This isn't working.  Needs help


        $("#startingInstr").html("<p id='Instructions'>Push the <strong> play </strong> button to play a tone. <br>\
            Using the louder and softer buttons, find a sound level that is the same loudness as\
            your tinnitus. <br> When you have found a sound that is equally loud, push the\
            <strong> I am happy </strong> button to play the next sound.</p>");
        
        const timeout = .5;
        if (count < frequencies.length) {
            setTimeout(() => {
                playSound();
                $("#startId").show('slow');
            }, timeout * 1000);
        };
    });

     //playSound();
    $("button.answer").click((event) => {
        //$("button.answer").prop('disabled', true);
        const ansSofter = event.target.id === "softer" ? true : false;
        const ansLouder = event.target.id === "louder" ? true : false;
     
        if (ansSofter) {
            amp = 0.56 * amp; // if true, make sound 5 dB softer.  
         };  
        if (ansLouder) {
            amp = 1.78 * amp; // if true, make sound 5 dB louder.  
         };        
       
        playSound();
        
        //console.log(ansSofter,ansLouder,count)
    });
    $("#finish").click(() => {
        count++; 
        //console.log(count)
    });
 

});

function playSound() {
       
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const tone = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        tone.frequency.value = frequencies[count];
        tone.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(amp,audioCtx.currentTime + 0.04);
        tone.start(0);
        tone.stop(audioCtx.currentTime + 2);
}


