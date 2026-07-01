class CountRecord {
  final String id;
  final int count;
  final DateTime timestamp;
  final String? imagePath;

  CountRecord({
    required this.id,
    required this.count,
    required this.timestamp,
    this.imagePath,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'count': count,
        'timestamp': timestamp.toIso8601String(),
        'imagePath': imagePath,
      };

  factory CountRecord.fromJson(Map<String, dynamic> json) => CountRecord(
        id: json['id'] as String,
        count: json['count'] as int,
        timestamp: DateTime.parse(json['timestamp'] as String),
        imagePath: json['imagePath'] as String?,
      );
}
