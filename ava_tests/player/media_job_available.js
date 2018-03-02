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
    TYPE_PREVIEW,
    TYPE_MIX,
} = require('../../App/Constants/StateConstants');

test.afterEach(tt => {
    mockery.deregisterMock('../Media/MediaUtil')
    mockery.deregisterMock('../Media/MediaManager')
})

test.before('media job is empty', tt => {
    mockery.registerMock('../Media/MediaUtil', notLocalMedia)
    mockery.registerMock('../Media/MediaManager', mediaAvailable)
})

test('media job is empty', tt => {
    const MediaJob = require('../../App/DataMachine/MediaJob')
    return new Promise((resolveTest, rejectTest) => {

        var job = new MediaJob(stateData(TYPE_PREVIEW))
        var fsm = job.machine
        tt.is(fsm.state, STATE_EMPTY, 'state is empty')
        resolveTest()
    });
    
});


test.before('media job is available locally', tt => {
    mockery.registerMock('../Media/MediaUtil', localMedia)
    mockery.registerMock('../Media/MediaManager', mediaAvailable)
})
test('media job is available locally', tt => {
    const MediaJob = require('../../App/DataMachine/MediaJob')
    
    return new Promise((resolveTest, rejectTest) => {
        var job = new MediaJob(stateData(TYPE_PREVIEW))
        job.retrieveMedia((results) => {
            tt.is(job.machine.state, STATE_AVAILABLE, 'state is available')
            resolveTest()
        });
    });
});

test.before('media job is available remotely', tt => {
    mockery.registerMock('../Media/MediaUtil', notLocalMedia)
    mockery.registerMock('../Media/MediaManager', mediaAvailable)
})
test('media job is available remotely', tt => {
    const MediaJob = require('../../App/DataMachine/MediaJob')
    
    return new Promise((resolveTest, rejectTest) => {
        var job = new MediaJob(stateData(TYPE_PREVIEW))
        job.retrieveMedia((results) => {
            tt.is(job.machine.state, STATE_AVAILABLE, 'state is available')
            resolveTest()
        });
    });
});

