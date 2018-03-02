import test         from 'ava'

// debugging:
// node inspect node_modules/ava/profile.js test_state_machine/download_job.js


import mockery from 'mockery'

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

mockery.registerMock('../Media/MediaUtil', {
    hasMedia: (fileName, callback) => { callback(false) }
});

const downloadError = 'download error message'

mockery.registerMock('../Media/MediaManager', {
    downloadMediaFile: (url, fileName, callback) => {
        callback(downloadError, null);
    },
    downloadMediaRedirect: (url, fileName, callback) => {
        callback(downloadError, null);
    },
});

const DownloadJob = require('../../App/DataMachine/DownloadJob')

import {
    STATE_DOWNLOAD_FAIL,
    TYPE_PREVIEW,
    TYPE_TRACK
} from '../../App/Constants/StateConstants'

const Immutable = require('immutable');
const stateData = (dataType) => {
    return Immutable.fromJS({
        fileName: '/path/to/media/file',
        mediaKey: 'unique media key',
        mediaURL: '/url/to/media/file',
        dataType: dataType,
    })
}

test('download job error preview', tt => {
    return new Promise((resolveTest, rejectTest) => {

        var job = new DownloadJob(stateData(TYPE_PREVIEW))
        var fsm = job.machine
        
        job.download((error) => {
            tt.is(fsm.state, STATE_DOWNLOAD_FAIL, 'state is failed')
            tt.is(fsm.stateData.get('errorMessage'), downloadError, 'error message')
            
            if (error) {
                resolveTest()
            } else {
                rejectTest()
            }
        });
    });
});

test('download job error track', tt => {
    return new Promise((resolveTest, rejectTest) => {

        var job = new DownloadJob(stateData(TYPE_TRACK))
        var fsm = job.machine
        
        job.download((error) => {
            tt.is(fsm.state, STATE_DOWNLOAD_FAIL, 'state is failed')
            tt.is(fsm.stateData.get('errorMessage'), downloadError, 'error message')
            
            if (error) {
                resolveTest()
            } else {
                rejectTest()
            }
        });
    });
});

