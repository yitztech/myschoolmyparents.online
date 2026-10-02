import ExpoModulesCore
import PDFKit
import UIKit
import Vision

internal final class OcrException: GenericException<String> {
  override var reason: String { param }
}

/// OCR local con Apple Vision y lectura de PDF con PDFKit. Es el antiguo puente de
/// AppDelegate.swift de la app Flutter, convertido en módulo Expo.
public final class MsmOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MsmOcr")

    AsyncFunction("openTtsSettings") { () -> Bool in
      guard let url = URL(string: UIApplication.openSettingsURLString) else { return false }
      return await withCheckedContinuation { continuation in
        DispatchQueue.main.async {
          guard UIApplication.shared.canOpenURL(url) else {
            continuation.resume(returning: false)
            return
          }
          UIApplication.shared.open(url, options: [:]) { _ in continuation.resume(returning: true) }
        }
      }
    }

    AsyncFunction("getPdfPageCount") { (path: String) -> Int in
      guard let document = PDFDocument(url: URL(fileURLWithPath: path)) else {
        throw OcrException("No se pudo abrir el PDF.")
      }
      return document.pageCount
    }

    AsyncFunction("processPdfPage") { (path: String, pageIndex: Int, targetPath: String?) -> [String: Any] in
      guard let document = PDFDocument(url: URL(fileURLWithPath: path)),
            pageIndex >= 0, pageIndex < document.pageCount,
            let page = document.page(at: pageIndex) else {
        throw OcrException("No se pudo acceder a la página del PDF.")
      }

      // 1. Renderizar la página a alta resolución (2.5x) sobre fondo blanco.
      let pageBounds = page.bounds(for: .mediaBox)
      let scale: CGFloat = 2.5
      let targetSize = CGSize(width: max(pageBounds.width * scale, 100), height: max(pageBounds.height * scale, 100))
      let renderedImage = UIGraphicsImageRenderer(size: targetSize).image { ctx in
        UIColor.white.set()
        ctx.fill(CGRect(origin: .zero, size: targetSize))
        ctx.cgContext.translateBy(x: 0.0, y: targetSize.height)
        ctx.cgContext.scaleBy(x: scale, y: -scale)
        page.draw(with: .mediaBox, to: ctx.cgContext)
      }

      let finalPath: String
      let shouldCleanup: Bool
      if let tp = targetPath, !tp.isEmpty {
        finalPath = tp
        shouldCleanup = false
      } else {
        finalPath = URL(fileURLWithPath: NSTemporaryDirectory())
          .appendingPathComponent("pdf_page_\(pageIndex)_\(UUID().uuidString).png").path
        shouldCleanup = true
      }
      let destination = URL(fileURLWithPath: finalPath)
      try? FileManager.default.createDirectory(at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
      if let png = renderedImage.pngData() { try? png.write(to: destination) }

      // 2. Enfoque híbrido: si el PDF trae texto seleccionable, se usa directamente.
      let directText = page.string?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
      if directText.count > 25 {
        let paragraphs = directText
          .components(separatedBy: "\n\n")
          .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
          .filter { !$0.isEmpty }
        return [
          "rawText": directText,
          "paragraphs": paragraphs.isEmpty ? [directText] : paragraphs,
          "lines": [[String: Any]](),
          "imagePath": finalPath,
          "engine": "pdfkit-direct",
        ]
      }

      // 3. PDF escaneado o solo imagen: OCR con Apple Vision.
      return try Self.recognizeImage(path: finalPath, extra: ["imagePath": finalPath], cleanup: shouldCleanup)
    }

    AsyncFunction("recognize") { (path: String) -> [String: Any] in
      try Self.recognizeImage(path: path, extra: [:], cleanup: false)
    }
  }

  private static func recognizeImage(path: String, extra: [String: Any], cleanup: Bool) throws -> [String: Any] {
    defer { if cleanup { try? FileManager.default.removeItem(atPath: path) } }
    guard FileManager.default.fileExists(atPath: path) else {
      throw OcrException("El archivo de imagen no existe: \(path)")
    }

    var directory = URL(fileURLWithPath: path).deletingLastPathComponent()
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try? directory.setResourceValues(values)

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["en-US", "es-ES"]
    request.usesLanguageCorrection = false

    do {
      try VNImageRequestHandler(url: URL(fileURLWithPath: path), options: [:]).perform([request])
    } catch {
      throw OcrException("No se pudo leer esta imagen.")
    }

    let observations = (request.results ?? []).sorted {
      if abs($0.boundingBox.midY - $1.boundingBox.midY) < 0.01 {
        return $0.boundingBox.minX < $1.boundingBox.minX
      }
      return $0.boundingBox.midY > $1.boundingBox.midY
    }
    let lines: [[String: Any]] = observations.compactMap { observation in
      guard let candidate = observation.topCandidates(1).first else { return nil }
      let box = observation.boundingBox
      return [
        "text": candidate.string, "confidence": candidate.confidence,
        "left": box.minX, "top": 1 - box.maxY, "width": box.width, "height": box.height,
      ]
    }
    var paragraphs: [String] = []
    var previous: VNRecognizedTextObservation?
    for observation in observations {
      guard let text = observation.topCandidates(1).first?.string else { continue }
      if let prev = previous, let last = paragraphs.last,
         prev.boundingBox.minY - observation.boundingBox.maxY < max(prev.boundingBox.height, observation.boundingBox.height) * 1.2,
         abs(prev.boundingBox.minX - observation.boundingBox.minX) < 0.08 {
        paragraphs[paragraphs.count - 1] = last + "\n" + text
      } else {
        paragraphs.append(text)
      }
      previous = observation
    }

    var payload: [String: Any] = [
      "rawText": lines.compactMap { $0["text"] as? String }.joined(separator: "\n"),
      "paragraphs": paragraphs,
      "lines": lines,
      "engine": "apple-vision",
    ]
    for (k, v) in extra { payload[k] = v }
    return payload
  }
}
