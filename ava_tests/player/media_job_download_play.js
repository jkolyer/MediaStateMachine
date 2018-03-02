import test         from 'ava'

// debugging:
// node inspect node_modules/ava/profile.js tests/player/


import mockery from 'mockery'

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

mockery.registerMock('../Media/AudioPlayer.ios', {
});
const downloadError = 'download error message'

const notLocalMedia = {
    hasMedia: (fileName, callback) => { callback(false) }
}
const mediaUnavailable = {
    downloadMediaFile: (url, fileName, callback) => {
        callback(downloadError, null);
    },
    downloadMediaRedirect: (url, fileName, callback) => {
        callback(downloadError, null);
    }
}

const Immutable = require('immutable');
const stateData = (dataType) => {
    return Immutable.fromJS({
        fileName: '/path/to/media/file',
        mediaKey: 'unique media key',
        mediaURL: '/url/to/media/file',
        dataType: dataType,
    })
}

const {
    STATE_EMPTY,
    STATE_RETRIEVING,
    STATE_AVAILABLE,
    STATE_UNAVAILABLE,
    TYPE_PREVIEW,
    TYPE_MIX,
} = require('../../App/Constants/StateConstants');

test.afterEach(tt => {
    mockery.deregisterMock('../Media/MediaUtil')
    mockery.deregisterMock('../Media/MediaManager')
})

test.before('media job is unavailable', tt => {
    mockery.registerMock('../Media/MediaUtil', notLocalMedia)
    mockery.registerMock('../Media/MediaManager', mediaUnavailable)
})

test('media job is unavailable', tt => {
    const MediaJob = require('../../App/DataMachine/MediaJob')
    
    return new Promise((resolveTest, rejectTest) => {
        var job = new MediaJob(stateData(TYPE_PREVIEW))
        job.retrieveMedia((results) => {
            tt.is(job.machine.state, STATE_UNAVAILABLE, 'state is unavailable')
            resolveTest()
        });
    });
})
