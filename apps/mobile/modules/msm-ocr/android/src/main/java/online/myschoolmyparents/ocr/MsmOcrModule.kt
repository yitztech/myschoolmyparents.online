package online.myschoolmyparents.ocr

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class OcrException(code: String, message: String) : CodedException(code, message, null)

/**
 * OCR local con ML Kit y lectura de PDF con PdfRenderer. Es el antiguo puente de
 * MainActivity.kt de la app Flutter, convertido en módulo Expo. Las funciones asíncronas
 * se ejecutan fuera del hilo principal, así que bloquear con Tasks.await es seguro.
 */
class MsmOcrModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("MsmOcr")

    AsyncFunction("openTtsSettings") {
      val intent = Intent("android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }

    AsyncFunction("getPdfPageCount") { path: String ->
      var fd: ParcelFileDescriptor? = null
      try {
        fd = openParcelFile(path)
        val renderer = PdfRenderer(fd)
        val count = renderer.pageCount
        renderer.close()
        count
      } catch (e: Exception) {
        throw OcrException("pdf_error", "No se pudo abrir el PDF: ${e.message}")
      } finally {
        try { fd?.close() } catch (_: Exception) {}
      }
    }

    AsyncFunction("processPdfPage") { path: String, pageIndex: Int, targetPath: String? ->
      processPdfPage(path, pageIndex, targetPath)
    }

    AsyncFunction("recognize") { path: String ->
      recognizeImage(path, null, emptyMap())
    }
  }

  private fun openParcelFile(path: String): ParcelFileDescriptor =
    if (path.startsWith("content://")) {
      context.contentResolver.openFileDescriptor(Uri.parse(path), "r")
        ?: throw IllegalArgumentException("No se pudo abrir el descriptor de contenido para: $path")
    } else {
      ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
    }

  private fun processPdfPage(path: String, pageIndex: Int, targetPath: String?): Map<String, Any> {
    var fd: ParcelFileDescriptor? = null
    try {
      fd = openParcelFile(path)
      val renderer = PdfRenderer(fd)
      if (pageIndex < 0 || pageIndex >= renderer.pageCount) {
        val total = renderer.pageCount
        renderer.close()
        throw OcrException("invalid_page", "Índice de página fuera de rango ($pageIndex). Total: $total")
      }
      val page = renderer.openPage(pageIndex)
      // 3x (72 → 216 DPI) para un OCR nítido.
      val scale = 3
      val bitmap = Bitmap.createBitmap(page.width * scale, page.height * scale, Bitmap.Config.ARGB_8888)
      bitmap.eraseColor(Color.WHITE)
      page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
      page.close()
      renderer.close()

      val finalImage: File
      val cleanup: Boolean
      if (!targetPath.isNullOrEmpty()) {
        finalImage = File(targetPath)
        finalImage.parentFile?.mkdirs()
        cleanup = false
      } else {
        finalImage = File.createTempFile("pdf_page_${pageIndex}_", ".png", context.cacheDir)
        cleanup = true
      }
      FileOutputStream(finalImage).use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }
      bitmap.recycle()

      return recognizeImage(
        finalImage.absolutePath,
        if (cleanup) finalImage else null,
        mapOf("imagePath" to finalImage.absolutePath),
      )
    } catch (e: OcrException) {
      throw e
    } catch (e: Exception) {
      throw OcrException("pdf_page_error", "No se pudo procesar la página del PDF: ${e.message}")
    } finally {
      try { fd?.close() } catch (_: Exception) {}
    }
  }

  private fun recognizeImage(path: String, cleanup: File?, extra: Map<String, Any>): Map<String, Any> {
    try {
      val file = File(path)
      if (!file.exists() || file.length() == 0L) {
        throw OcrException("file_not_found", "El archivo de imagen no existe o está vacío: $path")
      }
      val image: InputImage = try {
        InputImage.fromFilePath(context, Uri.fromFile(file))
      } catch (e: Exception) {
        val bitmap = BitmapFactory.decodeFile(file.absolutePath)
          ?: throw OcrException("image_failed", "No se pudo decodificar el archivo como imagen: $path")
        InputImage.fromBitmap(bitmap, 0)
      }

      val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      try {
        val text = try {
          Tasks.await(recognizer.process(image))
        } catch (e: Exception) {
          throw OcrException("ocr_failed", "No se pudo leer esta imagen: ${e.message}")
        }
        val payload = mutableMapOf<String, Any>(
          "rawText" to text.text,
          "paragraphs" to text.textBlocks.map { it.text },
          "lines" to text.textBlocks.flatMap { it.lines }.map { line ->
            val box = line.boundingBox
            mapOf(
              "text" to line.text,
              "left" to (box?.left ?: 0),
              "top" to (box?.top ?: 0),
              "width" to (box?.width() ?: 0),
              "height" to (box?.height() ?: 0),
            )
          },
          "engine" to "mlkit-latin-16.0.1",
        )
        payload.putAll(extra)
        return payload
      } finally {
        recognizer.close()
      }
    } catch (e: OcrException) {
      throw e
    } catch (e: Exception) {
      throw OcrException("image_failed", "No se pudo abrir esta imagen: ${e.message}")
    } finally {
      cleanup?.delete()
    }
  }
}
