//
//  ViewController.h
//  VKYC Example (Objective-C)
//

#ifdef __OBJC__
#if __has_include(<UIKit/UIKit.h>)
#import <UIKit/UIKit.h>
@interface ViewController : UIViewController
#elif __has_include(<objc/NSObject.h>)
#import <objc/NSObject.h>
@interface ViewController : NSObject
#else
@interface ViewController
#endif

@end
#else
typedef struct ViewController ViewController;
#endif
