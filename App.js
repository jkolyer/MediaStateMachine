/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';

const MediaJob = require('./App/DataMachine/MediaJob')
const MediaPlayer = require('./App/Screens/MediaPlayer')

import {
    STATE_EMPTY,
    STATE_AVAILABLE,
    STATE_UNAVAILABLE,
    STATE_PLAY,
    
    TYPE_ANY,
} from './App/Constants/StateConstants'

const stateData = (dataType) => {
    return require('immutable').fromJS({
        fileName: 'sample_download.mp3',
        mediaKey: 'unique media key',
        mediaURL: 'http://sadhguru.podOmatic.com/enclosure/2018-02-25T00_38_05-08_00.mp3',
        dataType: dataType,
    })
}
var job = new MediaJob(stateData(TYPE_ANY))

export default class App extends Component {
    render() {
        return (
            <MediaPlayer mediaJob={ job } />
        );
    }
};


