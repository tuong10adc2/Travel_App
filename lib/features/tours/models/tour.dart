import 'package:cloud_firestore/cloud_firestore.dart';

class Tour {
  final String id;
  final String name;
  final String description;
  final List<String> placeIds;
  final String coverImage;
  final int price;
  final int durationDays;

  Tour({
    required this.id,
    required this.name,
    required this.description,
    required this.placeIds,
    required this.coverImage,
    required this.price,
    required this.durationDays,
  });

  factory Tour.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Tour(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      description: (data['description'] as String?) ?? '',
      placeIds: List<String>.from(data['placeIds'] as List? ?? const []),
      coverImage: (data['coverImage'] as String?) ?? '',
      price: ((data['price'] as num?) ?? 0).toInt(),
      durationDays: ((data['durationDays'] as num?) ?? 1).toInt(),
    );
  }
}
