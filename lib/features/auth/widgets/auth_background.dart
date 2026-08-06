import 'package:flutter/material.dart';

/// Nền ảnh du lịch dùng chung cho các màn auth (Login/Register/Forgot password),
/// phủ gradient tối để chữ/form phía trên luôn đọc được rõ.
class AuthBackground extends StatelessWidget {
  const AuthBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset('assets/images/auth_background.jpg', fit: BoxFit.cover),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.45),
                Colors.black.withOpacity(0.25),
                Colors.black.withOpacity(0.65),
              ],
            ),
          ),
        ),
        SafeArea(child: child),
      ],
    );
  }
}
