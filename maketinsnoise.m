%maketinsnoise.m
cfreq=[750];
fs=44100; NyFs=44100/2;
t=1/fs:1/fs:1.8;
noise=randn(1,fs*1.8);
lowcut=(1/(2^(1/6)))*[cfreq]/NyFs;
highcut=2^(1/6)*[cfreq]/NyFs;
rampup=sin(2*pi*12.5*t(1:0.02*fs)).^2;
rampdown=fliplr(rampup);
modwave=[rampup ones(1,0.16*fs) rampdown];
fullramp=[modwave zeros(1,0.2*fs) modwave zeros(1,0.2*fs) modwave zeros(1,0.2*fs) ...
    modwave zeros(1,0.2*fs) modwave];

for ii=1:length(cfreq)
    if ii==1, [b,a]=butter(4,highcut(ii),'low'); else
        [b,a]=butter(4,[lowcut(ii) highcut(ii)]); end;
    y=filter(b,a,noise);
    yamp=0.95./max(y);
    y=yamp*fullramp.*y;
    yL=[y' y' ];
    
    expr=['audiowrite(''' 'SNoisewav' num2str(cfreq(ii)) '.wav' ''',yL,44100)']
    eval(expr)
end

%     expr=['audiowrite(''' 'Lwav' num2str(f(ii)) '.wav' ''',modtoneL,44100)']
%     eval(expr)
%     expr=['audiowrite(''' 'Rwav' num2str(f(ii)) '.wav' ''',modtoneR,44100)']
%     eval(expr)
%      expr=['audiowrite(''' 'Swav' num2str(f(ii)) '.wav' ''',modtoneS,44100)']
%     eval(expr)