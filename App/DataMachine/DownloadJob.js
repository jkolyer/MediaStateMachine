'use strict'

const MediaUtil = require('../Media/MediaUtil');

const {
    STATE_IDLE,
    STATE_DOWNLOADING,
    STATE_DOWNLOAD_FAIL,
    STATE_DOWNLOAD_CANCEL,
    STATE_DOWNLOAD_DONE,
} = require('../Constants/StateConstants');

const StateMachine = require('javascript-state-machine');
const { observable, action, extendObservable } = require('mobx');
const BaseJob = require('./BaseJob');
const MediaManager = require('../Media/MediaManager');

var DownloadMachine = StateMachine.factory({
    init: STATE_IDLE,
    transitions: [
        { name: 'download',
            from: [
                STATE_IDLE,
                STATE_DOWNLOAD_CANCEL
            ],
            to: STATE_DOWNLOADING
        },
        { name: 'downloadError',
            from: [STATE_DOWNLOADING],
            to: STATE_DOWNLOAD_FAIL
        },
        { name: 'downloadDone',
            from: [
                STATE_IDLE,
                STATE_DOWNLOADING,
                STATE_DOWNLOAD_DONE
            ],
            to: STATE_DOWNLOAD_DONE
        },
        { name: 'downloadCancel',
            from: [STATE_DOWNLOADING],
            to: STATE_DOWNLOAD_CANCEL
        },
    ],
    data: (_stateData) => {
        return {
            stateData: _stateData
        }
    },
    methods: {
        onAfterDownload: (lifecycle) => {
            const machine = lifecycle.fsm
            
            return new Promise((resolve, reject) => {
                const fileName = machine.stateData.get('fileName');
                MediaUtil.hasMedia(fileName, (hasFile) => {
                    if (hasFile) {
                        resolve(fileName);
                    } else {
                        resolve(null);
                    }
                });
            });            
        },
        onAfterDownloadDone: (lifecycle, resolve) => {
            resolve()
        },
        onAfterDownloadError: (lifecycle, error, resolve) => {
            resolve(error)
        },
    },
});

module.exports = class DownloadJob extends BaseJob {
    
    constructor(_stateData) {
        super(_stateData, DownloadMachine)

    }

    hasMedia() {
        return this.stateData.get('hasMedia')
    }
    
    fileName() {
        return this.stateData.get('fileName')
    }
    
    error() {
        return this.stateData.get('errorMsg')
    }
    
    download(resolve) {
        const machine = this.machine
        const promise = machine.download()
        
        promise.then((hasFile) => {
            if (hasFile) {
                machine.downloadDone(() => {
                    var stateData = this.stateData.set('hasMedia', true)
                    // stateData = stateData.set('machineState', machine.state)
                    this.updateStateData(stateData)
                    resolve()
                });
            } else {
                this.downloadURL(resolve);
            }
        }, (error) => {
            machine.downloadError(error, resolve);
        });
    }

    downloadURL(resolve) {
        const _stateData = this.stateData
        const mediaKey = _stateData.get('mediaKey');
        const url = _stateData.get('mediaURL');
        const dataType = _stateData.get('dataType');
        const fileName = _stateData.get('fileName');
        
        MediaManager.downloadMediaFile(url, fileName, (error, fileName) => {
            this.didDownload(error, fileName, resolve);
        });
    }

    didDownload(error, fileName, resolve) {
        if (error) {
            this.machine.downloadError(error, () => {
                var _stateData = this.stateData
                _stateData = _stateData.set('hasMedia', false)
                _stateData = _stateData.set('errorMessage', error)
                this.updateStateData(_stateData)
                resolve(error)
            });
            
        } else {
            this.machine.downloadDone(() => {
                var _stateData = this.stateData
                _stateData = _stateData.set('hasMedia', true)
                _stateData = _stateData.set('fileName', fileName)
                this.updateStateData(_stateData)
                resolve()
            });
        }
    }
}

