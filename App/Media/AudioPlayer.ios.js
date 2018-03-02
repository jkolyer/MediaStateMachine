'use strict';

var React, {NativeModules, NativeAppEventEmitter} = require('react-native');
var AudioPlayerManager = NativeModules.AudioPlayerManager;

var AudioPlayer = {
    stopUnlessPlaying(playerJob) {
        this.stop();
    },
    play(playerJob) {
        var currentTime = playerJob.currentTime()
        if (currentTime) {
            currentTime = currentTime.toString()
        } else {
            currentTime = "0"
        }
        AudioPlayerManager.play(
            playerJob.stateData.get('fileName'),
            currentTime
        )
    },
    pause() {
        AudioPlayerManager.pause();
    },
    resume() {
        AudioPlayerManager.resume();
    },
    stop() {
        AudioPlayerManager.setPlaytime("0");
        AudioPlayerManager.stop();
    },
    readDuration(fileName, callback) {
        AudioPlayerManager.readDuration(fileName, callback);
    },
    setPlaytime(playtime) {
        if (playtime) {
            AudioPlayerManager.setPlaytime(playtime.toString());
        }
    },
    init() {
        this.playerProgress = NativeAppEventEmitter.
        addListener('playerProgress',
            (data) => {
                if (this.onProgress) {
                    this.onProgress(data);
                }
            }
        );
        AudioPlayerManager.addListener('playerProgress');
        
        this.playerStarted = NativeAppEventEmitter.
        addListener('playerStarted',
            (data) => {
                if (this.onStart) {
                    this.onStart(data);
                }
            }
        );
        AudioPlayerManager.addListener('playerStarted');
        
        this.playerFinished = NativeAppEventEmitter.
        addListener('playerFinished',
            (data) => {
                if (this.onFinished) {
                    this.onFinished(data);
                }
            }
        );
        AudioPlayerManager.addListener('playerFinished');
        
        this.playerError = NativeAppEventEmitter.
        addListener('playerError',
            (data) => {
                if (this.onError) {
                    this.onError(data);
                }
            }
        );
        AudioPlayerManager.addListener('playerError');
    },
    clear() {
        this.onStart = this.onProgress = this.onFinished = this.onError = null
    },

};

module.exports = AudioPlayer;
