// Draws the app icon: two gymnastic rings hanging from straps.
// Usage: swift scripts/make-icon.swift <output.png> [light|dark|tinted]
//   light  – opaque blue→indigo gradient, white rings (default)
//   dark   – transparent background (iOS adds its dark backdrop), blue rings
//   tinted – transparent background, white rings (iOS recolours it with the user's tint)
// Regenerate all three with `make icons`.
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let args = Array(CommandLine.arguments.dropFirst())
let output = args.first ?? "AppIcon.png"
let variant = args.count > 1 ? args[1] : "light"
guard ["light", "dark", "tinted"].contains(variant) else { fatalError("Unknown variant \(variant)") }
let size = 1024
let space = CGColorSpace(name: CGColorSpace.sRGB)!

// The light icon must be opaque (App Store rule); dark and tinted keep a transparent background.
let alpha: CGImageAlphaInfo = variant == "light" ? .noneSkipLast : .premultipliedLast
guard let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: space, bitmapInfo: alpha.rawValue
) else { fatalError("Could not create bitmap context") }

// Background gradient, top-left (accent blue) → bottom-right (indigo).
let gradient = CGGradient(
    colorsSpace: space,
    colors: [
        CGColor(srgbRed: 0.157, green: 0.478, blue: 0.957, alpha: 1),
        CGColor(srgbRed: 0.290, green: 0.180, blue: 0.720, alpha: 1),
    ] as CFArray,
    locations: [0, 1]
)!
if variant == "light" {
    ctx.drawLinearGradient(gradient, start: CGPoint(x: 0, y: size), end: CGPoint(x: size, y: 0), options: [])
}

// Core Graphics origin is bottom-left, so y grows upward.
let ringRadius: CGFloat = 130
let ringWidth: CGFloat = 62
let ringCenterY: CGFloat = 400
let ringCentersX: [CGFloat] = [342, 682]
let strapWidth: CGFloat = 38
// Ring colour: white on the light gradient and for tinting; a bright blue on the dark backdrop.
let white = variant == "dark"
    ? CGColor(srgbRed: 0.42, green: 0.64, blue: 1.0, alpha: 1)
    : CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1)
let strapColor = white.copy(alpha: 0.85)!

if variant == "light" {
    ctx.setShadow(offset: CGSize(width: 0, height: -14), blur: 28,
                  color: CGColor(srgbRed: 0, green: 0, blue: 0.15, alpha: 0.35))
}

for x in ringCentersX {
    // Strap from the top edge down into the ring.
    let strapBottom = ringCenterY + ringRadius - ringWidth / 2
    ctx.setFillColor(strapColor)
    ctx.fill(CGRect(x: x - strapWidth / 2, y: strapBottom, width: strapWidth, height: CGFloat(size) - strapBottom))

    // Buckle across the strap.
    ctx.setFillColor(white)
    let buckle = CGRect(x: x - strapWidth / 2 - 14, y: 720, width: strapWidth + 28, height: 34)
    ctx.addPath(CGPath(roundedRect: buckle, cornerWidth: 10, cornerHeight: 10, transform: nil))
    ctx.fillPath()

    // Ring.
    ctx.setStrokeColor(white)
    ctx.setLineWidth(ringWidth)
    ctx.strokeEllipse(in: CGRect(x: x - ringRadius, y: ringCenterY - ringRadius,
                                 width: ringRadius * 2, height: ringRadius * 2))
}

guard let image = ctx.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
          URL(fileURLWithPath: output) as CFURL, UTType.png.identifier as CFString, 1, nil)
else { fatalError("Could not create image") }
CGImageDestinationAddImage(destination, image, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Could not write \(output)") }
print("Wrote \(output)")
