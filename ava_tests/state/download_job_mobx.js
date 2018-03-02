import test from 'ava'

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

const downloadFileName = '/downloaded/file/path'

mockery.registerMock('../Media/MediaManager', {
    downloadMediaFile: (url, fileName, callback) => {
        callback(null, downloadFileName);
    },
    downloadMediaRedirect: (url, fileName, callback) => {
        callback(null, downloadFileName);
    },
});

import {
    STATE_DOWNLOAD_DONE,
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

const { when } = require('mobx');

test('download job no media preview', tt => {
    const DownloadJob = require('../../App/DataMachine/DownloadJob')

    return new Promise((resolveTest, rejectTest) => {
        var job = new DownloadJob(stateData(TYPE_PREVIEW))
        job.download((error) => {});
        
        when(
            () => job.stateData.get('machineState') == STATE_DOWNLOAD_DONE,
            () => {
                tt.is(job.machine.state, STATE_DOWNLOAD_DONE, 'state is done')
                resolveTest()
            }
        )
    });
});

