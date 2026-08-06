import 'package:cloud_firestore/cloud_firestore.dart';

class Place {
  final String id;
  final String name;
  final String description;
  final String address;
  final List<String> tags;
  final String coverImage;
  final double ratingAvg;
  final int ratingCount;
  final int ticketPrice;
  final int visitDurationMinutes;
  final bool isFeatured;
  final bool has360;
  final List<String> images;
  final Map<String, String> openingHours;

  Place({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.tags,
    required this.coverImage,
    required this.ratingAvg,
    required this.ratingCount,
    required this.ticketPrice,
    required this.visitDurationMinutes,
    required this.isFeatured,
    required this.has360,
    required this.images,
    required this.openingHours,
  });

  factory Place.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Place(
      id: doc.id,
      name: (data['name'] as String?) ?? '',
      description: (data['description'] as String?) ?? '',
      address: (data['address'] as String?) ?? '',
      tags: List<String>.from(data['tags'] as List? ?? const []),
      coverImage: (data['coverImage'] as String?) ?? '',
      ratingAvg: ((data['ratingAvg'] as num?) ?? 0).toDouble(),
      ratingCount: ((data['ratingCount'] as num?) ?? 0).toInt(),
      ticketPrice: ((data['ticketPrice'] as num?) ?? 0).toInt(),
      visitDurationMinutes: ((data['visitDurationMinutes'] as num?) ?? 0).toInt(),
      isFeatured: (data['isFeatured'] as bool?) ?? false,
      has360: (data['has360'] as bool?) ?? false,
      images: List<String>.from(data['images'] as List? ?? const []),
      openingHours: Map<String, String>.from(data['openingHours'] as Map? ?? const {}),
    );
  }
}
