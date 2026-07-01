import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_mlkit_object_detection/google_mlkit_object_detection.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import '../models/count_record.dart';
import '../services/storage_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  ObjectDetector? _objectDetector;
  List<DetectedObject> _detectedObjects = [];
  int _objectCount = 0;
  bool _isDetecting = false;
  bool _cameraReady = false;
  String? _errorMessage;
  Size? _imageSize;
  int _cameraSensorOrientation = 90;
  bool _showResult = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeDetector();
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopImageStream();
    _cameraController?.dispose();
    _objectDetector?.close();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (_cameraController == null) {
        _initializeCamera();
      }
    } else if (state == AppLifecycleState.paused) {
      _stopImageStream();
      _cameraController?.dispose();
      _cameraController = null;
      _cameraReady = false;
    }
  }

  void _initializeDetector() {
    _objectDetector = ObjectDetector(
      options: ObjectDetectorOptions(
        mode: DetectionMode.stream,
        classifyObjects: true,
        multipleObjects: true,
      ),
    );
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        if (mounted) setState(() => _errorMessage = 'No camera available');
        return;
      }

      // Prefer back camera
      final camera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _cameraSensorOrientation = camera.sensorOrientation;

      _cameraController = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.nv21,
      );

      await _cameraController!.initialize();

      if (!mounted) return;

      setState(() => _cameraReady = true);

      await _cameraController!.startImageStream(_processImageStream);
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage =
              'Camera error: ${e.toString().length > 100 ? e.toString().substring(0, 100) : e.toString()}';
        });
      }
    }
  }

  void _stopImageStream() {
    try {
      _cameraController?.stopImageStream();
    } catch (_) {}
  }

  void _processImageStream(CameraImage image) {
    if (_isDetecting || _objectDetector == null) return;
    _isDetecting = true;

    _detectObjects(image).then((_) => _isDetecting = false);
  }

  Future<void> _detectObjects(CameraImage image) async {
    try {
      final inputImage = _buildInputImage(image);
      if (inputImage == null) return;

      final List<DetectedObject> objects =
          await _objectDetector!.processImage(inputImage);

      if (!mounted) return;

      // Filter: only keep reasonably sized objects (likely packets)
      final imageArea = image.width * image.height;
      final filtered = objects.where((obj) {
        final box = obj.boundingBox;
        final area = box.width * box.height;
        // Filter out very small detections (< 1.5% of image) as noise
        return area > imageArea * 0.015;
      }).toList();

      setState(() {
        _detectedObjects = filtered;
        _objectCount = filtered.length;
        _imageSize = Size(image.width.toDouble(), image.height.toDouble());
      });
    } catch (e) {
      // Silently handle detection errors during stream
    }
  }

  InputImage? _buildInputImage(CameraImage image) {
    final rotation = InputImageRotation.values.firstWhere(
      (r) => r.rawValue == _cameraSensorOrientation,
      orElse: () => InputImageRotation.rotation0deg,
    );

    // NV21 format: concatenate all planes
    final bytesBuilder = BytesBuilder();
    for (final Plane plane in image.planes) {
      bytesBuilder.add(plane.bytes);
    }
    final bytes = bytesBuilder.toBytes();

    final metadata = InputImageMetadata(
      size: Size(image.width.toDouble(), image.height.toDouble()),
      rotation: rotation,
      format: InputImageFormat.nv21,
      bytesPerRow: image.planes[0].bytesPerRow,
    );

    return InputImage.fromBytes(bytes: bytes, metadata: metadata);
  }

  Future<void> _captureAndSave() async {
    if (_cameraController == null || !_cameraReady) return;

    try {
      // Take a photo
      final XFile photo = await _cameraController!.takePicture();
      final appDir = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final savedPath = '${appDir.path}/count_$timestamp.jpg';
      await File(photo.path).copy(savedPath);

      // Create record
      final record = CountRecord(
        id: timestamp.toString(),
        count: _objectCount,
        timestamp: DateTime.now(),
        imagePath: savedPath,
      );

      // Save to storage
      final storage = StorageService();
      await storage.saveRecord(record);

      if (mounted) {
        setState(() {
          _showResult = true;
        });

        // Haptic feedback
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved: $_objectCount packets counted'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.green.shade700,
            duration: const Duration(seconds: 2),
          ),
        );

        // Auto-dismiss result after 2.5 seconds
        Future.delayed(const Duration(milliseconds: 2500), () {
          if (mounted) setState(() => _showResult = false);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().length > 60 ? e.toString().substring(0, 60) : e.toString()}'),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text('Quan Scan'),
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: const Icon(Icons.history_rounded),
              onPressed: () => Navigator.pushNamed(context, '/history'),
              tooltip: 'History',
            ),
            IconButton(
              icon: const Icon(Icons.flip_camera_android_rounded),
              onPressed: _switchCamera,
              tooltip: 'Switch camera',
            ),
          ],
        ),
        body: _buildBody(),
      ),
    );
  }

  int _currentCameraIndex = 0;
  Future<void> _switchCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.length < 2) return;

      _currentCameraIndex = (_currentCameraIndex + 1) % cameras.length;

      _stopImageStream();
      await _cameraController?.dispose();
      _cameraController = null;
      _cameraReady = false;

      setState(() {
        _detectedObjects = [];
        _objectCount = 0;
        _imageSize = null;
      });

      final camera = cameras[_currentCameraIndex];
      _cameraSensorOrientation = camera.sensorOrientation;

      _cameraController = CameraController(
        camera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.nv21,
      );

      await _cameraController!.initialize();

      if (!mounted) return;

      setState(() => _cameraReady = true);
      await _cameraController!.startImageStream(_processImageStream);
    } catch (_) {}
  }

  Widget _buildBody() {
    if (_errorMessage != null) {
      final colorScheme = Theme.of(context).colorScheme;
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: colorScheme.error),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  setState(() => _errorMessage = null);
                  _initializeCamera();
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (!_cameraReady || _cameraController == null) {
      return const Center(child: CircularProgressIndicator(color: Colors.white));
    }

    // Use a LayoutBuilder to track the preview size for the overlay
    return LayoutBuilder(
      builder: (context, constraints) {
        final previewSize = Size(constraints.maxWidth, constraints.maxHeight);

        return Stack(
          children: [
            // Camera preview fills the available space
            SizedBox(
              width: constraints.maxWidth,
              height: constraints.maxHeight,
              child: CameraPreview(_cameraController!),
            ),

            // Detection overlay
            if (_imageSize != null && _detectedObjects.isNotEmpty)
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: DetectionPainter(
                      objects: _detectedObjects,
                      imageSize: _imageSize!,
                      previewSize: previewSize,
                      rotation: _cameraSensorOrientation,
                    ),
                  ),
                ),
              ),

            // Top count card
            Positioned(
              top: 8,
              left: 16,
              right: 16,
              child: _buildCountCard(),
            ),

            // Result overlay
            if (_showResult)
              Positioned.fill(
                child: _buildResultOverlay(),
              ),

            // Bottom controls
            Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: _buildBottomControls(),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCountCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _objectCount > 0
              ? Colors.greenAccent.withValues(alpha: 0.5)
              : Colors.white24,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inventory_2_rounded,
            color: _objectCount > 0 ? Colors.greenAccent : Colors.white54,
            size: 28,
          ),
          const SizedBox(width: 12),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              '$_objectCount',
              key: ValueKey(_objectCount),
              style: TextStyle(
                fontSize: 42,
                fontWeight: FontWeight.bold,
                color: _objectCount > 0 ? Colors.greenAccent : Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _objectCount == 1 ? 'Packet' : 'Packets',
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(width: 16),
          if (_objectCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.greenAccent.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'LIVE',
                style: TextStyle(
                  color: Colors.greenAccent,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildResultOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(32),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.greenAccent.withValues(alpha: 0.5),
              width: 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: Colors.greenAccent, size: 64),
              const SizedBox(height: 16),
              const Text(
                'Count Saved!',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$_objectCount packets counted',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('h:mm a').format(DateTime.now()),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Point camera at milk packets to count',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          width: 72,
          height: 72,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            border: Border.fromBorderSide(
              BorderSide(color: Colors.white, width: 3),
            ),
          ),
          child: IconButton(
            onPressed: _captureAndSave,
            icon: const Icon(Icons.camera_alt_rounded, size: 32),
            color: Colors.white,
            tooltip: 'Capture & Save',
          ),
        ),
      ],
    );
  }
}

