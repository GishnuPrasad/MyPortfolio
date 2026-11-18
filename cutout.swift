// Lifts the subject out of a photo using macOS Vision (runs fully on this Mac, nothing is uploaded).
// Usage: swift cutout.swift input.png cutout.png
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("usage: swift cutout.swift <input image> <output png>") }
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard let ciImage = CIImage(contentsOf: inURL) else { fatalError("cannot load \(args[1])") }

let handler = VNImageRequestHandler(ciImage: ciImage)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else { fatalError("no foreground subject found") }

let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buffer)
try CIContext().writePNGRepresentation(of: out, to: outURL, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("wrote", outURL.path)
