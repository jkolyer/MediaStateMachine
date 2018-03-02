'use strict'

const {
    STATE_IDLE,
    STATE_EMPTY,
    STATE_PAUSE,
    STATE_PLAY,
    TYPE_PREVIEW,
    TYPE_MIX,
} = require('../Constants/StateConstants');

const BaseJob = require('./BaseJob');
const { observable, action, extendShallowObservable } = require('mobx');
const StateMachine = require('javascript-state-machine');
const AudioPlayer = require('../Media/AudioPlayer.ios');

var PlayerMachine = StateMachine.factory({
    init: STATE_IDLE,
    transitions: [
        { name: 'play',
          from: [STATE_IDLE,
                 STATE_PAUSE],
          to: STATE_PLAY },
        { name: 'pause',
          from: STATE_PLAY,
          to: STATE_PAUSE },
        { name: 'resume',
          from: STATE_PAUSE,
          to: STATE_PLAY },
        { name: 'stop',
          from: [STATE_PLAY,
                 STATE_PAUSE,
                 STATE_IDLE,
                 STATE_EMPTY],
          to: STATE_IDLE },
        { name: 'finished',
          from: [STATE_PLAY,
                 STATE_IDLE,
                 STATE_PAUSE,
                 STATE_EMPTY],
          to: STATE_IDLE },
        { name: 'error',
          from: [STATE_PLAY],
          to: STATE_IDLE },
        { name: 'hasmedia',
          from: STATE_EMPTY,
          to: STATE_IDLE },
    ],
    data: (stateData) => {
        return {
            stateData: stateData
        }
    },
    methods: {
        onFinished: (lifecycle, job) => {
        },
        onPlay: (lifecycle, job) => {
            AudioPlayer.play(job);
        },
        onPause: (lifecycle, job) => {
            AudioPlayer.pause();
        },
        onResume: (lifecycle, job) => {
        },
        onStop: (lifecycle, job) => {
            AudioPlayer.stop();
        },
        onError: (lifecycle, job) => {
        },
        onHasMedia: (lifecycle, job) => {
        },
    },
});

var theJob = class PlayerJob extends BaseJob {
    
    constructor(_stateData) {
        super(_stateData, PlayerMachine)
        
        this.currentTime = this.currentTime.bind(this)
    }

    readDuration(callback) {
        var duration = this.stateData.get('duration')

        if (duration) {
            callback(duration)
            return
        }
        const fileName = this.stateData.get('fileName')
        AudioPlayer.readDuration(fileName, (duration) => {
            this.updateStateData(this.stateData.set('duration', duration))
            callback(duration)
        })
    }
    
    currentTime() {
        return this.stateData.get('currentTime')
    }

    setPlaytime(playtime) {
        AudioPlayer.setPlaytime(playtime)

        var stateData = this.stateData
        if (playtime == stateData.get('currentTime'))
            return
        stateData = stateData.set('currentTime', playtime);
        this.updateStateData(stateData)
    }

    playDidProgress(data) {
        // var newTime = data.currentTime;
        var newTime = Math.floor(data.currentTime);
        var stateData = this.stateData
        
        if (newTime == stateData.get('currentTime'))
            return

        console.log("playDidProgress:  "+newTime)
        stateData = stateData.set('currentTime', newTime);
        this.updateStateData(stateData)
    }

    assignAudioPlayerCallbacks() {
        AudioPlayer.onProgress = this.playDidProgress.bind(this)
        AudioPlayer.onFinished = this.didFinish.bind(this)
        AudioPlayer.onError = this.didError.bind(this)
        AudioPlayer.init();
    }

    startPlaying() {
        this.assignAudioPlayerCallbacks()
        AudioPlayer.setPlaytime(this.currentTime())
        this.machine.play(this)
    }

    pause() {
        this.machine.pause(this)
    }

    stopPlaying() {
        this.updateStateData(this.stateData.set('currentTime', 0))
        this.machine.stop(this)
    }

    didFinish() {
        this.machine.finished(this);
    }
    
    didError(err_msg) {
        this.machine.error(err_msg);
    }
    
    isPlaying() {
        return this.machine.state == STATE_PLAY
    }
    
    didComplete() {
        var stateData = this.stateData
        stateData = stateData.set('finished', true)
        stateData = stateData.set('currentTime', 0)
        stateData = stateData.set('lastPlayTime', new Date().getTime())
        this.updateStateData(stateData)
    }
    
    currentTime() {
        return this.stateData.get('currentTime')
    }

};

module.exports = { theJob, AudioPlayer }

