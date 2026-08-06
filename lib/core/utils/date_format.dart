/// Format ngày dạng dd/MM/yyyy — tránh thêm phụ thuộc `intl` chỉ vì 1 hàm.
String formatDateVi(DateTime date) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(date.day)}/${two(date.month)}/${date.year}';
}