class DetectionPainter extends CustomPainter {
  final List<DetectedObject> objects;
  final Size imageSize;
  final Size previewSize;
  final int rotation;

  DetectionPainter({
    required this.objects,
    required this.imageSize,
    required this.previewSize,
    required this.rotation,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (objects.isEmpty || imageSize == Size.zero) return;

    final overlappingIndices = <int>{};
    for (int i = 0; i < objects.length; i++) {
      for (int j = i + 1; j < objects.length; j++) {
        final rect1 = objects[i].boundingBox;
        final rect2 = objects[j].boundingBox;
        final intersection = rect1.intersect(rect2);
        if (intersection.width > 0 && intersection.height > 0) {
          final intersectArea = intersection.width * intersection.height;
          final area1 = rect1.width * rect1.height;
          final area2 = rect2.width * rect2.height;
          if (intersectArea > area1 * 0.2 || intersectArea > area2 * 0.2) {
            overlappingIndices.add(i);
            overlappingIndices.add(j);
          }
        }
      }
    }

    for (int i = 0; i < objects.length; i++) {
      final object = objects[i];
      final isOverlaid = overlappingIndices.contains(i);
      
      final baseColor = isOverlaid ? Colors.purpleAccent : Colors.greenAccent;
      
      final boxPaint = Paint()
        ..color = baseColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round;

      final fillPaint = Paint()
        ..color = baseColor.withValues(alpha: 0.15)
        ..style = PaintingStyle.fill;

      final labelBgPaint = Paint()
        ..color = baseColor.withValues(alpha: 0.85)
        ..style = PaintingStyle.fill;

      final Rect rect = object.boundingBox;
      final Rect transformedRect = _transformRect(rect);

      // Draw filled background
      canvas.drawRect(transformedRect, fillPaint);

      // Draw bounding box
      canvas.drawRect(transformedRect, boxPaint);
      
      // Draw a small square upon the milk packet (center marker)
      final centerPaint = Paint()
        ..color = baseColor
        ..style = PaintingStyle.fill;
      final centerRect = Rect.fromCenter(
        center: transformedRect.center, 
        width: 16, 
        height: 16
      );
      canvas.drawRect(centerRect, centerPaint);
      
      // Draw corner markers
      final cornerLen = 12.0;
      final cornerPaint = Paint()
        ..color = baseColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5;

      // Top-left
      canvas.drawLine(
        transformedRect.topLeft,
        Offset(transformedRect.left + cornerLen, transformedRect.top),
        cornerPaint,
      );
      canvas.drawLine(
        transformedRect.topLeft,
        Offset(transformedRect.left, transformedRect.top + cornerLen),
        cornerPaint,
      );
      // Top-right
      canvas.drawLine(
        transformedRect.topRight,
        Offset(transformedRect.right - cornerLen, transformedRect.top),
        cornerPaint,
      );
      canvas.drawLine(
        transformedRect.topRight,
        Offset(transformedRect.right, transformedRect.top + cornerLen),
        cornerPaint,
      );
      // Bottom-left
      canvas.drawLine(
        transformedRect.bottomLeft,
        Offset(transformedRect.left + cornerLen, transformedRect.bottom),
        cornerPaint,
      );
      canvas.drawLine(
        transformedRect.bottomLeft,
        Offset(transformedRect.left, transformedRect.bottom - cornerLen),
        cornerPaint,
      );
      // Bottom-right
      canvas.drawLine(
        transformedRect.bottomRight,
        Offset(transformedRect.right - cornerLen, transformedRect.bottom),
        cornerPaint,
      );
      canvas.drawLine(
        transformedRect.bottomRight,
        Offset(transformedRect.right, transformedRect.bottom - cornerLen),
        cornerPaint,
      );

      // Draw label
      final label = _getLabel(object);
      if (label != null) {
        final textPainter = TextPainter(
          text: TextSpan(
            text: isOverlaid ? '$label (Overlaid)' : label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          textDirection: ui.TextDirection.ltr,
        );
        textPainter.layout();

        final labelHeight = textPainter.height + 6;
        final labelWidth = textPainter.width + 12;
        final labelRect = Rect.fromLTWH(
          transformedRect.left,
          (transformedRect.top - labelHeight).clamp(0, double.infinity),
          labelWidth,
          labelHeight,
        );

        canvas.drawRRect(
          RRect.fromRectAndRadius(labelRect, const Radius.circular(4)),
          labelBgPaint,
        );

        textPainter.paint(
          canvas,
          Offset(labelRect.left + 6, labelRect.top + 3),
        );
      }
    }
  }

  Rect _transformRect(Rect rect) {
    if (imageSize == Size.zero || previewSize == Size.zero) return rect;

    double left, top, right, bottom;

    switch (rotation) {
      case 90:
        // Portrait mode: image is rotated 90° CW relative to display
        final scaleX = previewSize.width / imageSize.height;
        final scaleY = previewSize.height / imageSize.width;
        left = rect.top * scaleX;
        top = (imageSize.width - rect.right) * scaleY;
        right = rect.bottom * scaleX;
        bottom = (imageSize.width - rect.left) * scaleY;
        break;
      case 270:
        // Reverse portrait
        final scaleX = previewSize.width / imageSize.height;
        final scaleY = previewSize.height / imageSize.width;
        left = (imageSize.height - rect.bottom) * scaleX;
        top = rect.left * scaleY;
        right = (imageSize.height - rect.top) * scaleX;
        bottom = rect.right * scaleY;
        break;
      case 180:
        // Upside down
        final scaleX = previewSize.width / imageSize.width;
        final scaleY = previewSize.height / imageSize.height;
        left = (imageSize.width - rect.right) * scaleX;
        top = (imageSize.height - rect.bottom) * scaleY;
        right = (imageSize.width - rect.left) * scaleX;
        bottom = (imageSize.height - rect.top) * scaleY;
        break;
      default:
        // 0° - landscape
        final scaleX = previewSize.width / imageSize.width;
        final scaleY = previewSize.height / imageSize.height;
        left = rect.left * scaleX;
        top = rect.top * scaleY;
        right = rect.right * scaleX;
        bottom = rect.bottom * scaleY;
        break;
    }

    return Rect.fromLTRB(left, top, right, bottom);
  }

  String? _getLabel(DetectedObject object) {
    if (object.labels.isNotEmpty) {
      return object.labels.first.text;
    }
    // Show confidence if tracking ID available
    if (object.trackingId != null) {
      return '#${object.trackingId}';
    }
    return null;
  }

  @override
  bool shouldRepaint(DetectionPainter oldDelegate) {
    return oldDelegate.objects != objects ||
        oldDelegate.imageSize != imageSize ||
        oldDelegate.previewSize != previewSize;
  }
}
