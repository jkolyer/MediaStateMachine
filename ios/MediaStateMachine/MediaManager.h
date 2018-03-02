//
//  MediaManager.h
//  MediaStateMachine
//
//  Created by Jonathan Kolyer on 9/24/15.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <Foundation/Foundation.h>

@interface MediaManager : NSObject <RCTBridgeModule>

@property (nonatomic, retain) NSString *cookies;
@property (nonatomic, retain) NSDictionary *environment;
@property (nonatomic, retain) NSString *userID;

@end


@interface MediaManager (MediaFile)
-(NSURL *)mediaDirURL;
-(NSString *)mediaFileName:(NSString *)mixKey;
+(NSURL *)mediaDirURL;
+(NSURL *)mediaFilePathURL:(NSString *)mixKey;

@end
