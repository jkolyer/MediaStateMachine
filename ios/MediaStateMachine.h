//
//  MediaStateMachine.h
//  MediaStateMachine
//
//  Created by Jonathan Kolyer on 3/2/18.
//

#ifndef MediaStateMachine_h
#define MediaStateMachine_h

#import "DDLog.h"
#import <CocoaLumberjack/CocoaLumberjack.h>

#ifdef DEBUG
static const int ddLogLevel = DDLogLevelVerbose;
#define DebugTrace DDLogVerbose(@"TRACE")

#else
static const int ddLogLevel = DDLogLevelInfo;
#define JamkDebugTrace

#endif

// ***  UTILITIES

#define NOT !

#endif /* MediaStateMachine_h */
