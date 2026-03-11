// watcher.swift — keyboard tap + scene capture (screenshot + AX text-area bounds)
// Outputs one JSON line per keystroke.  On each app switch a separate
// {"type":"scene", ...} line is emitted once the async screenshot completes.

import Cocoa
import Foundation
import ScreenCaptureKit

// ── Globals ───────────────────────────────────────────────────────────────────
var tapPort:      CFMachPort? = nil
var lastSceneApp: String      = ""

let formatter: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
}()

// ── Scene capture (async) ─────────────────────────────────────────────────────
// Invoked via Task {} on each app switch; never blocks the tap callback.
// Emits a {"type":"scene", ...} JSON line when the screenshot is ready.

func captureScene(appName: String, ts: String) async {
    guard let screen = NSScreen.main else { return }
    let screenPts   = screen.frame          // logical pts, bottom-left origin
    let scaleFactor = screen.backingScaleFactor

    // ── Screen Recording permission ───────────────────────────────────────────
    guard CGPreflightScreenCaptureAccess() else {
        let err: [String: String] = [
            "error":  "screen_recording_required",
            "detail": "Grant access in System Settings → Privacy & Security → Screen Recording, then restart.",
        ]
        if let data = try? JSONSerialization.data(withJSONObject: err),
           let line = String(data: data, encoding: .utf8) { print(line); fflush(stdout) }
        return
    }

    // ── Capture main display via ScreenCaptureKit (macOS 14+) ─────────────────
    let content: SCShareableContent
    do {
        content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
    } catch { return }

    guard let display = content.displays.first else { return }

    let filter = SCContentFilter(display: display, excludingWindows: [])
    let cfg    = SCStreamConfiguration()
    cfg.width       = Int(screenPts.width  * scaleFactor)
    cfg.height      = Int(screenPts.height * scaleFactor)
    cfg.showsCursor = false

    let cgImg: CGImage
    do {
        cgImg = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: cfg)
    } catch { return }

    // ── Scale down to max 1 280 px wide ───────────────────────────────────────
    let physW = cgImg.width
    let physH = cgImg.height
    let maxW  = 1280
    let scl   = physW > maxW ? Double(maxW) / Double(physW) : 1.0
    let outW  = Int(Double(physW) * scl)
    let outH  = Int(Double(physH) * scl)

    guard let bctx = CGContext(
        data: nil, width: outW, height: outH,
        bitsPerComponent: 8, bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else { return }

    bctx.draw(cgImg, in: CGRect(x: 0, y: 0, width: outW, height: outH))
    guard let resized = bctx.makeImage() else { return }

    let rep = NSBitmapImageRep(cgImage: resized)
    guard let jpegData = rep.representation(
        using: .jpeg,
        properties: [.compressionFactor: 0.65]
    ) else { return }

    let b64 = "data:image/jpeg;base64," + jpegData.base64EncodedString()

    // ── Focused text-element bounding rect (via Accessibility API) ────────────
    // "AXFocusedUIElement" / "AXFrame" are the raw string values of the
    // deprecated kAXFocusedUIElementAttribute / kAXFrameAttribute constants.
    var textArea: [String: Double] = ["x": 0, "y": 0, "w": 0, "h": 0]

    if let frontApp = NSWorkspace.shared.frontmostApplication {
        let appEl = AXUIElementCreateApplication(frontApp.processIdentifier)
        var focusedRef: CFTypeRef?

        if AXUIElementCopyAttributeValue(
            appEl,
            "AXFocusedUIElement" as CFString,
            &focusedRef
        ) == .success, let focusedRef = focusedRef {

            var frameRef: CFTypeRef?
            let focusedEl = focusedRef as! AXUIElement

            if AXUIElementCopyAttributeValue(
                focusedEl,
                "AXFrame" as CFString,
                &frameRef
            ) == .success, let frameRef = frameRef {

                let axVal: AXValue = unsafeBitCast(frameRef, to: AXValue.self)
                var frame = CGRect.zero

                if AXValueGetValue(axVal, .cgRect, &frame) {
                    let sW = Double(screenPts.width)
                    let sH = Double(screenPts.height)
                    // Flip Y: AX uses bottom-left, screenshots use top-left
                    let flippedY = sH - Double(frame.origin.y) - Double(frame.size.height)
                    textArea = [
                        "x": max(0, Double(frame.origin.x) / sW),
                        "y": max(0, flippedY / sH),
                        "w": min(1, Double(frame.size.width)  / sW),
                        "h": min(1, Double(frame.size.height) / sH),
                    ]
                }
            }
        }
    }

    // ── Emit {"type":"scene", ...} JSON line ──────────────────────────────────
    let scene: [String: Any] = [
        "screenshot": b64,
        "textArea":   textArea,
        "screenW":    Int(screenPts.width  * scaleFactor),
        "screenH":    Int(screenPts.height * scaleFactor),
    ]
    let payload: [String: Any] = [
        "type":  "scene",
        "app":   appName,
        "ts":    ts,
        "scene": scene,
    ]
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
       let line = String(data: data, encoding: .utf8) {
        print(line)
        fflush(stdout)
    }
}

