import 'package:cloud_firestore/cloud_firestore.dart';

class Itinerary {
  final String id;
  final String userId;
  final String name;
  final DateTime startDate;
  final DateTime? endDate;
  final bool isShared;

  Itinerary({
    required this.id,
    required this.userId,
    required this.name,
    required this.startDate,
    required this.endDate,
    required this.isShared,
  });

  factory Itinerary.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Itinerary(
      id: doc.id,
      userId: (data['userId'] as String?) ?? '',
      name: (data['name'] as String?) ?? '',
      startDate: (data['startDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      endDate: (data['endDate'] as Timestamp?)?.toDate(),
      isShared: (data['isShared'] as bool?) ?? false,
    );
  }
}
