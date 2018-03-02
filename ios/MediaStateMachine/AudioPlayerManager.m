//
//  AudioPlayerManager.m
//

#import "AudioPlayerManager.h"
#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import "MediaStateMachine.h"
#import "MediaManager.h"

NSString *const AudioPlayerEventStarted = @"playerStarted";
NSString *const AudioPlayerEventProgress = @"playerProgress";
NSString *const AudioPlayerEventFinished = @"playerFinished";
NSString *const AudioPlayerEventError = @"playerError";

@implementation AudioPlayerManager {

  AVAudioPlayer *_audioPlayer;

  id _progressUpdateTimer;
  int _progressUpdateInterval;
  NSDate *_prevProgressUpdateTime;
  NSURL *_audioFileURL;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[AudioPlayerEventProgress,
           AudioPlayerEventFinished,
           AudioPlayerEventError,
           AudioPlayerEventStarted];
}

- (void)sendProgressUpdate {
  if (! _audioPlayer) {
    return;
  }
  NSTimeInterval currentTime = _audioPlayer.currentTime;
  
  if (_prevProgressUpdateTime == nil ||
   (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
      
      [self sendEventWithName:AudioPlayerEventProgress body:@{
                  @"currentTime": [NSNumber numberWithFloat:currentTime]
    }];

    _prevProgressUpdateTime = [NSDate date];
  }
}

- (void)stopProgressTimer {
  [_progressUpdateTimer invalidate];
}

- (void)startProgressTimer {
  _progressUpdateInterval = 100;
  _prevProgressUpdateTime = nil;

  [self stopProgressTimer];

  _progressUpdateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(sendProgressUpdate)];
  [_progressUpdateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
}

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
  DebugTrace;
  [self stopProgressTimer];
  
  [self sendEventWithName:AudioPlayerEventFinished body:@{
      @"finished": flag ? @"true" : @"false"
    }];
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player
                                 error:(NSError *)error {
  DebugTrace;
  [self stopProgressTimer];
  
  [self sendEventWithName:AudioPlayerEventError body:@{ @"error": [error localizedDescription] }];
}


- (void)audioPlayerDidStartPlaying {
  NSTimeInterval dur = _audioPlayer.duration;
  NSString *durStr = [NSString stringWithFormat:@"%02d:%02d", (int)((int)(dur)) / 60, (int)((int)(dur)) % 60];

  [self sendEventWithName:AudioPlayerEventStarted
                     body:@{
                            @"duration": [NSNumber numberWithFloat:dur],
                            @"durationLabel": durStr,
                            }];
}

RCT_EXPORT_METHOD(readDuration:(NSString *)fileName callback:(RCTResponseSenderBlock)callback) {
  NSError *error;
  NSURL *url = [MediaManager mediaFilePathURL:fileName];
  AVAudioPlayer *player = [[AVAudioPlayer alloc] initWithData:[NSData dataWithContentsOfURL: url]
                                                        error:&error];
  if (error) {
    DDLogInfo(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
    callback(@[[error localizedDescription], @{}]);
    
  } else {
    NSTimeInterval dur = player.duration;
    NSString *durStr = [NSString stringWithFormat:@"%02d:%02d", (int)((int)(dur)) / 60, (int)((int)(dur)) % 60];
    
    callback(@[[NSNull null], @{
                 @"duration": [NSNumber numberWithFloat:dur],
                 @"durationLabel": durStr,
                 }]);
  }
  player = nil;
}

RCT_EXPORT_METHOD(play:(NSString *)fileName atTime:(NSString *)playTime) {
  NSError *error;

  _audioFileURL = [MediaManager mediaFilePathURL:fileName];
  
  /*
  _audioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:_audioFileURL
                                               error:&error];
   */
  
 NSData* data = [NSData dataWithContentsOfURL:_audioFileURL];
 _audioPlayer = [[AVAudioPlayer alloc] initWithData:data
 error:&error];
  
  if (error) {
    [self stopProgressTimer];
    DDLogInfo(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
    
  } else {
    _audioPlayer.delegate = self;
    
    _audioPlayer.currentTime = [playTime doubleValue];
    
    BOOL yn = [_audioPlayer play];
    if (yn) [self startProgressTimer];
    DDLogInfo(@"audioPlayer.play: %d", yn);
  }
}

RCT_EXPORT_METHOD(pause)
{
  if (_audioPlayer.playing) {
    [self stopProgressTimer];
    [_audioPlayer pause];
  }
}

RCT_EXPORT_METHOD(resume)
{
  if (!_audioPlayer.playing) {
    BOOL yn = [_audioPlayer play];
    if (yn) [self startProgressTimer];
    DDLogInfo(@"audioPlayer.resume: %d", yn);
  }
}

RCT_EXPORT_METHOD(stop)
{
  if (_audioPlayer.playing) {
    [self stopProgressTimer];
    [_audioPlayer stop];
  }
}

RCT_EXPORT_METHOD(setPlaytime:(NSString *) playtime)
{
  _audioPlayer.currentTime = [playtime doubleValue];
}

@end
