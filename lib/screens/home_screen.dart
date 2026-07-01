import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/storage_service.dart';
import '../models/count_record.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final StorageService _storage = StorageService();
  List<CountRecord> _recentRecords = [];
  bool _loadedStats = false;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final records = await _storage.getRecords();
    if (mounted) {
      setState(() {
        _recentRecords = records;
        _loadedStats = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // Compute stats
    int totalCount = 0;
    int totalOverlapped = 0;
    for (final r in _recentRecords) {
      totalCount += r.count;
      totalOverlapped += r.overlappedCount;
    }
    final totalStandalone = totalCount - totalOverlapped;
    final sessionCount = _recentRecords.length;

    // Today's count
    final today = DateTime.now();
    final todayCount = _recentRecords
        .where((r) =>
            r.timestamp.year == today.year &&
            r.timestamp.month == today.month &&
            r.timestamp.day == today.day)
        .fold<int>(0, (sum, r) => sum + r.count);

    // Last 7 days count
    final lastWeek = today.subtract(const Duration(days: 7));
    final weekCount = _recentRecords
        .where((r) => r.timestamp.isAfter(lastWeek))
        .fold<int>(0, (sum, r) => sum + r.count);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
          child: Column(
            children: [
              const SizedBox(height: 16),
              // App icon and title
              Icon(
                Icons.inventory_2_outlined,
                size: 80,
                color: colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'Milk Tray Scan',
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onSurface,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'AI-powered real-time detection\nto count milk packets instantly',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),

              // Quick Stats (only show if data exists)
              if (_loadedStats && sessionCount > 0) ...[
                Row(
                  children: [
                    Icon(Icons.trending_up_rounded,
                        size: 18, color: colorScheme.primary),
                    const SizedBox(width: 6),
                    Text(
                      'Your Statistics',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Stats grid
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        label: 'Today',
                        value: '$todayCount',
                        icon: Icons.today_rounded,
                        color: colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        label: 'This Week',
                        value: '$weekCount',
                        icon: Icons.date_range_rounded,
                        color: colorScheme.secondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        label: 'All Time',
                        value: '$totalCount',
                        icon: Icons.assessment_rounded,
                        color: colorScheme.tertiary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatCard(
                        label: 'Sessions',
                        value: '$sessionCount',
                        icon: Icons.history_rounded,
                        color: colorScheme.error,
                      ),
                    ),
                  ],
                ),
                if (totalOverlapped > 0) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.orange.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.orange.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$totalStandalone standalone',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.green.shade700,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                            color: Colors.orange,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '$totalOverlapped stacked',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.orange.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],

              // Action buttons
              SizedBox(
                width: double.infinity,
                height: 64,
                child: FilledButton.icon(
                  onPressed: () async {
                    await Navigator.pushNamed(context, '/camera');
                    // Reload stats when returning from camera
                    _loadStats();
                  },
                  icon: const Icon(Icons.camera_alt_rounded, size: 28),
                  label: const Text(
                    'Start Counting',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  style: FilledButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 64,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/history'),
                  icon: const Icon(Icons.history_rounded, size: 28),
                  label: const Text(
                    'View History',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    side:
                        BorderSide(color: colorScheme.outline, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Features list
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest
                      .withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'How it works',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _FeatureRow(
                      icon: Icons.camera_alt_rounded,
                      text: 'Point camera at a milk tray',
                      color: colorScheme.primary,
                    ),
                    const SizedBox(height: 8),
                    _FeatureRow(
                      icon: Icons.visibility_rounded,
                      text: 'AI detects every packet — even stacked ones',
                      color: colorScheme.secondary,
                    ),
                    const SizedBox(height: 8),
                    _FeatureRow(
                      icon: Icons.palette_outlined,
                      text: 'Green = standalone, Orange = stacked',
                      color: Colors.orange,
                    ),
                    const SizedBox(height: 8),
                    _FeatureRow(
                      icon: Icons.save_alt_rounded,
                      text: 'Capture & save with photo to history',
                      color: colorScheme.tertiary,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _FeatureRow({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