// ── Event tap callback ────────────────────────────────────────────────────────
func tapCallback(
    proxy:  CGEventTapProxy,
    type:   CGEventType,
    event:  CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {

    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        if let port = tapPort { CGEvent.tapEnable(tap: port, enable: true) }
        return nil
    }

    guard type == .keyDown else { return Unmanaged.passRetained(event) }

    let flags = event.flags
    if flags.contains(.maskCommand) || flags.contains(.maskControl) {
        return Unmanaged.passRetained(event)
    }

    let keyCode = event.getIntegerValueField(.keyboardEventKeycode)

    var buf = [UniChar](repeating: 0, count: 8)
    var count = 0
    event.keyboardGetUnicodeString(maxStringLength: 8, actualStringLength: &count, unicodeString: &buf)
    let text = count > 0
        ? String(utf16CodeUnits: Array(buf.prefix(count)), count: count)
        : ""

    let evType: String
    let evText: String

    switch keyCode {
    case 36, 76:   evType = "insert"; evText = "↵"
    case 48:       evType = "insert"; evText = "⇥"
    case 51:       evType = "delete"; evText = "⌫"
    case 117:      evType = "delete"; evText = "⌦"
    default:
        guard let scalar = text.unicodeScalars.first, scalar.value >= 0x20 else {
            return Unmanaged.passRetained(event)
        }
        evType = "insert"; evText = text
    }

    let appName = NSWorkspace.shared.frontmostApplication?.localizedName ?? "Unknown"
    let ts      = formatter.string(from: Date())

    // ── Emit keystroke JSON line immediately ──────────────────────────────────
    let payload: [String: Any] = [
        "ts":   ts,
        "app":  appName,
        "type": evType,
        "text": evText,
    ]
    if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
       let line = String(data: data, encoding: .utf8) {
        print(line)
        fflush(stdout)
    }

    // ── On app switch: kick off async scene capture ───────────────────────────
    if appName != lastSceneApp {
        lastSceneApp = appName
        let captureApp = appName
        let captureTs  = ts
        Task { await captureScene(appName: captureApp, ts: captureTs) }
    }

    return Unmanaged.passRetained(event)
}

// ── Accessibility permission check ────────────────────────────────────────────
if !AXIsProcessTrusted() {
    let opts = [kAXTrustedCheckOptionPrompt.takeRetainedValue() as String: true] as CFDictionary
    AXIsProcessTrustedWithOptions(opts)
    let err: [String: String] = [
        "error":  "accessibility_required",
        "detail": "Grant access in System Settings → Privacy & Security → Accessibility, then restart.",
    ]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let line = String(data: data, encoding: .utf8) { print(line); fflush(stdout) }
    exit(1)
}

// ── Create event tap ──────────────────────────────────────────────────────────
let mask: CGEventMask = 1 << CGEventType.keyDown.rawValue

guard let port = CGEvent.tapCreate(
    tap:              .cgSessionEventTap,
    place:            .headInsertEventTap,
    options:          .listenOnly,
    eventsOfInterest: mask,
    callback:         tapCallback,
    userInfo:         nil
) else {
    let err: [String: String] = ["error": "tap_create_failed",
                                  "detail": "Ensure Accessibility permission is granted."]
    if let data = try? JSONSerialization.data(withJSONObject: err),
       let line = String(data: data, encoding: .utf8) { print(line); fflush(stdout) }
    exit(1)
}

tapPort = port
let src = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, port, 0)
CFRunLoopAddSource(CFRunLoopGetMain(), src, .commonModes)
CGEvent.tapEnable(tap: port, enable: true)

print(#"{"status":"ready"}"#)
fflush(stdout)

RunLoop.main.run()
