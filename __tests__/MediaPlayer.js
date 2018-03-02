// https://stackoverflow.com/questions/42981238/how-do-i-use-node-debug-cli-with-jest
// node inspect ./node_modules/.bin/jest --runInBand --no-cache [your_test_file]
// node --inspect-brk --inspect ./node_modules/.bin/jest -i tests/mytest.test.js

import 'react-native';
import React from 'react';
const { when } = require('mobx');

import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
configure({ adapter: new Adapter() });

import {
  Text,
  View,
} from 'react-native';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

const downloadFileName = jest.fn();

jest.mock('../App/Media/MediaUtil', () => ({
    hasMedia: (fileName, callback) => { callback(false) }
}))

jest.mock('../App/Media/MediaManager.ios', () => ({
    downloadMediaFile: (url, fileName, callback) => {
        callback(null, jest.fn());
    },
    downloadMediaRedirect: (url, fileName, callback) => {
        callback(null, jest.fn());
    },
}))
jest.mock('../App/Api/JKapi')

jest.mock('../App/Media/Audio.ios', () => ({
    onProgress: () => { },
    onFinished: () => { },
    onError: () => { },
    init: () => { },
}))

import MediaPlayer from '../App/Screens/Player/MediaPlayer.js';
const MediaJob = require('../App/DataMachine/MediaJob')

import {
    STATE_EMPTY,
    STATE_AVAILABLE,
    STATE_UNAVAILABLE,
    STATE_PLAY,
    
    TYPE_PREVIEW,
} from '../App/Constants/StateConstants'

const stateData = (dataType) => {
    return require('immutable').fromJS({
        fileName: '/path/to/media/file',
        mediaKey: 'unique media key',
        mediaURL: '/url/to/media/file',
        dataType: dataType,
    })
}

it('renders correctly', () => {
    var job = new MediaJob(stateData(TYPE_PREVIEW))
    expect(job).not.toBe(null)
    const tree = renderer.create(<MediaPlayer mediaJob={ job } />).toJSON();
    expect(tree).toMatchSnapshot();    
});

it('renders job state', () => {
    var job = new MediaJob(stateData(TYPE_PREVIEW))
    const player = shallow(<MediaPlayer mediaJob={job} />)

    expect(player.contains(
        <Text>status = { job.machineState() }</Text>
    )).toBe(true)
});

test('press play button', done => {
    var job = new MediaJob(stateData(TYPE_PREVIEW))
    expect(job.machineState()).toBe(STATE_EMPTY)

    const component = (
        <MediaPlayer mediaJob={ job } />
    )
    const page = renderer.create(component)
    
    page.getInstance().pressPlayButton()
    
    when(
        () => job.stateData.get('mediaState') == STATE_PLAY,
        () => {
            page.update()
            const player = shallow(component)
            expect(player.contains(
                <Text>status = { job.machineState() }</Text>
            )).toBe(true)
            
            done()
        }
    )
});

