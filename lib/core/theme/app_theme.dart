import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Màu thương hiệu — không đổi theo sáng/tối (brand phải nhận ra được ở cả
/// 2 theme). Cho `background/surface/text*` dùng [AppSemanticColors] vì
/// chúng PHẢI đảo theo theme.
class AppColors {
  AppColors._();

  static const primary = Color(0xFF0E7C66);
  static const primaryDark = Color(0xFF0A5C4A);
  static const secondary = Color(0xFFF2A93B);
  static const error = Color(0xFFD64545);
}

class AppSpacing {
  AppSpacing._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

class AppRadius {
  AppRadius._();

  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 20.0;
}

/// Các màu phụ thuộc theme (nền/chữ/viền/shimmer) — tương đương biến CSS
/// `--background`/`--surface`/... ở webapp. Đăng ký qua `ThemeData.extensions`
/// để mọi widget lấy đúng màu theo theme hiện tại thay vì hardcode 1 giá trị
/// tĩnh (đó là lý do bản trước đó không hỗ trợ được dark mode).
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {
  const AppSemanticColors({
    required this.background,
    required this.surface,
    required this.textPrimary,
    required this.textSecondary,
    required this.divider,
    required this.shimmerBase,
    required this.shimmerHighlight,
  });

  final Color background;
  final Color surface;
  final Color textPrimary;
  final Color textSecondary;
  final Color divider;
  final Color shimmerBase;
  final Color shimmerHighlight;

  static const light = AppSemanticColors(
    background: Color(0xFFF7F7F5),
    surface: Color(0xFFFFFFFF),
    textPrimary: Color(0xFF1C1C1E),
    textSecondary: Color(0xFF6B6B6F),
    divider: Color(0xFFE7E7E4),
    shimmerBase: Color(0xFFE9E9E6),
    shimmerHighlight: Color(0xFFF6F6F4),
  );

  static const dark = AppSemanticColors(
    background: Color(0xFF0F1312),
    surface: Color(0xFF171B1A),
    textPrimary: Color(0xFFEEF1EF),
    textSecondary: Color(0xFF93A19C),
    divider: Color(0xFF2A302D),
    shimmerBase: Color(0xFF232A27),
    shimmerHighlight: Color(0xFF2D3532),
  );

  @override
  AppSemanticColors copyWith({
    Color? background,
    Color? surface,
    Color? textPrimary,
    Color? textSecondary,
    Color? divider,
    Color? shimmerBase,
    Color? shimmerHighlight,
  }) {
    return AppSemanticColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      divider: divider ?? this.divider,
      shimmerBase: shimmerBase ?? this.shimmerBase,
      shimmerHighlight: shimmerHighlight ?? this.shimmerHighlight,
    );
  }

  @override
  AppSemanticColors lerp(ThemeExtension<AppSemanticColors>? other, double t) {
    if (other is! AppSemanticColors) return this;
    return AppSemanticColors(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      shimmerBase: Color.lerp(shimmerBase, other.shimmerBase, t)!,
      shimmerHighlight: Color.lerp(shimmerHighlight, other.shimmerHighlight, t)!,
    );
  }
}

/// Tiện lấy [AppSemanticColors] hiện tại mà không cần lặp lại
/// `Theme.of(context).extension<AppSemanticColors>()!` ở mọi nơi.
extension AppSemanticColorsX on BuildContext {
  AppSemanticColors get colors =>
      Theme.of(this).extension<AppSemanticColors>() ?? AppSemanticColors.light;
}

class AppTheme {
  AppTheme._();

  /// Type scale dùng Plus Jakarta Sans — thay Roboto/San Francisco mặc định
  /// để app có "chất riêng" về chữ, letter-spacing âm nhẹ ở tiêu đề lớn cho
  /// cảm giác chắc/sắc nét hơn là để mặc định.
  static TextTheme _textTheme(AppSemanticColors colors) {
    final base = GoogleFonts.plusJakartaSansTextTheme();
    return base
        .copyWith(
          displaySmall: base.displaySmall?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
            color: colors.textPrimary,
          ),
          headlineSmall: base.headlineSmall?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
            color: colors.textPrimary,
          ),
          titleLarge: base.titleLarge?.copyWith(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.2,
            color: colors.textPrimary,
          ),
          titleMedium: base.titleMedium?.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: colors.textPrimary,
          ),
          titleSmall: base.titleSmall?.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
          ),
          bodyLarge: base.bodyLarge?.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w400,
            color: colors.textPrimary,
          ),
          bodyMedium: base.bodyMedium?.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: colors.textPrimary,
          ),
          bodySmall: base.bodySmall?.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: colors.textSecondary,
          ),
          labelLarge: base.labelLarge?.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
          ),
          labelMedium: base.labelMedium?.copyWith(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: colors.textSecondary,
          ),
          labelSmall: base.labelSmall?.copyWith(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: colors.textSecondary,
          ),
        )
        .apply(bodyColor: colors.textPrimary, displayColor: colors.textPrimary);
  }

  static ThemeData _build({
    required Brightness brightness,
    required AppSemanticColors colors,
    required Color primary,
  }) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: brightness,
      primary: primary,
      secondary: AppColors.secondary,
      error: brightness == Brightness.dark ? const Color(0xFFF47171) : AppColors.error,
      surface: colors.surface,
    );
    final textTheme = _textTheme(colors);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colors.background,
      textTheme: textTheme,
      extensions: [colors],
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
      ),
      cardTheme: CardTheme(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          textStyle: textTheme.labelLarge?.copyWith(color: Colors.white),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
      ),
    );
  }

  static ThemeData get light => _build(
        brightness: Brightness.light,
        colors: AppSemanticColors.light,
        primary: AppColors.primary,
      );

  // Sáng brand-600 lên một chút cho nền tối (giống bản web) — #0E7C66 nguyên
  // bản hơi trầm khi đặt cạnh nền gần đen, độ tương phản với chữ trắng cũng
  // sát ngưỡng AA hơn mức cần.
  static ThemeData get dark => _build(
        brightness: Brightness.dark,
        colors: AppSemanticColors.dark,
        primary: const Color(0xFF14916F),
      );
}
