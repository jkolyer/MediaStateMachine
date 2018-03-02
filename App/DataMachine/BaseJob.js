'use strict'

const { observable, action, extendShallowObservable } = require('mobx');

module.exports = class BaseJob {
    
    constructor(_stateData, StateMachineClass) {

        if (StateMachineClass) {
            this.machine = new StateMachineClass(_stateData)

            const thisJob = this
            this.machine.observe({
                onAfterTransition: function(lifecycle) {
                    const stateData = thisJob.stateData.set('machineState',
                        lifecycle.to)
                    thisJob.updateStateData(stateData)
                }
            })
            // initialize machineState
            _stateData = _stateData.set('machineState', this.machine.state)
            this.machine.stateData = _stateData
        }

        extendShallowObservable(this, {
            stateData: _stateData
        })

        this.updateStateData = action(function(_stateData) {
            const state = this.machine.state
            if (state != _stateData.get('machineState')) {
                _stateData = _stateData.set('machineState', state)
            }
            this.machine.stateData = _stateData

            extendShallowObservable(this, {
                stateData: _stateData
            })
        })

        this.machineState = this.machineState.bind(this)
    }

    machineState() {
        return this.stateData.get('machineState')
    }

};

