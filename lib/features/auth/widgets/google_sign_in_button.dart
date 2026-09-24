import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

/// Nút "Đăng nhập với Google" theo đúng phong cách nút chính thức của Google:
/// nền trắng, viền xám mảnh, logo "G" 4 màu, chữ Roboto medium màu xám đậm.
class GoogleSignInButton extends StatelessWidget {
  const GoogleSignInButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !isLoading;
    return Material(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Color(0xFFDADCE0)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        splashColor: const Color(0x1F4285F4),
        highlightColor: const Color(0x0F4285F4),
        onTap: enabled ? onPressed : null,
        child: SizedBox(
          height: 48,
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: isLoading
                      ? const CircularProgressIndicator(
                          strokeWidth: 2, color: Color(0xFF4285F4))
                      : SvgPicture.asset('assets/illustrations/google_g.svg'),
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: GoogleFonts.roboto(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                    color: const Color(0xFF3C4043),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
