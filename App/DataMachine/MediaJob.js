const BaseJob = require('./BaseJob')
const DownloadJob = require('./DownloadJob')
const PlayerJob = require('./PlayerJob').theJob
const StateMachine = require('javascript-state-machine')

const { computed, action } = require('mobx')

const {
    STATE_EMPTY,
    STATE_RETRIEVING,
    STATE_AVAILABLE,
    STATE_UNAVAILABLE,
    STATE_PLAY,
    STATE_PAUSE,
    
    TYPE_PREVIEW,
    TYPE_MIX,
} = require('../Constants/StateConstants')

var MediaMachine = StateMachine.factory({
    init: STATE_EMPTY,
    transitions: [
        { name: 'retrieveMedia',
            from: [
                STATE_EMPTY,
                STATE_UNAVAILABLE,
            ],
            to: STATE_RETRIEVING
        },
        { name: 'noMedia',
            from: [STATE_RETRIEVING],
            to: STATE_UNAVAILABLE
        },
        { name: 'gotMedia',
            from: [STATE_RETRIEVING],
            to: STATE_AVAILABLE
        },
    ],
    data: (stateData) => {
        return {
            stateData: stateData
        }
    },
    methods: {
        onAfterRetrieveMedia: (lifecycle, downloadJob) => {
            const machine = lifecycle.fsm
            
            return new Promise((resolve, reject) => {
                
                // if we already have the media, return
                if (machine.stateData.get('hasMedia')) {
                    resolve(true)
                    
                } else {
                    // start DownloadJob
                    downloadJob.download((error) => {
                        if (error) {
                            reject()
                        } else {
                            resolve()
                        }
                    })
                }
            })
        },
    },
})

module.exports = class MediaJob extends BaseJob {
    
    constructor(_stateData) {
        _stateData = _stateData.set('mediaState', STATE_EMPTY)
        
        super(_stateData, MediaMachine)

        this.playerJob = new PlayerJob(_stateData)
        this.downloadJob = new DownloadJob(_stateData)

        const mediaJob = this

        this.playerJob.machine.observe({
            onAfterTransition: function(lifecycle) {
                const stateData = mediaJob.stateData.set('mediaState',
                    mediaJob.playerJob.stateData.get('machineState'))
                mediaJob.updateStateData(stateData)
            }
        })
        this.downloadJob.machine.observe({
            onAfterTransition: function(lifecycle) {
                const stateData = mediaJob.stateData.set('mediaState',
                    mediaJob.downloadJob.stateData.get('machineState'))
                mediaJob.updateStateData(stateData)
            }
        });

        this._setupActions()
    }

    _setupActions() {

        /***  action: pausePlayback */
        
        this.pausePlayback = action(() => {
            if (this.isPlaying()) {
                this.playerJob.pause()
            }
        })
        this.pausePlayback = this.pausePlayback.bind(this)

        /***  action: rewindPlayer */
        
        this.rewindPlayer = action(() => {
            this.playerJob.stopPlaying()
        })
        this.rewindPlayer = this.rewindPlayer.bind(this)

        /***  action: playRequest */
        
        this.playRequest = action(() => {
            if (this.isAvailable()) {
                // change state of playerJob to playing
                this.playerJob.startPlaying()
                
            } else if (this.isEmpty()) {
                const mediaJob = this
                
                this.retrieveMedia((error) => {
                    if (! error) {
                        mediaJob.playerJob.startPlaying()
                    }
                })
            }
        })
        this.playRequest = this.playRequest.bind(this)

        /***  action: retrieveMedia */
        
        this.retrieveMedia = action(function(result) {
            const state = this.machine.state
            
            if (state == STATE_EMPTY) {
                const promise = this.machine.retrieveMedia(this.downloadJob)
                const mediaJob = this
                
                promise.then(() => {
                    mediaJob.machine.gotMedia()
                    result()
                    
                }, () => {
                    mediaJob.machine.noMedia()
                    result()
                })
                
            } else if (state == STATE_AVAILABLE) {
                result(null)
                
            } else if (state == STATE_UNAVAILABLE) {
                result(this.mediaError())
            }
        })
        this.retrieveMedia = this.retrieveMedia.bind(this)
    }

    downloadJob() {
        return this.downloadJob
    }
    
    playerJob() {
        return this.playerJob
    }

    isEmpty() {
        return this.machineState() == STATE_EMPTY
    }

    isAvailable() {
        return this.machineState() == STATE_AVAILABLE
    }

    isRetrieving() {
        return this.machineState() == STATE_RETRIEVING
    }

    isPlaying() {
        return this.mediaState() == STATE_PLAY
    }

    isPaused() {
        return this.mediaState() == STATE_PAUSE
    }

    currentTime() {
        return this.playerJob.currentTime()
    }

    hasError() {
        return this.machineState() == STATE_UNAVAILABLE
    }
    
    mediaError() {
        return this.stateData.get('errorMsg')
    }

    mediaState() {
        return this.stateData.get('mediaState')
    }
    
}
