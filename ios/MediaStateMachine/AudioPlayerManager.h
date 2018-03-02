//
//  AudioPlayerManager.h
//
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>

@interface AudioPlayerManager : RCTEventEmitter <AVAudioPlayerDelegate>

@end
