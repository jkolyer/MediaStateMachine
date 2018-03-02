import test         from 'ava'

// debugging:
// node inspect node_modules/ava/profile.js tests/player/


import mockery from 'mockery'

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

const durationInSeconds = 185

mockery.registerMock('../Media/AudioPlayer.ios', {
    init: () => {
    },
    readDuration: (fileName, callback) => {
        callback(durationInSeconds);
    },
    onProgress: (callback) => {
        callback({ currentTime: 123 })
    },
    onFinished: (callback) => {
        callback()
    },
    setPlaytime: (currentTime) => {
    },
    play: (job) => {
    }
    
});

const PlayerModule = require('../../App/DataMachine/PlayerJob')
const PlayerJob = PlayerModule.theJob
const AudioPlayer = PlayerModule.AudioPlayer

import {
    STATE_IDLE,
    STATE_PLAY,
    STATE_PAUSE,
    STATE_REWIND,
    TYPE_PREVIEW,
    TYPE_TRACK
} from '../../App/Constants/StateConstants'

const stateData = (dataType) => {
    return require('immutable').fromJS({
        fileName: '/path/to/media/file',
        mediaKey: 'unique media key',
        mediaURL: '/url/to/media/file',
        dataType: dataType,
    })
}

test('player job readDuration', tt => {
    return new Promise((resolveTest, rejectTest) => {

        var job = new PlayerJob(stateData(TYPE_PREVIEW))
        
        job.readDuration((duration) => {
            tt.is(job.machine.state, STATE_IDLE, 'state is idle')
            tt.is(duration, durationInSeconds, 'duration is '+durationInSeconds)
            
            resolveTest()
        });
    });
});

test('player job startPlaying', tt => {
    return new Promise((resolveTest, rejectTest) => {
        var job = new PlayerJob(stateData(TYPE_PREVIEW))
        job.startPlaying()
        tt.is(job.machine.state, STATE_PLAY, 'state is playing')

        AudioPlayer.onProgress({ currentTime: 123 })
        tt.is(job.currentTime(), 123, 'currentTime')
        
        resolveTest()
    });
});

test('player job finishPlaying', tt => {
    return new Promise((resolveTest, rejectTest) => {
        var job = new PlayerJob(stateData(TYPE_PREVIEW))
        job.startPlaying()
        tt.is(job.machine.state, STATE_PLAY, 'state is playing')

        AudioPlayer.onFinished()
        tt.is(job.machine.state, STATE_IDLE, 'state is finished')
        
        resolveTest()
    });
});

