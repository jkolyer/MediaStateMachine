import test         from 'ava'

// debugging:
// node inspect node_modules/ava/profile.js ava_tests/player/

import mockery from 'mockery'

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

mockery.registerMock('../Media/AudioPlayer.ios', {
    init: () => {},
    play: () => {},
    setPlaytime: () => {}
});

const downloadFileName = '/downloaded/file/path'
const downloadError = 'download error message'

const localMedia = {
    hasMedia: (fileName, callback) => { callback(true) }
}
const notLocalMedia = {
    hasMedia: (fileName, callback) => { callback(false) }
}
const mediaAvailable = {
    downloadMediaFile: (url, fileName, callback) => {
        callback(null, downloadFileName);
    },
    downloadMediaRedirect: (url, fileName, callback) => {
        callback(null, downloadFileName);
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
    STATE_PLAY,
    
    TYPE_PREVIEW,
    TYPE_MIX,
} = require('../../App/Constants/StateConstants');

test.afterEach(tt => {
    mockery.deregisterMock('../Media/MediaUtil')
    mockery.deregisterMock('../Media/MediaManager')
})

const { when } = require('mobx');

test.before('media job is available remotely', tt => {
    mockery.registerMock('../Media/MediaUtil', notLocalMedia)
    mockery.registerMock('../Media/MediaManager', mediaAvailable)
})

test('media job is available locally', tt => {
    const MediaJob = require('../../App/DataMachine/MediaJob')
    
    return new Promise((resolveTest, rejectTest) => {
        var job = new MediaJob(stateData(TYPE_PREVIEW))
        job.playRequest();
        when(
            () => job.mediaState() == STATE_PLAY,
            () => {
                tt.is(job.mediaState(), STATE_PLAY, 'state is playing')
                resolveTest()
            }
        )
    });
})

