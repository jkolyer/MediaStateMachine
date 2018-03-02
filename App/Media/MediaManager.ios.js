'use strict';

var React, {NativeModules, NativeAppEventEmitter} = require('react-native');
var MediaManager = NativeModules.MediaManager;

var MediaManagerAPI = {
    setCookies(cookies) {
        MediaManager.setCookies(cookies);
    },
    downloadMediaFile(mediaURL, mediaKey, callback) {
        MediaManager.downloadMediaFile(mediaURL, mediaKey, (error, fileURL) => {
            if (callback) callback(error, fileURL);
        });
    },
    hasMedia(fileName, callback) {
        MediaManager.hasMedia(fileName, (error, fileURL) => {
            if (callback) callback(error, fileURL);
        });
    },
    deleteMedia(fileName, callback) {
        MediaManager.deleteMedia(fileName, (yn) => {
            if (callback) callback(yn);
        });
    },
};

module.exports = MediaManagerAPI;
