import 'package:cloud_firestore/cloud_firestore.dart';

class ItineraryItem {
  final String id;
  final String placeId;
  final int dayIndex;
  final int order;
  final String? note;

  ItineraryItem({
    required this.id,
    required this.placeId,
    required this.dayIndex,
    required this.order,
    required this.note,
  });

  factory ItineraryItem.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return ItineraryItem(
      id: doc.id,
      placeId: (data['placeId'] as String?) ?? '',
      dayIndex: ((data['dayIndex'] as num?) ?? 0).toInt(),
      order: ((data['order'] as num?) ?? 0).toInt(),
      note: data['note'] as String?,
    );
  }
}
