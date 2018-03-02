//
//  MediaManager.m
//  MediaStateMachine
//
//  Created by Jonathan Kolyer on 9/24/15.
//

#import "MediaManager.h"
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#import <AFNetworking/AFNetworking.h>
#import "MediaStateMachine.h"

@interface MediaManager (Downloader)

- (void)downloadFile:(NSString *)urlStr
       mediaFileName:(NSString *)mediaFileName
             success:(void (^)(NSURL *))success
             failure:(void (^)(NSString *error))failure;
@end

#define BAD_STATUS_CODE(code) ((code) >= 204)

static NSString *activeUserID;

@implementation MediaManager (MediaFile)

+(NSURL *)mediaDirURL {
  NSURL *mediaDirURL = [[NSFileManager defaultManager] URLForDirectory:NSDocumentDirectory
                                                              inDomain:NSUserDomainMask
                                                     appropriateForURL:nil
                                                                create:NO
                                                                 error:nil];
  if (activeUserID) {
    NSURL *userDirURL = [mediaDirURL URLByAppendingPathComponent:activeUserID];
    NSString *path = userDirURL.path;
    
    if (NOT [[NSFileManager defaultManager] fileExistsAtPath:path]) {
      [[NSFileManager defaultManager] createDirectoryAtURL:userDirURL
                               withIntermediateDirectories:NO
                                                attributes:nil
                                                     error:nil];
    }
    mediaDirURL = userDirURL;
  }
  return mediaDirURL;
}
-(NSURL *)mediaDirURL {
  return [[self class] mediaDirURL];
}

+(NSString *)mediaFileName:(NSString *)mediaKey {
  return [NSString stringWithFormat:@"%@.aac", mediaKey];
}

-(NSString *)mediaFileName:(NSString *)mediaKey {
  return [[self class] mediaFileName:mediaKey];
}

+(NSURL *)mediaFilePathURL:(NSString *)mediaKey {
  NSString *mediaFileName = [mediaKey pathExtension] ? mediaKey : [self mediaFileName:mediaKey];
  return [[self mediaDirURL] URLByAppendingPathComponent:mediaFileName];
}

@end


@implementation MediaManager (Downloader)

- (void)downloadFile:(NSString *)urlStr
       mediaFileName:(NSString *)mediaFileName
             success:(void (^)(NSURL *))success
             failure:(void (^)(NSString *error))failure {
  
  NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
  AFURLSessionManager *manager = [[AFURLSessionManager alloc] initWithSessionConfiguration:configuration];
  
  NSURL *URL = [NSURL URLWithString:urlStr];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [request addValue:self.cookies forHTTPHeaderField:@"Cookie"];

  NSURLSessionDownloadTask *dlTask;
  dlTask = [manager downloadTaskWithRequest:request
                                   progress:nil
                                destination:^NSURL *(NSURL *targetPath, NSURLResponse *response)
  {
    if (! mediaFileName) {
      return [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:[response suggestedFilename]];
    } else {
      return [[self mediaDirURL] URLByAppendingPathComponent:mediaFileName];
    }
  } completionHandler:^(NSURLResponse *response, NSURL *filePath, NSError *error) {
//      DDLogVerbose(@"File downloaded to: %@", [filePath absoluteString]);

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
    NSInteger status = httpResponse.statusCode;
    
    DDLogVerbose(@"status = %ld; url = %@",(long)status, urlStr);
    
    if ((BAD_STATUS_CODE(status) || error) && failure) {
      if (BAD_STATUS_CODE(status)) {
        if (error)
          NSLog(@"JSONObjectWithData error: %@", error);
        
        NSData *urlData = [NSData dataWithContentsOfURL:filePath];
        if (urlData) {
          NSError *jsonError = nil;
          id json = [NSJSONSerialization JSONObjectWithData:urlData
                                                    options:NSJSONReadingMutableContainers
                                                      error:&jsonError];
          if (NOT jsonError) {
            failure(json);
          } else {
            failure([[NSNumber numberWithInteger:status] description]);
          }
        } else {
          failure([[NSNumber numberWithInteger:status] description]);
        }
      } else {
        failure([NSString stringWithFormat:@"%@ (%ld)", [error localizedDescription], (long)[error code]]);
      }
      NSString *pathString = filePath.path;
      if ([[NSFileManager defaultManager] isDeletableFileAtPath:pathString]) {
        [[NSFileManager defaultManager] removeItemAtPath:pathString error:NULL];
      }
    
    } else if (success) {
      NSString *pathString = filePath.path;

      if (! mediaFileName) {
        NSError *writeErr = nil;
        [[[response URL] description] writeToFile:pathString
                                       atomically:YES
                                         encoding:NSUTF8StringEncoding
                                            error:&writeErr];
        
        if (writeErr) DDLogInfo(@"%@",[writeErr localizedDescription]);
      }
      success(filePath);
    }
  }];
  
  [dlTask resume];
}

@end

@implementation MediaManager

@synthesize bridge = _bridge;
@synthesize cookies = _cookies;
@synthesize userID = _userID;
@synthesize environment = _environment;

#define KEY_MEDIA_FILE_MOVE @"2.0.0: media file move"

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(setCookies:(NSString *)cookies) {
  _cookies = cookies;
}

RCT_EXPORT_METHOD(downloadMediaFile:(NSString *)urlStr mediaKey:(NSString *)mediaKey callback:(RCTResponseSenderBlock)callback) {
  NSString *mediaFileName = mediaKey;
  
  [self downloadFile:urlStr mediaFileName:mediaFileName success:^(NSURL *filePath) {
    
    if (callback)
      callback(@[[NSNull null], [filePath lastPathComponent]]);
    
  } failure:^(NSString *error) {
    if (callback)
      callback(@[error, @""]);
  }];
  
}

RCT_EXPORT_METHOD(deleteMedia:(NSString *)mediaFileName callback:(RCTResponseSenderBlock)callback) {
  NSURL *url = [[self mediaDirURL] URLByAppendingPathComponent:mediaFileName];
  NSString *pathString = url.path;
  
  if ([[NSFileManager defaultManager] isDeletableFileAtPath:pathString]) {
    NSError *error=nil;
    [[NSFileManager defaultManager] removeItemAtPath:pathString error:&error];
    if (error) {
      if (callback) callback(@[ error.localizedDescription ]);
      return;
    } else {
      if (callback) callback(@[]);
    }
  } else {
    if (callback) callback(@[ [NSString stringWithFormat:@"Undeletable file at path %@",pathString] ]);
  }
}

+(BOOL)fileExistsAtPath:(NSString *)path {
    NSString *pathString = [path stringByReplacingOccurrencesOfString:@"file://" withString:@""];
    return [[NSFileManager defaultManager] fileExistsAtPath:pathString];
}

RCT_EXPORT_METHOD(hasMedia:(NSString *)mediaKey callback:(RCTResponseSenderBlock)callback) {
  NSString *mediaFileName = mediaKey;
  NSURL *url = [[self mediaDirURL] URLByAppendingPathComponent:mediaFileName];
  NSString *pathString =  url.path;
  
  if (! [[NSFileManager defaultManager] fileExistsAtPath:pathString]) {
    pathString = nil;
  }
  if (callback) {
    callback(@[[NSNull null], pathString ? pathString : [NSNull null]]);
  }
}

@end
