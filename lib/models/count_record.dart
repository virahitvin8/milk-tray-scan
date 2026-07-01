class CountRecord {
  final String id;
  final int count;
  final int standaloneCount;
  final int overlappedCount;
  final DateTime timestamp;
  final String? imagePath;

  CountRecord({
    required this.id,
    required this.count,
    required this.timestamp,
    this.imagePath,
    int? standaloneCount,
    int? overlappedCount,
  })  : standaloneCount = standaloneCount ?? count,
        overlappedCount = overlappedCount ?? 0;

  Map<String, dynamic> toJson() => {
        'id': id,
        'count': count,
        'standaloneCount': standaloneCount,
        'overlappedCount': overlappedCount,
        'timestamp': timestamp.toIso8601String(),
        'imagePath': imagePath,
      };

  factory CountRecord.fromJson(Map<String, dynamic> json) => CountRecord(
        id: json['id'] as String,
        count: json['count'] as int,
        standaloneCount: json['standaloneCount'] as int?,
        overlappedCount: json['overlappedCount'] as int?,
        timestamp: DateTime.parse(json['timestamp'] as String),
        imagePath: json['imagePath'] as String?,
      );
}
