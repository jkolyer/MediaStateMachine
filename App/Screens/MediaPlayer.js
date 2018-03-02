'use strict';

var React = require('react');

var {
    View,
    Style,
} = require('react-native');

import {
    Container,
    Content,
    Card,
    CardItem,
    Body,
    Text,
    Button,
    Title,
    Spinner
} from 'native-base';


import { observer } from 'mobx-react';

const MediaPlayer = observer(class MediaPlayer extends React.Component {
    
    constructor(props) {
        super(props);

        this.pressPlayButton = this.pressPlayButton.bind(this)
        this.pausePlayback = this.pausePlayback.bind(this)
        this.rewindPlayer = this.rewindPlayer.bind(this)
        this.mediaContent = this.mediaContent.bind(this)
    }

    pressPlayButton() {
        if (this.props.mediaJob) {
            this.props.mediaJob.playRequest()
        }
    }

    pausePlayback() {
        if (this.props.mediaJob) {
            this.props.mediaJob.pausePlayback()
        }
    }
    
    rewindPlayer() {
        if (this.props.mediaJob) {
            this.props.mediaJob.rewindPlayer()
        }
    }

    mediaContent() {
        const job = this.props.mediaJob
        var mediaContent
        
        if (job.isRetrieving()) {
            mediaContent = (<Spinner color="green" />)
            
        } else if (job.hasError()) {
            mediaContent = (
                <Button rounded light onPress={ () => { this.pressPlayButton() } }>
                <Text>Error -- Retry</Text>
                </Button>
            )
            
        } else if (job.isPlaying()) {
            mediaContent = (
                <Content>
                <Button rounded light onPress={ () => { this.rewindPlayer() } }>
                <Text>Rewind</Text>
                </Button>
                <Button rounded light onPress={ () => { this.pausePlayback() } }>
                <Text>Pause { job.currentTime() }</Text>
                </Button>
                </Content>
            )
            
        } else if (job.isPaused()) {
            mediaContent = (
                <Content>
                <Button rounded light onPress={ () => { this.rewindPlayer() } }>
                <Text>Rewind</Text>
                </Button>
                <Button rounded light onPress={ () => { this.pressPlayButton() } }>
                <Text>Play { job.currentTime() }</Text>
                </Button>
                </Content>
            )
            
        } else {
            mediaContent = (
                <Button rounded light onPress={ () => { this.pressPlayButton() } }>
                <Text>Play Media</Text>
                </Button>
            )
        }
        return mediaContent
    }
    
    render() {
        return (
            <Container>
            <Content>
            <Card>
            <CardItem header>
            <Text>Media Player</Text>
            </CardItem>
            <CardItem>
            <Body>
            { this.mediaContent() }
            </Body>
            </CardItem>
            <CardItem footer>
            <Text>Footer</Text>
            </CardItem>
            </Card>
            </Content>
            </Container>
        );
    }
})

module.exports = MediaPlayer;
