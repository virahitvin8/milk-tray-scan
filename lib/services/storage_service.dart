import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/count_record.dart';

class StorageService {
  static const String _key = 'count_records';

  Future<List<CountRecord>> getRecords() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString(_key);
    if (data == null) return [];
    final List<dynamic> jsonList = json.decode(data) as List<dynamic>;
    return jsonList
        .map((e) => CountRecord.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveRecord(CountRecord record) async {
    final records = await getRecords();
    records.insert(0, record);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      json.encode(records.map((r) => r.toJson()).toList()),
    );
  }

  Future<void> deleteRecord(String id) async {
    final records = await getRecords();
    records.removeWhere((r) => r.id == id);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      json.encode(records.map((r) => r.toJson()).toList()),
    );
  }

  Future<void> clearRecords() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
