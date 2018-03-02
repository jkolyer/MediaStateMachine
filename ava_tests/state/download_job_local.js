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
    hasMedia: (fileName, callback) => { callback(true) }
});
mockery.registerMock('../Media/MediaManager', {
    downloadMediaFile: (url, fileName, callback) => { },
    downloadMediaRedirect: (url, fileName, callback) => { },
});

const Immutable = require('immutable');
const DownloadJob = require('../../App/DataMachine/DownloadJob')

import {
    STATE_DOWNLOAD_DONE,
} from '../../App/Constants/StateConstants'

const stateData = Immutable.fromJS({
    fileName: '/path/to/media/file',
})

test('download job has media', tt => {
    return new Promise((resolveTest, rejectTest) => {

        var job = new DownloadJob(stateData)
        var fsm = job.machine
        
        job.download((error) => {
            tt.is(fsm.state, STATE_DOWNLOAD_DONE, 'state is done')
            tt.is(fsm.stateData.get('fileName'), stateData.get('fileName'), 'local file')
            
            if (error) {
                rejectTest()
            } else {
                resolveTest()
            }
        });
    });
});

