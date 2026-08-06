import 'package:cloud_firestore/cloud_firestore.dart';

class Hotspot {
  final String targetMediaId;
  final double yaw;
  final double pitch;
  final String label;

  Hotspot({
    required this.targetMediaId,
    required this.yaw,
    required this.pitch,
    required this.label,
  });

  factory Hotspot.fromMap(Map<String, dynamic> map) {
    return Hotspot(
      targetMediaId: (map['targetMediaId'] as String?) ?? '',
      yaw: ((map['yaw'] as num?) ?? 0).toDouble(),
      pitch: ((map['pitch'] as num?) ?? 0).toDouble(),
      label: (map['label'] as String?) ?? '',
    );
  }
}

class Media360 {
  final String id;
  final String placeId;
  final String type;
  final String url;
  final String title;
  final int order;
  final List<Hotspot> hotspots;

  Media360({
    required this.id,
    required this.placeId,
    required this.type,
    required this.url,
    required this.title,
    required this.order,
    required this.hotspots,
  });

  factory Media360.fromDoc(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? {};
    return Media360(
      id: doc.id,
      placeId: (data['placeId'] as String?) ?? '',
      type: (data['type'] as String?) ?? 'image',
      url: (data['url'] as String?) ?? '',
      title: (data['title'] as String?) ?? '',
      order: ((data['order'] as num?) ?? 0).toInt(),
      hotspots: (data['hotspots'] as List? ?? const [])
          .map((e) => Hotspot.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList(),
    );
  }
}
