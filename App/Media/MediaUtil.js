'use strict';

var MediaManager = require('./MediaManager.ios');

module.exports = {
    mediaKeyWithExtension(mediaKey, url) {
        var extension = url.split('?')[0].split('.').pop();
        return mediaKey + '.' + extension
    },
    hasMedia(fileName, callback) {
        if (! callback) return;
        MediaManager.hasMedia(fileName, (error, fileURL) => {
            if (fileURL) callback(true);
            else callback(false);
        });
    },
}


