#if canImport(XCTest)
import XCTest
@testable import VKYC

final class VKYCTests: XCTestCase {
    func testPackageCompiles() {
        XCTAssertTrue(true)
    }
}
#else
// Keeps this file parseable in editors without Apple XCTest toolchains.
struct VKYCTestsPlaceholder {}
#endif
