import 'package:flutter/widgets.dart';

import '../../l10n/app_localizations.dart';

/// Nhãn hiển thị cho các tag/sở thích cố định của app (dùng để lọc địa điểm
/// theo `place.tags` và sở thích trong hồ sơ người dùng). Giá trị GỐC vẫn
/// giữ nguyên tiếng Việt — đây là "khoá" khớp với dữ liệu lưu trong
/// Firestore (`places/{id}.tags`, `users/{uid}.preferences`) — hàm này chỉ
/// đổi PHẦN HIỂN THỊ sang tiếng Anh khi app đang ở locale `en`. Tag lạ
/// (không nằm trong danh sách cố định) sẽ hiển thị nguyên văn.
String tagLabel(BuildContext context, String tag) {
  final l10n = AppLocalizations.of(context)!;
  switch (tag) {
    case 'Lịch sử':
      return l10n.tagHistory;
    case 'Ẩm thực':
      return l10n.tagCuisine;
    case 'Thiên nhiên':
      return l10n.tagNature;
    case 'Văn hoá':
      return l10n.tagCulture;
    case 'Biển đảo':
      return l10n.tagBeach;
    case 'Núi rừng':
      return l10n.tagMountain;
    default:
      return tag;
  }
}
